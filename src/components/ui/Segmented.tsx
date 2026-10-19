import React from 'react';
import { cn } from '../../lib/utils';

export function Segmented<T extends string>({ value, onChange, options, className, size = 'md', label }: {
  value: T; onChange: (v: NoInfer<T>) => void; options: { value: NoInfer<T>; label: React.ReactNode; count?: number; icon?: React.ReactNode }[];
  className?: string; size?: 'sm' | 'md'; label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-line bg-surface-muted p-1', className)}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[calc(var(--radius-md)-4px)] font-semibold transition-[background-color,color,box-shadow] duration-150 whitespace-nowrap',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-surface text-fg shadow-[var(--shadow-e1)]' : 'text-fg-muted hover:text-fg',
            )}
          >
            {o.icon}
            {o.label}
            {typeof o.count === 'number' && (
              <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', active ? 'bg-brand-soft text-brand-strong' : 'bg-surface-sunken text-fg-subtle')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children, icon }: { active?: boolean; onClick?: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap transition-[background-color,color,border-color] duration-150',
        active ? 'border-fg bg-fg text-bg' : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
