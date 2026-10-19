import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Accessible dialog: Esc closes, focus moves in and is restored, body scroll locks. */
export function Modal({ open, onClose, title, children, className, side = 'center', labelledBy }: {
  open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; className?: string;
  side?: 'center' | 'right'; labelledBy?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => panel.current?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[1000] flex', side === 'right' ? 'justify-end' : 'items-end sm:items-center justify-center sm:p-6')}>
          <motion.div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={side === 'right' ? { x: 40, opacity: 0 } : { y: 24, opacity: 0, scale: 0.98 }}
            animate={side === 'right' ? { x: 0, opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={side === 'right' ? { x: 40, opacity: 0 } : { y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative bg-surface shadow-[var(--shadow-e3)] outline-none overflow-y-auto',
              side === 'right' ? 'h-full w-full max-w-[560px] border-l border-line' : 'w-full max-w-lg max-h-[92vh] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-line',
              className,
            )}
          >
            {title !== undefined && (
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface/95 backdrop-blur px-5 py-4">
                <h2 id={labelledBy} className="text-base font-semibold">{title}</h2>
                <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg"><X size={18} /></button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
