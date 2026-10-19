import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type Tone = 'success' | 'error' | 'info';
interface ToastItem { id: number; tone: Tone; title: string; body?: string }
const Ctx = createContext<(t: Omit<ToastItem, 'id'>) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems(s => [...s, { ...t, id }]);
    setTimeout(() => setItems(s => s.filter(i => i.id !== id)), 5200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 sm:bottom-6 z-[1100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-6 sm:left-auto">
        <AnimatePresence>
          {items.map(t => {
            const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? AlertTriangle : Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-3.5 shadow-[var(--shadow-e3)]"
              >
                <Icon size={18} className={cn('mt-0.5 shrink-0', t.tone === 'success' ? 'text-brand' : t.tone === 'error' ? 'text-danger' : 'text-sky-500')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">{t.title}</p>
                  {t.body && <p className="mt-0.5 text-[13px] text-fg-muted">{t.body}</p>}
                </div>
                <button onClick={() => setItems(s => s.filter(i => i.id !== t.id))} aria-label="Dismiss" className="text-fg-subtle hover:text-fg"><X size={16} /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
