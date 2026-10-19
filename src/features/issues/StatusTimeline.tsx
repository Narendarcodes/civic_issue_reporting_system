import React from 'react';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { STAGE_FLOW, STAGE_META, stageOf, type Stage } from '../../lib/civic';

const RAW_TO_STAGE = (raw: string): Stage => stageOf({ status: raw });

interface Step { stage: Stage; at?: string; by?: string; note?: string; done: boolean; current: boolean }

/** Build the public timeline from statusHistory, filling un-reached stages as upcoming. */
export function buildTimeline(issue: any): Step[] {
  const hist: any[] = Array.isArray(issue?.statusHistory) ? issue.statusHistory : [];
  const current = stageOf(issue);
  const reached = new Map<Stage, any>();
  for (const h of hist) reached.set(RAW_TO_STAGE(h.status), h);
  if (!reached.has('Reported')) reached.set('Reported', { at: issue?.timestamp, by: issue?.username, note: 'Report submitted' });

  if (current === 'Rejected') {
    const r = reached.get('Rejected') || {};
    return [
      { stage: 'Reported', ...reached.get('Reported'), done: true, current: false },
      { stage: 'Rejected', at: r.at, by: r.by, note: r.note || 'Closed as invalid', done: true, current: true },
    ];
  }
  const curIdx = STAGE_FLOW.indexOf(current);
  return STAGE_FLOW.map((stage, idx) => {
    const h = reached.get(stage);
    const done = idx <= curIdx;
    // Skipped stages (e.g. auto-assigned straight from Reported) are shown as done without a timestamp.
    return { stage, at: h?.at, by: h?.by, note: h?.note || (done && !h ? 'Skipped (auto-routed)' : undefined), done, current: idx === curIdx };
  });
}

export function StatusTimeline({ issue }: { issue: any }) {
  const steps = buildTimeline(issue);
  const awaiting = issue?.status === 'Pending Citizen Confirmation';
  return (
    <ol className="relative space-y-0" aria-label="Status timeline">
      {steps.map((s, i) => {
        const meta = STAGE_META[s.stage];
        const Icon = meta.icon;
        const last = i === steps.length - 1;
        return (
          <li key={s.stage} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span aria-hidden className={cn('absolute left-[15px] top-8 bottom-0 w-0.5', s.done && steps[i + 1].done ? 'bg-brand' : 'bg-line')} />}
            <span
              className={cn('relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-surface',
                s.done ? 'text-white' : 'bg-surface-muted text-fg-subtle border border-line')}
              style={s.done ? { background: meta.dot } : undefined}
            >
              {s.done && !s.current ? <Check size={15} strokeWidth={3} /> : <Icon size={15} strokeWidth={2.4} />}
            </span>
            <div className="min-w-0 pt-1">
              <p className={cn('text-sm font-semibold', s.done ? 'text-fg' : 'text-fg-subtle')}>
                {s.stage}
                {s.current && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-strong">Now</span>}
              </p>
              <p className="text-xs text-fg-muted mt-0.5">
                {s.at ? format(new Date(s.at), 'd MMM, h:mm a') : s.done ? '' : meta.description}
                {s.by && s.at ? ` · ${s.by}` : ''}
              </p>
              {s.note && s.done && <p className="text-xs text-fg-subtle mt-0.5">{s.note}</p>}
              {s.stage === 'Resolved' && s.current && awaiting && <p className="text-xs font-semibold text-warning mt-1">Awaiting the reporter's confirmation</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
