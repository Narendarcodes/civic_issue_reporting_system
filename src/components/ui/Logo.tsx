import React from 'react';
import { cn } from '../../lib/utils';
import { APP_NAME } from '../../lib/civic';

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--brand)" />
      <path d="M32 13c-8.3 0-15 6.5-15 14.6C17 38.5 32 51 32 51s15-12.5 15-23.4C47 19.5 40.3 13 32 13z" fill="#fff" />
      <path d="M25.5 28.2l4.6 4.6 8.4-8.6" fill="none" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, sub }: { className?: string; sub?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[19px] font-semibold tracking-tight text-fg">{APP_NAME}</span>
        {sub && <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-subtle mt-1">{sub}</span>}
      </span>
    </span>
  );
}
