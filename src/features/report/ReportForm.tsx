import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera, UploadCloud, MapPin, LocateFixed, Search, ArrowLeft, ArrowRight, Check, Satellite, AlertTriangle,
  ImageOff, ThumbsUp, PartyPopper, Loader2, X, Clock3,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, coordLabel, reverseGeocode, searchAddress, uploadImage } from '../../lib/api';
import { CATEGORIES, DUPLICATE_RADIUS_M, categoryMeta, distanceMeters, isOpen, nearestWard, slaHoursFor } from '../../lib/civic';
import { useApp } from '../../app/AppContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Textarea, Input } from '../../components/ui/Field';
import { Segmented } from '../../components/ui/Segmented';
import { StatusChip } from '../../components/ui/StatusChip';
import { useToast } from '../../components/ui/Toast';
import { BaseMap, Recenter, HYDERABAD } from '../../components/map/BaseMap';
import { LocationPicker } from '../../components/map/LocationPicker';
import { Circle } from 'react-leaflet';
import { issueTitle, fmtDistance, timeAgo } from '../issues/IssueCard';
import { useUpvote, hasVoted } from '../issues/useIssueActions';

const STEPS = ['Photo', 'Location', 'Details', 'Review'] as const;
type Priority = 'Normal' | 'High' | 'Emergency';

interface PhotoInfo { gps: { lat: number; lng: number } | null; takenAt: Date | null; checked: boolean }

export function ReportForm() {
  const { user, issues, refresh, refreshMe, openIssue, go } = useApp();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoInfo, setPhotoInfo] = useState<PhotoInfo>({ gps: null, takenAt: null, checked: false });
  const [dragOver, setDragOver] = useState(false);
  const [pos, setPos] = useState<[number, number]>(user?.latitude != null ? [user.latitude, user.longitude] : HYDERABAD);
  const [address, setAddress] = useState<string>(user?.locationAddress || '');
  const [locSource, setLocSource] = useState<'home' | 'gps' | 'photo' | 'map' | 'search'>('home');
  const [locBusy, setLocBusy] = useState<'gps' | 'search' | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ id: string; isDuplicate?: boolean; duplicateOf?: string; status?: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------------- photo
  const takePhoto = useCallback(async (f: File | null) => {
    setError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('That file is not an image. Use a JPG, PNG or HEIC photo.');
    if (f.size > 15 * 1024 * 1024) return setError('Photo is larger than 15 MB — try a smaller one.');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhotoInfo({ gps: null, takenAt: null, checked: false });
    try {
      const exifr = (await import('exifr')).default;
      const [gps, meta] = await Promise.all([exifr.gps(f).catch(() => null), exifr.parse(f, ['DateTimeOriginal']).catch(() => null)]);
      const g = gps && typeof gps.latitude === 'number' ? { lat: gps.latitude, lng: gps.longitude } : null;
      setPhotoInfo({ gps: g, takenAt: meta?.DateTimeOriginal ? new Date(meta.DateTimeOriginal) : null, checked: true });
      if (g) {
        setPos([g.lat, g.lng]);
        setLocSource('photo');
        reverseGeocode(g.lat, g.lng).then(a => setAddress(a || coordLabel(g.lat, g.lng)));
      }
    } catch {
      setPhotoInfo(p => ({ ...p, checked: true }));
    }
  }, []);

  // -------------------------------------------------------------- location
  const moveTo = useCallback((lat: number, lng: number, source: typeof locSource) => {
    setPos([lat, lng]);
    setLocSource(source);
    setAddress(coordLabel(lat, lng));
    reverseGeocode(lat, lng).then(a => a && setAddress(a));
  }, []);

  const detect = () => {
    if (!navigator.geolocation) return setError('Location is not available in this browser — drop the pin on the map instead.');
    setLocBusy('gps');
    navigator.geolocation.getCurrentPosition(
      p => { moveTo(p.coords.latitude, p.coords.longitude, 'gps'); setLocBusy(null); },
      () => { setLocBusy(null); setError('We could not get your location. Drag the pin or search for an address.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const doSearch = async () => {
    if (!query.trim()) return;
    setLocBusy('search');
    const r = await searchAddress(query.includes('Hyderabad') ? query : `${query}, Hyderabad`);
    setLocBusy(null);
    if (!r) return setError('No match for that address — try a nearby landmark, or drag the pin.');
    setError('');
    setPos([r.lat, r.lng]); setAddress(r.label); setLocSource('search');
  };

  // ---------------------------------------------------------- duplicates
  const duplicates = useMemo(() => {
    if (!category) return [];
    return issues
      .filter(i => i.category === category && isOpen(i) && typeof i.latitude === 'number')
      .map(i => ({ ...i, _d: distanceMeters(pos[0], pos[1], i.latitude, i.longitude) }))
      .filter(i => i._d <= DUPLICATE_RADIUS_M)
      .sort((a, b) => a._d - b._d);
  }, [issues, category, pos[0], pos[1]]);
  const openNearby = useMemo(() => issues.filter(i => isOpen(i) && distanceMeters(pos[0], pos[1], i.latitude, i.longitude) <= DUPLICATE_RADIUS_M).length, [issues, pos[0], pos[1]]);

  // ------------------------------------------------------------ navigation
  const canNext = [!!file, !!pos, !!category && description.trim().length >= 10, true][step];
  const next = () => {
    setError('');
    if (step === 0 && !file) return setError('Add a photo first — it is how crews find and verify the problem.');
    if (step === 2 && !category) return setError('Pick the category that fits best.');
    if (step === 2 && description.trim().length < 10) return setError('Add a short description (at least 10 characters).');
    setStep(s => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => { setError(''); setStep(s => Math.max(0, s - 1)); };

  const submit = async () => {
    if (!file || !category) return;
    setSubmitting(true);
    setError('');
    try {
      const imageUrl = await uploadImage(file);
      const res = await api<any>('/api/reportIssue', {
        method: 'POST',
        body: { category, description: description.trim(), imageUrl, locationAddress: address || coordLabel(pos[0], pos[1]), latitude: pos[0], longitude: pos[1], priority, ward: nearestWard(pos[0], pos[1]) },
      });
      await refresh();
      refreshMe();
      if (res?.aiAnalysis?.isFake) {
        toast({ tone: 'error', title: 'Report flagged for review', body: res.aiAnalysis.fakeReason || 'The photo did not seem to match the description.' });
      }
      setDone({ id: res.id, isDuplicate: res.isDuplicate, duplicateOf: res.duplicateOf, status: res.status });
    } catch (e: any) {
      setError(e.message || 'Could not submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0); setFile(null); setPreview(null); setCategory(''); setDescription(''); setPriority('Normal'); setDone(null); setError('');
  };

  if (done) return <Success done={done} onTrack={() => openIssue(done.duplicateOf || done.id)} onAnother={reset} onHome={() => go('dashboard')} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="New report" title="Report a civic issue" subtitle="Four quick steps. Your report is public, gets a fix-by deadline, and earns you 10 points." />
      <Stepper step={step} onJump={i => i < step && setStep(i)} />

      <Card className="mt-5 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="p-5 sm:p-7">
            {step === 0 && (
              <div>
                <StepTitle n={1} title="Add a photo" body="A clear, wide shot helps the crew find it. We read the photo's GPS tag if it has one." />
                {!preview ? (
                  <label
                    htmlFor="report-photo"
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); takePhoto(e.dataTransfer.files?.[0] || null); }}
                    className={cn('mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-6 py-14 text-center transition-colors',
                      dragOver ? 'border-brand bg-brand-soft' : 'border-line-strong hover:border-brand hover:bg-surface-muted')}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand"><UploadCloud size={26} /></span>
                    <span className="mt-4 text-[15px] font-semibold">Drag a photo here, or <span className="text-brand underline underline-offset-2">browse</span></span>
                    <span className="mt-1 text-[13px] text-fg-muted">On a phone this opens the camera. JPG, PNG or HEIC up to 15 MB.</span>
                  </label>
                ) : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-[1.3fr_1fr]">
                    <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken aspect-[4/3]">
                      <img src={preview} alt="Your issue photo" className="h-full w-full object-cover" />
                      <button onClick={() => { setFile(null); setPreview(null); }} aria-label="Remove photo" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/75"><X size={16} /></button>
                    </div>
                    <div className="space-y-3">
                      <PhotoCheck ok label="Photo attached" detail={`${file?.name} · ${((file?.size || 0) / 1024 / 1024).toFixed(1)} MB`} />
                      {!photoInfo.checked ? (
                        <PhotoCheck pending label="Reading photo location…" />
                      ) : photoInfo.gps ? (
                        <PhotoCheck ok icon={<Satellite size={15} />} label="GPS found in photo" detail={`${coordLabel(photoInfo.gps.lat, photoInfo.gps.lng)} — pin placed automatically`} />
                      ) : (
                        <PhotoCheck warn icon={<MapPin size={15} />} label="No GPS tag in this photo" detail="No problem — you'll drop the pin on the next step." />
                      )}
                      {photoInfo.takenAt && (Date.now() - photoInfo.takenAt.getTime()) > 7 * 86400_000 && (
                        <PhotoCheck warn icon={<Clock3 size={15} />} label="Photo is more than a week old" detail="If it's still there, a fresh photo verifies faster." />
                      )}
                      <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()} leftIcon={<Camera size={15} />}>Use a different photo</Button>
                    </div>
                  </div>
                )}
                <input ref={fileInput} id="report-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => takePhoto(e.target.files?.[0] || null)} />
              </div>
            )}

            {step === 1 && (
              <div>
                <StepTitle n={2} title="Where is it?" body="Drag the pin or tap the map to the exact spot. The circle shows the 100 m area we check for duplicates." />
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
                    <Input aria-label="Search address or landmark" className="pl-9" placeholder="Search a street or landmark, e.g. Road No. 12" value={query}
                      onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), doSearch())} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={doSearch} loading={locBusy === 'search'}>Search</Button>
                    <Button variant="secondary" onClick={detect} loading={locBusy === 'gps'} leftIcon={<LocateFixed size={16} />}>Use my location</Button>
                  </div>
                </div>
                <BaseMap center={pos} zoom={17} className="mt-3 h-[340px] rounded-[var(--radius-lg)] border border-line" label="Choose the issue location">
                  <Recenter center={pos} />
                  <Circle center={pos} radius={DUPLICATE_RADIUS_M} pathOptions={{ color: '#059669', weight: 1.5, fillOpacity: 0.08, dashArray: '4 4' }} />
                  <LocationPicker position={pos} onChange={(a, b) => moveTo(a, b, 'map')} category={category || 'Other'} />
                </BaseMap>
                <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] bg-surface-muted p-3 text-[13px]">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand" />
                  <div className="min-w-0">
                    <p className="font-semibold text-fg line-clamp-2">{address || coordLabel(pos[0], pos[1])}</p>
                    <p className="text-xs text-fg-muted mt-0.5">
                      {{ home: 'Starting from your saved area', gps: 'From your device location', photo: "From the photo's GPS tag", map: 'Set on the map', search: 'From address search' }[locSource]}
                      {' · '}{nearestWard(pos[0], pos[1])}{openNearby ? ` · ${openNearby} open issue${openNearby > 1 ? 's' : ''} within 100 m` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepTitle n={3} title="What's the problem?" body="Pick a category — it decides which crew gets it and the public fix-by deadline." />
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Category">
                  {CATEGORIES.map(c => {
                    const m = categoryMeta(c);
                    const Icon = m.icon;
                    const active = category === c;
                    return (
                      <button key={c} role="radio" aria-checked={active} onClick={() => setCategory(c)}
                        className={cn('flex flex-col items-start gap-2 rounded-[var(--radius-md)] border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150',
                          active ? 'border-transparent ring-2 shadow-[var(--shadow-e2)]' : 'border-line hover:border-line-strong hover:bg-surface-muted')}
                        style={active ? { background: m.soft, boxShadow: `0 0 0 2px ${m.color}` } : undefined}>
                        <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)]" style={{ background: m.soft, color: m.color }}><Icon size={17} strokeWidth={2.3} /></span>
                        <span className="text-[13px] font-semibold leading-tight text-fg">{c}</span>
                        <span className="text-[11px] text-fg-subtle">Fix within {slaHoursFor(c)} h</span>
                      </button>
                    );
                  })}
                </div>

                {duplicates.length > 0 && <DuplicateWarning duplicates={duplicates} onOpen={openIssue} />}

                <div className="mt-5">
                  <label htmlFor="report-desc" className="label">Describe it</label>
                  <Textarea id="report-desc" rows={4} maxLength={600} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="What is wrong, how big is it, and is anyone at risk? e.g. Deep pothole in the left lane outside the metro pillar, two-wheelers swerving." />
                  <div className="mt-1.5 flex justify-between text-xs text-fg-subtle"><span>{description.trim().length < 10 ? 'At least 10 characters' : 'Looks good'}</span><span className="tabular-nums">{description.length}/600</span></div>
                </div>
                <div className="mt-4">
                  <p className="label">How urgent?</p>
                  <Segmented label="Urgency" value={priority} onChange={setPriority} options={[{ value: 'Normal', label: 'Normal' }, { value: 'High', label: 'High' }, { value: 'Emergency', label: 'Emergency' }]} />
                  {priority === 'Emergency' && <p className="hint text-danger">Emergencies (live wires, gas, open manholes) get half the normal deadline and alert the control room.</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepTitle n={4} title="Review and submit" body="Check everything looks right. You can track progress from My reports." />
                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.2fr]">
                  <div className="space-y-3">
                    {preview && <img src={preview} alt="Your issue photo" className="aspect-[4/3] w-full rounded-[var(--radius-lg)] object-cover" />}
                    <BaseMap center={pos} zoom={16} className="h-36 rounded-[var(--radius-lg)] border border-line" label="Issue location preview">
                      <LocationPicker position={pos} onChange={(a, b) => moveTo(a, b, 'map')} category={category} />
                    </BaseMap>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <ReviewRow label="Category" onEdit={() => setStep(2)}>
                      <span className="inline-flex items-center gap-2 font-semibold" style={{ color: categoryMeta(category).color }}>{category}</span>
                    </ReviewRow>
                    <ReviewRow label="Description" onEdit={() => setStep(2)}><span className="text-fg">{description}</span></ReviewRow>
                    <ReviewRow label="Location" onEdit={() => setStep(1)}><span className="text-fg">{address || coordLabel(pos[0], pos[1])}</span></ReviewRow>
                    <ReviewRow label="Urgency" onEdit={() => setStep(2)}><span className={cn('font-semibold', priority === 'Emergency' ? 'text-danger' : 'text-fg')}>{priority}</span></ReviewRow>
                    <div className="rounded-[var(--radius-md)] bg-brand-soft p-3 text-[13px] text-brand-strong">
                      <p className="font-semibold">Public deadline: fixed within {slaHoursFor(category, priority)} hours</p>
                      <p className="mt-0.5 opacity-90">Everyone can see the countdown. If it slips, it lands on the city's overdue wall.</p>
                    </div>
                  </dl>
                </div>
                {duplicates.length > 0 && <DuplicateWarning duplicates={duplicates} onOpen={openIssue} />}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div role="alert" className="mx-5 sm:mx-7 mb-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-danger-soft p-3 text-[13px] font-medium text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-muted/50 px-5 py-4 sm:px-7">
          <Button variant="ghost" onClick={step === 0 ? () => go('dashboard') : back} leftIcon={<ArrowLeft size={16} />}>{step === 0 ? 'Cancel' : 'Back'}</Button>
          <span className="hidden sm:block text-xs font-medium text-fg-subtle">Step {step + 1} of {STEPS.length}</span>
          {step < 3 ? (
            <Button onClick={next} disabled={!canNext} className="min-w-[120px]">Continue <ArrowRight size={16} /></Button>
          ) : (
            <Button onClick={submit} loading={submitting} className="min-w-[150px]" leftIcon={!submitting ? <Check size={16} /> : undefined}>{submitting ? 'Submitting…' : 'Submit report'}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Progress">
      {STEPS.map((s, i) => {
        const state = i < step ? 'done' : i === step ? 'current' : 'todo';
        return (
          <li key={s}>
            <button onClick={() => onJump(i)} disabled={i >= step} aria-current={state === 'current' ? 'step' : undefined} className="group w-full text-left disabled:cursor-default">
              <span className={cn('block h-1.5 rounded-full transition-colors duration-200', state === 'todo' ? 'bg-surface-sunken' : 'bg-brand')} />
              <span className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold">
                <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[11px]', state === 'done' ? 'bg-brand text-brand-fg' : state === 'current' ? 'bg-fg text-bg' : 'bg-surface-sunken text-fg-subtle')}>
                  {state === 'done' ? <Check size={12} strokeWidth={3} /> : i + 1}
                </span>
                <span className={state === 'todo' ? 'text-fg-subtle' : 'text-fg'}>{s}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

const StepTitle = ({ n, title, body }: { n: number; title: string; body: string }) => (
  <div>
    <p className="eyebrow">Step {n}</p>
    <h2 className="mt-1 text-xl font-semibold">{title}</h2>
    <p className="mt-1 text-sm text-fg-muted">{body}</p>
  </div>
);

function PhotoCheck({ ok, warn, pending, label, detail, icon }: { ok?: boolean; warn?: boolean; pending?: boolean; label: string; detail?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-[var(--radius-md)] border p-3', warn ? 'border-warning/30 bg-warning-soft' : 'border-line bg-surface-muted')}>
      <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', pending ? 'text-fg-subtle' : warn ? 'bg-warning/15 text-warning' : 'bg-brand text-brand-fg')}>
        {pending ? <Loader2 size={15} className="animate-spin" /> : icon || <Check size={13} strokeWidth={3} />}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-fg">{label}</p>
        {detail && <p className="text-xs text-fg-muted mt-0.5 break-words">{detail}</p>}
      </div>
    </div>
  );
}

function ReviewRow({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
      <div className="min-w-0"><dt className="eyebrow">{label}</dt><dd className="mt-1 break-words">{children}</dd></div>
      <button onClick={onEdit} className="shrink-0 text-xs font-semibold text-brand hover:underline">Edit</button>
    </div>
  );
}

/** Same category, still open, within 100 m → suggest upvoting instead of duplicating. */
function DuplicateWarning({ duplicates, onOpen }: { duplicates: any[]; onOpen: (id: string) => void }) {
  const { user } = useApp();
  const { upvote, busy } = useUpvote();
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-[var(--radius-lg)] border border-warning/35 bg-warning-soft p-4" role="status">
      <p className="flex items-center gap-2 text-sm font-semibold text-fg"><AlertTriangle size={16} className="text-warning" />
        Looks like this was already reported {duplicates[0]._d < 15 ? 'at this spot' : `${fmtDistance(duplicates[0]._d)} away`}
      </p>
      <p className="mt-1 text-[13px] text-fg-muted">Upvoting the existing report moves it up the queue faster than a duplicate. You can still submit yours if it's a different problem.</p>
      <ul className="mt-3 space-y-2">
        {duplicates.slice(0, 2).map(d => {
          const voted = hasVoted(d, user?.id);
          return (
            <li key={d.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-2.5">
              {d.imageUrl ? <img src={d.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-sm)] bg-surface-muted"><ImageOff size={16} /></span>}
              <button onClick={() => onOpen(d.id)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13px] font-semibold">{issueTitle(d)}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-fg-muted"><StatusChip issue={d} size="sm" />{d.upvotes || 0} upvotes · {timeAgo(d.timestamp)}</span>
              </button>
              <Button size="sm" variant={voted ? 'primary' : 'secondary'} onClick={() => upvote(d)} loading={busy === d.id} leftIcon={<ThumbsUp size={14} />}>{voted ? 'Upvoted' : 'Upvote instead'}</Button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

function Success({ done, onTrack, onAnother, onHome }: { done: { id: string; isDuplicate?: boolean; duplicateOf?: string; status?: string }; onTrack: () => void; onAnother: () => void; onHome: () => void }) {
  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-8 text-center">
        <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
          <PartyPopper size={28} />
        </motion.span>
        <h1 className="mt-5 text-2xl font-semibold">{done.isDuplicate ? 'Linked to an existing report' : 'Report submitted'}</h1>
        <p className="mt-2 text-sm text-fg-muted">
          {done.isDuplicate
            ? 'Someone already reported this within 100 m. We linked yours to it so the crew sees one stronger ticket.'
            : done.status === 'Assigned' ? 'It was routed straight to the right crew. You will get a notification at every step.' : 'Neighbours can now confirm it, and an officer will assign a crew.'}
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-fg-muted">Tracking ID <span className="font-mono text-fg">#{done.id}</span></p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={onTrack}>Track this issue</Button>
          <Button variant="secondary" onClick={onAnother}>Report another</Button>
          <Button variant="ghost" onClick={onHome}>Home</Button>
        </div>
      </Card>
    </div>
  );
}
