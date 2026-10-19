import React, { useMemo, useState } from 'react';
import { Inbox, AlarmClockOff, CheckCircle2, Timer, ArrowRight, Flame, Layers, ShieldAlert, Hourglass } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { CATEGORIES, categoryMeta, formatDuration, isAwaitingConfirmation, isOpen, isResolved, slaState, stageOf, shortAddress } from '../../lib/civic';
import { fmtHours } from '../../lib/wards';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { StatusChip } from '../../components/ui/StatusChip';
import { CategoryIcon } from '../../components/ui/CategoryBadge';
import { StatSkeleton, RowSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { BaseMap, FitBounds } from '../../components/map/BaseMap';
import { ClusterLayer } from '../../components/map/ClusterLayer';
import { HeatLayer } from '../../components/map/HeatLayer';
import { issueTitle, timeAgo } from '../issues/IssueCard';
import { ManageIssueDrawer } from './ManageIssueDrawer';

export function AdminDashboard() {
  const { issues, issuesLoading, issuesError, refresh, go } = useApp();
  const [selected, setSelected] = useState<any>(null);
  const [layer, setLayer] = useState<'markers' | 'heat'>('markers');
  const live = useMemo(() => issues.filter(i => stageOf(i) !== 'Rejected'), [issues]);

  const k = useMemo(() => {
    const open = live.filter(isOpen);
    const overdue = open.filter(i => slaState(i).overdue).sort((a, b) => slaState(a).remainingMs - slaState(b).remainingMs);
    const resolved = live.filter(isResolved);
    const weekAgo = Date.now() - 7 * 86400_000;
    const resolvedWeek = resolved.filter(i => i.resolvedAt && new Date(i.resolvedAt).getTime() > weekAgo).length;
    const hrs = resolved.map(i => (i.resolvedAt ? (+new Date(i.resolvedAt) - +new Date(i.timestamp)) / 3600_000 : null)).filter((h): h is number => !!h && h > 0);
    const within = resolved.filter(i => slaState(i).remainingMs >= 0).length;
    const unassigned = open.filter(i => !i.assignedTeam).length;
    const awaiting = live.filter(isAwaitingConfirmation).length;
    const dueSoon = open.filter(i => !slaState(i).overdue && slaState(i).remainingMs < 12 * 3600_000).length;
    return { open, overdue, resolved, resolvedWeek, avg: hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : null, slaPct: resolved.length ? Math.round((within / resolved.length) * 100) : null, unassigned, awaiting, dueSoon, rejected: issues.length - live.length };
  }, [live, issues.length]);

  const byCategory = useMemo(() => CATEGORIES.map(c => ({ c, open: k.open.filter(i => i.category === c).length, overdue: k.overdue.filter(i => i.category === c).length })).filter(x => x.open).sort((a, b) => b.open - a.open), [k]);
  const maxOpen = Math.max(1, ...byCategory.map(b => b.open));

  if (issuesError && !issues.length) return <ErrorState message={issuesError} onRetry={refresh} />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="GHMC · Operations" title="City overview"
        subtitle={issuesLoading ? 'Loading live reports…' : `${k.open.length} open tickets across Hyderabad. ${k.overdue.length} have breached their public SLA${k.dueSoon ? ` and ${k.dueSoon} more are due within 12 hours` : ''}.`}
        actions={<Button onClick={() => go('admin-issues')}>Open issue manager <ArrowRight size={16} /></Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {issuesLoading ? [0, 1, 2, 3].map(i => <StatSkeleton key={i} />) : (
          <>
            <StatCard label="Open tickets" value={k.open.length} icon={<Inbox size={16} />} hint={`${k.unassigned} not yet assigned`} />
            <StatCard label="Overdue (SLA breached)" value={k.overdue.length} icon={<AlarmClockOff size={16} />} tone="danger" hint={k.open.length ? `${Math.round((k.overdue.length / k.open.length) * 100)}% of open tickets` : '—'} />
            <StatCard label="Resolved this week" value={k.resolvedWeek} icon={<CheckCircle2 size={16} />} tone="brand" hint={`${k.awaiting} awaiting citizen OK`} />
            <StatCard label="Avg. time to fix" value={fmtHours(k.avg)} icon={<Timer size={16} />} tone="info" hint={k.slaPct !== null ? `${k.slaPct}% fixed within SLA` : '—'} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 overflow-hidden flex flex-col">
          <CardHeader title="Live complaint map" subtitle="Clustered by area · pins coloured by category · red ring = overdue" icon={<Layers size={16} />}
            action={<Segmented size="sm" label="Map layer" value={layer} onChange={setLayer} options={[{ value: 'markers', label: 'Pins' }, { value: 'heat', label: 'Heat', icon: <Flame size={12} /> }]} />} />
          {issuesLoading ? <Skeleton className="h-[400px] w-full rounded-none" /> : (
            <BaseMap zoom={12} className="h-[400px] xl:h-auto xl:flex-1 xl:min-h-[400px] border-t border-line" label="City complaint map">
              {layer === 'heat' ? <HeatLayer issues={k.open} /> : <ClusterLayer issues={live} onSelect={setSelected} />}
              <FitBounds points={live.map(i => [i.latitude, i.longitude] as [number, number])} maxZoom={13} />
            </BaseMap>
          )}
        </Card>

        <Card className="xl:col-span-2 flex flex-col overflow-hidden">
          <CardHeader title="Overdue wall" subtitle="Breached their public deadline — oldest breach first" icon={<ShieldAlert size={16} />}
            action={k.overdue.length ? <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white tabular-nums">{k.overdue.length}</span> : undefined} />
          {issuesLoading ? <RowSkeleton rows={5} /> : k.overdue.length === 0 ? (
            <EmptyState compact icon={<CheckCircle2 size={20} />} title="No SLA breaches" body="Every open ticket is inside its deadline." />
          ) : (
            <ul className="flex-1 divide-y divide-line overflow-y-auto max-h-[400px]">
              {k.overdue.slice(0, 8).map(i => (
                <li key={i.id}>
                  <button onClick={() => setSelected(i)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-muted">
                    <CategoryIcon category={i.category} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{issueTitle(i)}</span>
                      <span className="block truncate text-xs text-fg-muted">{i.ward || shortAddress(i.locationAddress)} · {i.upvotes || 0} upvotes</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs font-bold text-danger tabular-nums">+{formatDuration(slaState(i).remainingMs)}</span>
                      <span className="block text-[11px] text-fg-subtle">late</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {k.overdue.length > 8 && <button onClick={() => go('admin-issues')} className="border-t border-line px-5 py-3 text-left text-[13px] font-semibold text-brand hover:bg-surface-muted">View all {k.overdue.length} overdue →</button>}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Open by category" subtitle="Red segment = overdue" icon={<Hourglass size={16} />} />
          <div className="space-y-3 px-5 pb-5 sm:px-6">
            {issuesLoading ? [0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-full" />) : byCategory.length === 0 ? <p className="text-sm text-fg-muted">Nothing open.</p> : byCategory.map(b => {
              const m = categoryMeta(b.c);
              return (
                <div key={b.c}>
                  <div className="flex items-center justify-between text-[13px]"><span className="font-medium text-fg">{b.c}</span><span className="tabular-nums text-fg-muted">{b.open}{b.overdue ? <span className="text-danger"> · {b.overdue} late</span> : ''}</span></div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-surface-sunken" style={{ width: `${(b.open / maxOpen) * 100}%`, minWidth: 24 }}>
                    <div style={{ width: `${((b.open - b.overdue) / b.open) * 100}%`, background: m.color }} />
                    <div className="bg-rose-500" style={{ width: `${(b.overdue / b.open) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="xl:col-span-3 overflow-hidden">
          <CardHeader title="Latest reports" subtitle="Newest first" action={<Button size="sm" variant="ghost" onClick={() => go('admin-issues')}>All issues <ArrowRight size={14} /></Button>} />
          {issuesLoading ? <RowSkeleton rows={5} /> : (
            <ul className="divide-y divide-line">
              {[...issues].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 6).map(i => (
                <li key={i.id}>
                  <button onClick={() => setSelected(i)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-muted">
                    {i.imageUrl ? <img src={i.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] object-cover" /> : <CategoryIcon category={i.category} size={40} />}
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{issueTitle(i)}</span><span className="block truncate text-xs text-fg-muted">{i.category} · {i.ward || shortAddress(i.locationAddress)} · {timeAgo(i.timestamp)}</span></span>
                    <StatusChip issue={i} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ManageIssueDrawer issue={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
