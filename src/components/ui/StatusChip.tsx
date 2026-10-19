import React from 'react';
import { cn } from '../../lib/utils';
import { STAGE_META, stageOf, type Stage } from '../../lib/civic';

/** The single status vocabulary: Reported · Verified · Assigned · In progress · Resolved · Rejected. */
export function StatusChip({ issue, stage, size = 'md', className }: { issue?: any; stage?: Stage; size?: 'sm' | 'md'; className?: string }) {
  const s: Stage = stage || stageOf(issue);
  const meta = STAGE_META[s];
  const Icon = meta.icon;
  return (
    <span
      title={meta.description}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.chip,
        className,
      )}
    >
      <Icon size={size === 'sm' ? 12 : 13} aria-hidden strokeWidth={2.4} />
      {s}
    </span>
  );
}
