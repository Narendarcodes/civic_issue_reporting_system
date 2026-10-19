import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPinned, ArrowUpDown, AlarmClockOff, Timer, CheckCircle2, Inbox } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { computeWardStats, fmtHours, type WardStats } from '../../lib/wards';
import { nearestWard } from '../../lib/civic';
import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Segmented } from '../../components/ui/Segmented';
import { RowSkeleton, StatSkeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';

const GRADE: Record<WardStats['grade'], string> = {
  A: 'bg-emerald-600 text-white', B: 'bg-emerald-500/85 text-white', C: 'bg-amber-500 text-white', D: 'bg-orange-500 text-white', E: 'bg-rose-600 text-white',
};

type SortKey = 'score' | 'open' | 'overdue' | 'speed';

export function WardScorecard() {
  const { issues, issuesLoading, issuesError, refresh, user, isAdmin } = useApp();
  const [sort, setSort] = useState<SortKey>('score');
  const stats = useMemo(() => computeWardStats(issues), [issues]);
  const sorted = useMemo(() => [...stats].sort((a, b) =>
    sort === 'open' ? b.open - a.open : sort === 'overdue' ? b.overdue - a.overdue
      : sort === 'speed' ? (a.avgHoursToResolve ?? 1e9) - (b.avgHoursToResolve ?? 1e9) : b.score - a.score), [stats, sort]);
  const myWard = !isAdmin && user?.latitude != null ? nearestWard(user.latitude, user.longitude) : null;

  const totals = stats.reduce((a, s) => ({ open: a.open + s.open, overdue: a.overdue + s.overdue, resolved: a.resolved + s.resolved, total: a.total + s.total }), { open: 0, overdue: 0, resolved: 0, total: 0 });
  const allHrs = stats.filter(s => s.avgHoursToResolve !== null);
  const cityAvg = allHrs.length ? allHrs.reduce((a, s) => a + (s.avgHoursToResolve as number) * s.resolved, 0) / Math.max(1, allHrs.reduce((a, s) => a + s.resolved, 0)) : null;

  return (
    <div>
      <PageHeader eyebrow="Accountability" title="Ward scorecard"
        subtitle="How each area of Hyderabad is doing — resolution rate, time to fix and deadlines missed. Computed live from every public report." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {issuesLoading ? [0, 1, 2, 3].map(i => <StatSkeleton key={i} />) : (
          <>
            <StatCard label="Areas tracked" value={stats.length} icon={<MapPinned size={16} />} hint={`${totals.total} reports`} />
            <StatCard label="City resolution rate" value={`${totals.total ? Math.round((totals.resolved / totals.total) * 100) : 0}%`} icon={<CheckCircle2 size={16} />} tone="brand" hint={`${totals.resolved} fixed`} />
            <StatCard label="Avg. time to fix" value={fmtHours(cityAvg)} icon={<Timer size={16} />} tone="info" hint="Report → resolved" />
            <StatCard label="Past deadline" value={totals.overdue} icon={<AlarmClockOff size={16} />} tone="danger" hint={`of ${totals.open} open`} />
          </>
        )}
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold">Rankings</h2>
            <p className="text-[13px] text-fg-muted">Score = 50% resolution rate · 30% fixed within SLA · 20% nothing overdue</p>
          </div>
          <Segmented size="sm" label="Sort wards" value={sort} onChange={setSort} options={[
            { value: 'score', label: 'Score', icon: <ArrowUpDown size={12} /> }, { value: 'open', label: 'Most open' }, { value: 'overdue', label: 'Most overdue' }, { value: 'speed', label: 'Fastest' },
          ]} />
        </div>
        {issuesError && !issues.length ? <div className="p-4"><ErrorState message={issuesError} onRetry={refresh} /></div>
          : issuesLoading ? <RowSkeleton rows={6} />
            : sorted.length === 0 ? <EmptyState icon={<Inbox size={22} />} title="No data yet" body="Scores appear once reports come in." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-fg-subtle">
                        <th scope="col" className="px-5 py-3 w-12">#</th>
                        <th scope="col" className="px-3 py-3">Area</th>
                        <th scope="col" className="px-3 py-3 w-56">Resolution rate</th>
                        <th scope="col" className="px-3 py-3 text-right">Avg. fix time</th>
                        <th scope="col" className="px-3 py-3 text-right">Within SLA</th>
                        <th scope="col" className="px-3 py-3 text-right">Open</th>
                        <th scope="col" className="px-3 py-3 text-right">Overdue</th>
                        <th scope="col" className="px-5 py-3 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {sorted.map((s, k) => (
                        <motion.tr key={s.ward} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: k * 0.03 }} className={cn(s.ward === myWard && 'bg-brand-soft/60')}>
                          <td className="px-5 py-3.5 font-semibold tabular-nums text-fg-subtle">{k + 1}</td>
                          <td className="px-3 py-3.5">
                            <p className="font-semibold text-fg">{s.ward}{s.ward === myWard && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-brand-fg">Your area</span>}</p>
                            <p className="text-xs text-fg-muted">{s.zone} zone · {s.total} reports</p>
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(s.resolutionRate * 100)}%` }} transition={{ duration: 0.5, delay: 0.1 + k * 0.03 }}
                                  className={cn('h-full rounded-full', s.resolutionRate >= 0.6 ? 'bg-brand' : s.resolutionRate >= 0.35 ? 'bg-amber-500' : 'bg-rose-500')} />
                              </div>
                              <span className="w-10 text-right font-semibold tabular-nums">{Math.round(s.resolutionRate * 100)}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-right tabular-nums">{fmtHours(s.avgHoursToResolve)}</td>
                          <td className="px-3 py-3.5 text-right tabular-nums">{s.withinSlaRate === null ? '—' : `${Math.round(s.withinSlaRate * 100)}%`}</td>
                          <td className="px-3 py-3.5 text-right tabular-nums">{s.open}</td>
                          <td className={cn('px-3 py-3.5 text-right tabular-nums font-semibold', s.overdue ? 'text-danger' : 'text-fg-subtle')}>{s.overdue}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={cn('inline-grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] font-display text-base font-semibold', GRADE[s.grade])} title={`Score ${s.score}/100`}>{s.grade}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      </Card>
    </div>
  );
}
