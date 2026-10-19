import React, { useMemo, useState } from 'react';
import { format, startOfDay, subDays, startOfWeek } from 'date-fns';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Timer, ShieldCheck, BarChart3 } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { CATEGORIES, CHART, STAGES, STAGE_META, categoryMeta, isOpen, isResolved, slaHoursFor, slaState, stageOf } from '../../lib/civic';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Segmented';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';

const axis = { stroke: 'var(--border)', tick: { fill: 'var(--text-subtle)', fontSize: 12 }, tickLine: false } as const;
const grid = <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />;

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-e3)]">
      {label !== undefined && <p className="mb-1 font-semibold text-fg">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2 text-fg-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <span className="font-semibold text-fg tabular-nums">{typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value}{unit || ''}</span>
        </p>
      ))}
    </div>
  );
}
const legend = <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }} />;

export function AdminAnalytics() {
  const { issues, issuesLoading, issuesError, refresh } = useApp();
  const [range, setRange] = useState<'30' | '60'>('30');
  const days = Number(range);
  const live = useMemo(() => issues.filter(i => stageOf(i) !== 'Rejected'), [issues]);

  const trend = useMemo(() => {
    const start = startOfDay(subDays(new Date(), days - 1));
    const rows = Array.from({ length: days }, (_, k) => ({ d: subDays(new Date(), days - 1 - k), reported: 0, resolved: 0 }));
    const idx = (t: string) => Math.floor((startOfDay(new Date(t)).getTime() - start.getTime()) / 86400_000);
    for (const i of live) {
      const a = idx(i.timestamp); if (a >= 0 && a < days) rows[a].reported++;
      if (i.resolvedAt) { const b = idx(i.resolvedAt); if (b >= 0 && b < days) rows[b].resolved++; }
    }
    return rows.map(r => ({ day: format(r.d, 'd MMM'), Reported: r.reported, Resolved: r.resolved }));
  }, [live, days]);

  const byCategory = useMemo(() => CATEGORIES.map(c => {
    const list = live.filter(i => i.category === c);
    const res = list.filter(isResolved);
    const hrs = res.map(i => (i.resolvedAt ? (+new Date(i.resolvedAt) - +new Date(i.timestamp)) / 3600_000 : null)).filter((h): h is number => !!h && h > 0);
    return {
      name: categoryMeta(c).short, full: c,
      Open: list.filter(isOpen).length, Resolved: res.length,
      'Avg. fix (h)': hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : 0,
      'SLA target (h)': slaHoursFor(c),
    };
  }).filter(r => r.Open + r.Resolved > 0), [live]);

  const status = useMemo(() => STAGES.map(s => ({ name: s, value: issues.filter(i => stageOf(i) === s).length, fill: STAGE_META[s].dot })).filter(s => s.value), [issues]);

  const compliance = useMemo(() => {
    const weeks = new Map<number, { ok: number; n: number }>();
    for (const i of live.filter(isResolved)) {
      if (!i.resolvedAt) continue;
      const w = startOfWeek(new Date(i.resolvedAt), { weekStartsOn: 1 }).getTime();
      const e = weeks.get(w) || { ok: 0, n: 0 };
      e.n++; if (slaState(i).remainingMs >= 0) e.ok++;
      weeks.set(w, e);
    }
    return [...weeks.entries()].sort((a, b) => a[0] - b[0]).slice(-8).map(([w, e]) => ({ week: format(new Date(w), 'd MMM'), 'Within SLA': Math.round((e.ok / e.n) * 100), fixes: e.n }));
  }, [live]);

  if (issuesError && !issues.length) return <ErrorState message={issuesError} onRetry={refresh} />;
  const loading = issuesLoading;
  const empty = !loading && live.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Insights" title="Analytics" subtitle="Demand, throughput and SLA performance across Hyderabad."
        actions={<Segmented label="Range" value={range} onChange={setRange} options={[{ value: '30', label: '30 days' }, { value: '60', label: '60 days' }]} />} />
      {empty ? <Card><EmptyState icon={<BarChart3 size={22} />} title="No data yet" body="Charts fill in as citizens report issues." /></Card> : (
        <>
          <Card>
            <CardHeader title="Reported vs resolved" subtitle={`Daily, last ${days} days`} icon={<TrendingUp size={16} />} />
            <div className="h-[300px] px-2 pb-4 sm:px-4">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART.sky} stopOpacity={0.25} /><stop offset="100%" stopColor={CHART.sky} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART.brand} stopOpacity={0.28} /><stop offset="100%" stopColor={CHART.brand} stopOpacity={0} /></linearGradient>
                    </defs>
                    {grid}
                    <XAxis dataKey="day" {...axis} interval={Math.ceil(days / 8)} />
                    <YAxis {...axis} allowDecimals={false} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    {legend}
                    <Area type="monotone" dataKey="Reported" stroke={CHART.sky} strokeWidth={2.2} fill="url(#gRep)" />
                    <Area type="monotone" dataKey="Resolved" stroke={CHART.brand} strokeWidth={2.2} fill="url(#gRes)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <Card className="xl:col-span-3">
              <CardHeader title="Workload by category" subtitle="Open vs resolved tickets" icon={<BarChart3 size={16} />} />
              <div className="h-[300px] px-2 pb-4 sm:px-4">
                {loading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCategory} margin={{ top: 8, right: 16, left: -12, bottom: 0 }} barCategoryGap="28%">
                      {grid}
                      <XAxis dataKey="name" {...axis} />
                      <YAxis {...axis} allowDecimals={false} width={40} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-muted)' }} />
                      {legend}
                      <Bar dataKey="Open" stackId="a" fill={CHART.amber} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Resolved" stackId="a" fill={CHART.brand} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader title="Status mix" subtitle="All tickets, one vocabulary" icon={<PieIcon size={16} />} />
              <div className="h-[300px] px-2 pb-4">
                {loading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={status} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
                        {status.map(s => <Cell key={s.name} fill={s.fill} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend itemSorter={null as any} iconType="circle" iconSize={8} layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Time to fix vs SLA target" subtitle="Average hours from report to resolution" icon={<Timer size={16} />} />
              <div className="h-[300px] px-2 pb-4 sm:px-4">
                {loading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCategory} margin={{ top: 8, right: 16, left: -8, bottom: 0 }} barGap={4}>
                      {grid}
                      <XAxis dataKey="name" {...axis} />
                      <YAxis {...axis} width={44} unit="h" />
                      <Tooltip content={<ChartTooltip unit=" h" />} cursor={{ fill: 'var(--surface-muted)' }} />
                      {legend}
                      <Bar dataKey="Avg. fix (h)" fill={CHART.accent} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="SLA target (h)" fill={CHART.slate} radius={[6, 6, 0, 0]} fillOpacity={0.45} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="SLA compliance" subtitle="Share of fixes delivered within target, by week" icon={<ShieldCheck size={16} />} />
              <div className="h-[300px] px-2 pb-4 sm:px-4">
                {loading ? <Skeleton className="h-full w-full" /> : compliance.length === 0 ? <EmptyState compact title="No resolved tickets yet" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compliance} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                      {grid}
                      <XAxis dataKey="week" {...axis} />
                      <YAxis {...axis} domain={[0, 100]} unit="%" width={48} />
                      <Tooltip content={<ChartTooltip unit="%" />} />
                      <ReferenceLine y={80} stroke={CHART.rose} strokeDasharray="4 4" label={{ value: 'Goal 80%', position: 'insideTopRight', fill: 'var(--text-subtle)', fontSize: 11 }} />
                      <Line type="monotone" dataKey="Within SLA" stroke={CHART.brand} strokeWidth={2.5} dot={{ r: 3.5, fill: CHART.brand }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
