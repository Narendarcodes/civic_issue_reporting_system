import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LocateFixed, Search, MapPin, ArrowRight } from 'lucide-react';
import { api, coordLabel, reverseGeocode, searchAddress } from '../../lib/api';
import { WARDS, nearestWard } from '../../lib/civic';
import { cn } from '../../lib/utils';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { BaseMap, Recenter, HYDERABAD } from '../../components/map/BaseMap';
import { LocationPicker } from '../../components/map/LocationPicker';

/** First-run (or profile) step: where should we show nearby issues from? */
export function LocationSetup({ user, onComplete, embedded }: { user: any; onComplete: () => void; embedded?: boolean }) {
  const [pos, setPos] = useState<[number, number]>(user?.latitude != null ? [user.latitude, user.longitude] : HYDERABAD);
  const [address, setAddress] = useState<string>(user?.locationAddress || '');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<'gps' | 'search' | 'save' | null>(null);
  const [error, setError] = useState('');

  const move = (lat: number, lng: number) => {
    setPos([lat, lng]);
    setAddress(coordLabel(lat, lng));
    reverseGeocode(lat, lng).then(a => a && setAddress(a));
  };

  const detect = () => {
    if (!navigator.geolocation) return setError('Location isn’t available — pick your area below or search.');
    setBusy('gps');
    navigator.geolocation.getCurrentPosition(
      p => { move(p.coords.latitude, p.coords.longitude); setBusy(null); setError(''); },
      () => { setBusy(null); setError('Location permission was denied. Pick your area below or search.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  useEffect(() => { if (user?.latitude == null) detect(); }, []);

  const search = async () => {
    if (!q.trim()) return;
    setBusy('search');
    const r = await searchAddress(/hyderabad/i.test(q) ? q : `${q}, Hyderabad`);
    setBusy(null);
    if (!r) return setError('No match — try a landmark or pick an area chip.');
    setError(''); setPos([r.lat, r.lng]); setAddress(r.label);
  };

  const save = async () => {
    setBusy('save');
    try {
      await api('/api/user/location', { method: 'PUT', body: { locationAddress: address || `${nearestWard(pos[0], pos[1])}, Hyderabad`, latitude: pos[0], longitude: pos[1] } });
      onComplete();
    } catch (e: any) {
      setError(e.message); setBusy(null);
    }
  };

  const body = (
    <div className={cn(embedded ? 'p-5' : 'p-6 sm:p-8')}>
      {!embedded && <>
        <p className="eyebrow">One last step</p>
        <h1 className="mt-1 text-2xl font-semibold">Where's your neighbourhood?</h1>
        <p className="mt-1.5 text-sm text-fg-muted">We use it to show issues near you and to rank your ward. You can change it anytime.</p>
      </>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <Input aria-label="Search your area" className="pl-9" placeholder="Search area or landmark" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), search())} />
        </div>
        <Button variant="secondary" onClick={search} loading={busy === 'search'}>Search</Button>
        <Button variant="secondary" onClick={detect} loading={busy === 'gps'} leftIcon={<LocateFixed size={16} />}>Detect</Button>
      </div>
      <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar" role="group" aria-label="Popular areas">
        {WARDS.slice(0, 9).map(w => (
          <button key={w.name} onClick={() => { setPos([w.lat, w.lng]); setAddress(`${w.name}, Hyderabad, Telangana`); }}
            className={cn('h-8 shrink-0 rounded-full border px-3 text-[13px] font-semibold', nearestWard(pos[0], pos[1]) === w.name ? 'border-brand bg-brand-soft text-brand-strong' : 'border-line text-fg-muted hover:border-line-strong')}>
            {w.name}
          </button>
        ))}
      </div>
      <BaseMap center={pos} zoom={15} className="mt-3 h-64 sm:h-72 rounded-[var(--radius-lg)] border border-line" label="Your area">
        <Recenter center={pos} />
        <LocationPicker position={pos} onChange={move} category="Other" />
      </BaseMap>
      <p className="mt-3 flex items-start gap-2 text-[13px] text-fg-muted"><MapPin size={15} className="mt-0.5 shrink-0 text-brand" /><span className="line-clamp-2">{address || 'Drag the pin to your street'}</span></p>
      {error && <p role="alert" className="mt-3 text-[13px] font-medium text-danger">{error}</p>}
      <Button size="lg" className="mt-5 w-full" onClick={save} loading={busy === 'save'}>{embedded ? 'Save area' : 'Continue'} <ArrowRight size={16} /></Button>
    </div>
  );

  if (embedded) return body;
  return (
    <div className="min-h-screen bg-bg px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-xl">
        <div className="mb-6"><Logo /></div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><Card className="overflow-hidden">{body}</Card></motion.div>
      </div>
    </div>
  );
}
