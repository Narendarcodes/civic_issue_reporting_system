import React, { useEffect, useState } from 'react';
import { Camera, ImagePlus, Flag, UserCheck, Hammer, CheckCircle2, ShieldCheck, Mail, MapPin, Clock3 } from 'lucide-react';
import { format } from 'date-fns';
import { api, uploadImage } from '../../lib/api';
import { cn } from '../../lib/utils';
import { formatDuration, slaState, stageOf, shortAddress } from '../../lib/civic';
import { useApp } from '../../app/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { SlaBadge, SlaBar } from '../../components/ui/SlaBadge';
import { Select, Textarea } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { StatusTimeline } from '../issues/StatusTimeline';
import { ClosureProof } from '../issues/ClosureProof';
import { issueTitle, timeAgo } from '../issues/IssueCard';

let teamsCache: any[] | null = null;
export function useTeams() {
  const [teams, setTeams] = useState<any[]>(teamsCache || []);
  useEffect(() => {
    if (teamsCache) return;
    api<any[]>('/api/admin/teams').then(t => { teamsCache = Array.isArray(t) ? t : []; setTeams(teamsCache); }).catch(() => setTeams([]));
  }, []);
  return teams;
}
export const teamName = (teams: any[], id?: string) => (id ? teams.find(t => t.id === id || t.name === id)?.name || id : 'Unassigned');

/** Admin/officer workspace for one ticket: assign, progress, resolve with after-photo, reject. */
export function ManageIssueDrawer({ issue, onClose }: { issue: any | null; onClose: () => void }) {
  const { refresh, issues } = useApp();
  const toast = useToast();
  const teams = useTeams();
  const live = issue ? issues.find(i => i.id === issue.id) || issue : null;
  const [busy, setBusy] = useState<string | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { setAfter(null); setAfterPreview(null); setNotes(''); }, [issue?.id]);
  if (!live) return <Modal open={false} onClose={onClose}><div /></Modal>;

  const stage = stageOf(live);
  const sla = slaState(live);

  const update = async (label: string, body: any, success: string) => {
    setBusy(label);
    try {
      await api(`/api/admin/issues/${live.id}`, { method: 'PUT', body });
      await refresh();
      toast({ tone: 'success', title: success });
    } catch (e: any) {
      toast({ tone: 'error', title: 'Update failed', body: e.message });
    } finally {
      setBusy(null);
    }
  };

  const resolve = async () => {
    setBusy('resolve');
    try {
      const resolutionImage = after ? await uploadImage(after) : undefined;
      await api(`/api/admin/issues/${live.id}`, { method: 'PUT', body: { status: 'Resolved', resolutionImage, ...(notes ? { adminNotes: notes } : {}) } });
      await refresh();
      toast({ tone: 'success', title: 'Marked resolved', body: after ? 'Before/after proof attached — the reporter has been asked to confirm.' : 'No after photo — this closure is queued for manual review.' });
    } catch (e: any) {
      toast({ tone: 'error', title: 'Could not resolve', body: e.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={!!issue} onClose={onClose} side="right" title={<span className="font-mono text-xs text-fg-subtle">Ticket #{live.id}</span>} labelledBy="manage-title">
      <div className="space-y-5 p-5">
        <div className="flex gap-4">
          {live.imageUrl ? <img src={live.imageUrl} alt="Reported photo" className="h-24 w-32 shrink-0 rounded-[var(--radius-md)] object-cover" /> : <div className="grid h-24 w-32 place-items-center rounded-[var(--radius-md)] bg-surface-muted"><Camera size={20} /></div>}
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5"><CategoryBadge category={live.category} /><StatusChip issue={live} size="sm" /></div>
            <h2 id="manage-title" className="mt-2 text-base font-semibold leading-snug">{issueTitle(live)}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-muted"><MapPin size={12} />{shortAddress(live.locationAddress)}{live.ward ? ` · ${live.ward}` : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <Info label="Reporter" value={live.username || 'Citizen'} sub={live.userEmail} icon={<Mail size={13} />} />
          <Info label="Reported" value={timeAgo(live.timestamp)} sub={live.timestamp ? format(new Date(live.timestamp), 'd MMM yyyy, h:mm a') : ''} icon={<Clock3 size={13} />} />
          <Info label="Priority" value={live.priority || 'Normal'} sub={`${live.upvotes || 0} upvotes`} />
          <Info label="Crew" value={teamName(teams, live.assignedTeam)} />
        </div>

        <div className="rounded-[var(--radius-lg)] border border-line p-4">
          <div className="flex items-center justify-between"><p className="eyebrow">SLA</p><SlaBadge issue={live} size="sm" /></div>
          <div className="mt-3"><SlaBar issue={live} /></div>
          <p className="mt-2 text-xs text-fg-muted">Target {sla.hours} h · due {format(new Date(sla.dueAt), 'd MMM, h:mm a')}{sla.overdue ? ` · ${formatDuration(sla.remainingMs)} late` : ''}</p>
        </div>

        {stage !== 'Resolved' && stage !== 'Rejected' && (
          <section className="space-y-3 rounded-[var(--radius-lg)] border border-line p-4" aria-label="Actions">
            <p className="eyebrow">Move it forward</p>
            <div>
              <label htmlFor="assign-team" className="label">Assign crew</label>
              <Select id="assign-team" value={live.assignedTeam || ''} disabled={!!busy} onChange={e => e.target.value && update('assign', { assignedTeam: e.target.value }, `Assigned to ${teamName(teams, e.target.value)}`)}>
                <option value="">Select a crew…</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name} · {t.activeTasks || 0} active</option>)}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {stage === 'Reported' && <Button size="sm" variant="secondary" loading={busy === 'verify'} onClick={() => update('verify', { status: 'Verified' }, 'Marked verified')} leftIcon={<ShieldCheck size={14} />}>Verify</Button>}
              {stage !== 'In progress' && <Button size="sm" variant="secondary" loading={busy === 'progress'} onClick={() => update('progress', { status: 'In Progress' }, 'Crew is on it')} leftIcon={<Hammer size={14} />}>Start work</Button>}
            </div>

            <div className="border-t border-line pt-3">
              <label htmlFor="after-photo" className="label">After photo <span className="font-normal text-fg-subtle">(closure proof)</span></label>
              <label htmlFor="after-photo" className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-line-strong p-3 hover:bg-surface-muted">
                {afterPreview ? <img src={afterPreview} alt="After photo preview" className="h-14 w-20 rounded-[var(--radius-sm)] object-cover" /> : <span className="grid h-14 w-20 place-items-center rounded-[var(--radius-sm)] bg-surface-muted text-fg-subtle"><ImagePlus size={18} /></span>}
                <span className="text-[13px] text-fg-muted">{after ? after.name : 'Upload the crew’s photo of the fixed spot'}</span>
              </label>
              <input id="after-photo" type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0] || null; setAfter(f); setAfterPreview(f ? URL.createObjectURL(f) : null); }} />
              <Textarea aria-label="Closure note" rows={2} className="mt-2 min-h-0" placeholder="Closure note (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
              <p className="hint">With a Gemini key, the before/after pair is checked automatically. Without one, the closure is queued for manual review.</p>
              <Button className="mt-3 w-full" loading={busy === 'resolve'} onClick={resolve} leftIcon={<CheckCircle2 size={16} />}>Mark resolved</Button>
            </div>
          </section>
        )}

        {(live.resolutionImage || live.workerImageUrl || live.closureCheck) && (
          <section aria-label="Closure proof" className="space-y-2">
            <p className="eyebrow">Closure proof</p>
            <ClosureProof issue={live} />
          </section>
        )}

        <section className="rounded-[var(--radius-lg)] border border-line p-4">
          <p className="eyebrow mb-4">Timeline</p>
          <StatusTimeline issue={live} />
        </section>

        {live.adminNotes && (
          <section className="rounded-[var(--radius-lg)] bg-surface-muted p-4 text-[13px] text-fg-muted whitespace-pre-line"><p className="eyebrow mb-1">Notes</p>{live.adminNotes}</section>
        )}

        {stage !== 'Rejected' && (
          <button
            onClick={() => { if (confirm('Reject this report as fake or invalid? Repeat offenders are blocked automatically.')) update('fake', { isFake: true }, 'Report rejected'); }}
            className={cn('flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-danger/30 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft')}
          >
            <Flag size={15} /> Reject as fake / invalid
          </button>
        )}
      </div>
    </Modal>
  );
}

function Info({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-surface-muted p-3">
      <p className="eyebrow flex items-center gap-1">{icon}{label}</p>
      <p className="mt-1 truncate font-semibold text-fg">{value}</p>
      {sub && <p className="truncate text-xs text-fg-muted">{sub}</p>}
    </div>
  );
}
