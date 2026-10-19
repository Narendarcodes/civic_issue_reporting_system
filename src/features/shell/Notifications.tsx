import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { formatDistanceToNowStrict } from 'date-fns';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useApp } from '../../app/AppContext';
import { EmptyState } from '../../components/ui/EmptyState';

export function Notifications() {
  const { openIssue } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const load = () => api<any[]>('/api/notifications').then(d => Array.isArray(d) && setItems(d)).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const unread = items.filter(i => !i.isRead).length;
  const markAll = async () => { await api('/api/notifications/read-all', { method: 'PUT' }).catch(() => {}); load(); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg">
        <Bell size={18} />
        {unread > 0 && <span className="absolute right-1 top-1 min-w-4 h-4 px-1 rounded-full bg-danger text-[10px] font-bold leading-4 text-white text-center ring-2 ring-surface">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-24px)] rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-e3)] z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><CheckCheck size={14} />Mark all read</button>}
            </div>
            <div className="max-h-[360px] overflow-y-auto divide-y divide-line">
              {items.length === 0 ? (
                <EmptyState compact icon={<Bell size={20} />} title="You're all caught up" body="Status changes on issues you follow will appear here." />
              ) : items.slice(0, 20).map(n => (
                <button key={n.id} onClick={() => { if (n.issueId) openIssue(n.issueId); setOpen(false); }}
                  className={cn('block w-full text-left px-4 py-3 hover:bg-surface-muted', !n.isRead && 'bg-brand-soft/40')}>
                  <p className="text-[13px] font-semibold text-fg flex items-center gap-2">{!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}{n.title}</p>
                  <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">{n.message}</p>
                  {n.timestamp && <p className="text-[11px] text-fg-subtle mt-1">{formatDistanceToNowStrict(new Date(n.timestamp), { addSuffix: true })}</p>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
