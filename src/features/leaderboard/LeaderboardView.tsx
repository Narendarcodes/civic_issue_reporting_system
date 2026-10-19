import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Medal, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { displayName } from '../../lib/civic';
import { useApp } from '../../app/AppContext';
import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { RowSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';

const PODIUM = [
  { place: 2, h: 'h-28', ring: 'ring-slate-300', medal: 'text-slate-400', label: '2nd' },
  { place: 1, h: 'h-36', ring: 'ring-amber-400', medal: 'text-amber-500', label: '1st' },
  { place: 3, h: 'h-20', ring: 'ring-orange-300', medal: 'text-orange-500', label: '3rd' },
];

export function LeaderboardView() {
  const { user } = useApp();
  const [leaders, setLeaders] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setError(null); api<any[]>('/api/leaderboard').then(d => setLeaders(Array.isArray(d) ? d : [])).catch(e => setError(e.message)); };
  useEffect(load, []);

  const top = leaders?.slice(0, 3) || [];
  const rest = leaders?.slice(3) || [];
  const myRank = leaders ? leaders.findIndex(l => l.id === user?.id) : -1;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Civic heroes" title="Leaderboard" subtitle="Points for reporting real problems, confirming fixes and verifying your neighbours' reports."
        actions={myRank >= 0 ? <span className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong">You're #{myRank + 1}</span> : undefined} />
      {error ? <ErrorState message={error} onRetry={load} /> : leaders === null ? (
        <Card className="p-6"><div className="flex items-end justify-center gap-4">{[28, 36, 20].map((h, i) => <Skeleton key={i} className={`w-28 rounded-t-[var(--radius-lg)]`} />)}</div><RowSkeleton rows={4} /></Card>
      ) : leaders.length === 0 ? (
        <Card><EmptyState icon={<Trophy size={22} />} title="The board is empty" body="Report or verify an issue to claim the first spot." /></Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-b from-brand-soft to-transparent px-4 pt-8">
              <div className="mx-auto grid max-w-xl grid-cols-3 items-end gap-3 sm:gap-6">
                {PODIUM.map((p, k) => {
                  const l = top[p.place - 1];
                  if (!l) return <div key={p.place} />;
                  const me = l.id === user?.id;
                  return (
                    <motion.div key={p.place} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: k * 0.06 }} className="flex flex-col items-center text-center">
                      {p.place === 1 && <Crown size={22} className="mb-1 text-amber-500" aria-hidden />}
                      <span className={cn('rounded-full ring-4 ring-offset-2 ring-offset-surface', p.ring)}><Avatar name={displayName(l)} size={p.place === 1 ? 64 : 52} /></span>
                      <p className="mt-2 max-w-[120px] truncate text-sm font-semibold">{me ? 'You' : displayName(l)}</p>
                      <p className="text-xs text-fg-muted tabular-nums">{l.reputationPoints} pts</p>
                      <div className={cn('mt-3 flex w-full flex-col items-center justify-start rounded-t-[var(--radius-lg)] border border-b-0 border-line bg-surface pt-3', p.h)}>
                        <Medal size={20} className={p.medal} aria-hidden />
                        <span className="font-display text-2xl font-semibold text-fg">{p.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <ol className="divide-y divide-line border-t border-line">
              {rest.map((l, k) => {
                const me = l.id === user?.id;
                return (
                  <motion.li key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + k * 0.03 }} className={cn('flex items-center gap-4 px-5 py-3.5', me && 'bg-brand-soft')}>
                    <span className="w-6 text-center text-sm font-bold tabular-nums text-fg-subtle">{k + 4}</span>
                    <Avatar name={displayName(l)} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{me ? 'You' : displayName(l)}</span>
                      <span className="flex items-center gap-1 text-xs text-fg-muted"><FileText size={12} />{l.reportedIssuesCount || 0} reports{(l.badges || []).length ? ` · ${l.badges[0]}` : ''}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{l.reputationPoints}<span className="ml-0.5 text-xs font-medium text-fg-subtle">pts</span></span>
                  </motion.li>
                );
              })}
            </ol>
          </Card>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['+10', 'Report an issue'], ['+10', 'Each upvote you receive'], ['+5', 'Verify a neighbour’s fix'], ['+55', 'Confirm your fix']].map(([p, l]) => (
              <Card key={l} className="p-4"><p className="font-display text-xl font-semibold text-brand">{p}</p><p className="text-xs text-fg-muted mt-0.5">{l}</p></Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
