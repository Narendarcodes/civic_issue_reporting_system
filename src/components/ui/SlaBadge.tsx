import React, { useEffect, useState } from 'react';
import { Timer, AlarmClockOff, BadgeCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDuration, slaState, stageOf } from '../../lib/civic';

/** Re-render once a minute so countdowns stay live. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Public SLA countdown — "Due in 14h 20m", "Overdue by 2d 3h", or "Fixed 6h early". */
export function SlaBadge({ issue, size = 'md', className, onImage }: { issue: any; size?: 'sm' | 'md'; className?: string; onImage?: boolean }) {
  const now = useNow();
  const st = slaState(issue, now);
  const stage = stageOf(issue);
  if (stage === 'Rejected') return null;
  let label: string, tone: string, Icon = Timer;
  if (st.closed) {
    Icon = BadgeCheck;
    label = st.remainingMs >= 0 ? `Fixed within SLA` : `Fixed ${formatDuration(st.remainingMs)} late`;
    tone = st.remainingMs >= 0 ? 'text-emerald-700 bg-emerald-50 ring-emerald-200 dark:text-emerald-300 dark:bg-emerald-400/10 dark:ring-emerald-400/25' : 'text-amber-800 bg-amber-50 ring-amber-200 dark:text-amber-300 dark:bg-amber-400/10 dark:ring-amber-400/25';
  } else if (st.overdue) {
    Icon = AlarmClockOff;
    label = `Overdue ${formatDuration(st.remainingMs)}`;
    tone = 'text-rose-700 bg-rose-50 ring-rose-200 dark:text-rose-300 dark:bg-rose-400/10 dark:ring-rose-400/25';
  } else {
    label = `Due in ${formatDuration(st.remainingMs)}`;
    tone = st.consumed > 0.75
      ? 'text-amber-800 bg-amber-50 ring-amber-200 dark:text-amber-300 dark:bg-amber-400/10 dark:ring-amber-400/25'
      : 'text-fg-muted bg-surface-muted ring-line';
  }
  return (
    <span
      title={`Service-level target: ${st.hours} h for this category`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap tabular-nums',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        onImage ? 'bg-black/55 text-white ring-white/20 backdrop-blur-md' : tone,
        className,
      )}
    >
      <Icon size={size === 'sm' ? 12 : 13} strokeWidth={2.4} aria-hidden />
      {label}
    </span>
  );
}

/** Thin SLA progress bar. */
export function SlaBar({ issue }: { issue: any }) {
  const now = useNow();
  const st = slaState(issue, now);
  const pct = Math.round(st.consumed * 100);
  const color = st.closed ? 'bg-emerald-500' : st.overdue ? 'bg-rose-500' : st.consumed > 0.75 ? 'bg-amber-500' : 'bg-brand';
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Share of SLA window used">
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${Math.max(4, pct)}%` }} />
    </div>
  );
}
