import React from 'react';
import { cn } from '../../lib/utils';

export function EmptyState({ icon, title, body, action, className, compact }: {
  icon?: React.ReactNode; title: string; body?: React.ReactNode; action?: React.ReactNode; className?: string; compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-14 px-6', className)}>
      {icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-fg-subtle ring-8 ring-surface-muted/40">{icon}</div>}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 p-8 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-danger-soft text-danger text-lg font-bold">!</div>
      <div>
        <p className="font-semibold text-fg">Couldn't load this right now</p>
        <p className="text-sm text-fg-muted mt-1">{message || 'Check your connection and try again.'}</p>
      </div>
      {onRetry && <button onClick={onRetry} className="btn-secondary">Try again</button>}
    </div>
  );
}
