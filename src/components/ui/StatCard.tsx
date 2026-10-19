import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from './Card';

export function StatCard({ label, value, icon, hint, tone = 'neutral', className }: {
  label: string; value: React.ReactNode; icon?: React.ReactNode; hint?: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'warning' | 'danger' | 'info'; className?: string;
}) {
  const toneCls = {
    neutral: 'bg-surface-muted text-fg-muted',
    brand: 'bg-brand-soft text-brand',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300',
  }[tone];
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-fg-muted">{label}</p>
        {icon && <span className={cn('grid h-8 w-8 place-items-center rounded-[var(--radius-sm)]', toneCls)}>{icon}</span>}
      </div>
      <p className="mt-2 font-display text-[28px] leading-none font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-xs text-fg-muted">{hint}</p>}
    </Card>
  );
}
