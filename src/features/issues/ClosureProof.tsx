import React from 'react';
import { Sparkles, ScanEye, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Before/after photos side by side, plus the AI (or manual-review) verdict. */
export function ClosureProof({ issue, compact }: { issue: any; compact?: boolean }) {
  const after = issue?.resolutionImage || issue?.workerImageUrl;
  if (!after && !issue?.closureCheck) return null;
  return (
    <section aria-label="Closure proof" className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Photo src={issue.imageUrl} label="Before" tone="before" alt={`Before: ${issue.category} as reported`} compact={compact} />
        <Photo src={after} label="After" tone="after" alt={`After: ${issue.category} after the crew's fix`} compact={compact} />
      </div>
      <Verdict check={issue.closureCheck} />
    </section>
  );
}

function Photo({ src, label, tone, alt, compact }: { src?: string; label: string; tone: 'before' | 'after'; alt: string; compact?: boolean }) {
  return (
    <figure className={cn('relative overflow-hidden rounded-[var(--radius-md)] bg-surface-sunken', compact ? 'aspect-[4/3]' : 'aspect-[4/3]')}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="grid h-full place-items-center text-xs text-fg-subtle">No photo yet</div>}
      <figcaption className={cn('absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white', tone === 'before' ? 'bg-rose-600/90' : 'bg-emerald-600/90')}>{label}</figcaption>
    </figure>
  );
}

export function Verdict({ check }: { check: any }) {
  if (!check) return null;
  const v = check.verdict as string;
  const cfg = v === 'resolved'
    ? { icon: ShieldCheck, title: `AI check: fix confirmed${check.confidence != null ? ` · ${check.confidence}%` : ''}`, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200' }
    : v === 'not_resolved'
      ? { icon: ShieldAlert, title: 'AI check: problem still visible', cls: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200' }
      : v === 'uncertain'
        ? { icon: ShieldQuestion, title: 'AI check: inconclusive — needs a human look', cls: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200' }
        : { icon: ScanEye, title: 'AI check unavailable — manual review', cls: 'border-line bg-surface-muted text-fg' };
  const Icon = cfg.icon;
  return (
    <div className={cn('flex items-start gap-3 rounded-[var(--radius-md)] border p-3', cfg.cls)} role="status">
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold flex items-center gap-1.5">{v !== 'unavailable' && <Sparkles size={13} />} {cfg.title}</p>
        {check.reasoning && <p className="text-xs opacity-80 mt-0.5">{check.reasoning}</p>}
      </div>
    </div>
  );
}
