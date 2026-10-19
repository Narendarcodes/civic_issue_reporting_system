import React from 'react';
import { cn } from '../../lib/utils';
import { categoryMeta } from '../../lib/civic';

export function CategoryIcon({ category, size = 36, className }: { category?: string; size?: number; className?: string }) {
  const m = categoryMeta(category);
  const Icon = m.icon;
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-[var(--radius-md)]', className)} style={{ width: size, height: size, background: m.soft, color: m.color }} aria-hidden>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </span>
  );
}

export function CategoryBadge({ category, className, onImage }: { category?: string; className?: string; onImage?: boolean }) {
  const m = categoryMeta(category);
  const Icon = m.icon;
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', onImage ? 'bg-black/55 text-white backdrop-blur-md' : '', className)}
      style={onImage ? undefined : { background: m.soft, color: m.color }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden style={onImage ? { color: '#fff' } : undefined} />
      {category || 'Other'}
    </span>
  );
}
