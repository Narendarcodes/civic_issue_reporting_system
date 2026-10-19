import React from 'react';
import { cn } from '../../lib/utils';
import { initials } from '../../lib/civic';

const PALETTE = ['#059669', '#0284c7', '#7c3aed', '#db2777', '#d97706', '#0d9488', '#4f46e5', '#65a30d'];
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function Avatar({ name, size = 36, className }: { name?: string; size?: number; className?: string }) {
  const bg = PALETTE[hash(name || '?') % PALETTE.length];
  return (
    <span
      aria-hidden
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, background: bg, fontSize: Math.max(11, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
