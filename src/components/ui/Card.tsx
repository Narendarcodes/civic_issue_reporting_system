import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, hover, as: As = 'div', ...props }: React.HTMLAttributes<HTMLElement> & { hover?: boolean; as?: any }) {
  return <As className={cn('card', hover && 'card-hover', className)} {...props} />;
}

export function CardHeader({ title, subtitle, action, className, icon }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface-muted text-fg-muted">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-6 text-fg">{title}</h3>
          {subtitle && <p className="text-[13px] text-fg-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
