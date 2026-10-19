import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Table2, Columns3, AlarmClockOff, ThumbsUp, SearchX, X } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { CATEGORIES, STAGES, STAGE_FLOW, STAGE_META, slaState, stageOf, shortAddress, type Stage, isOpen } from '../../lib/civic';
import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Segmented';
import { Select, Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { SlaBadge } from '../../components/ui/SlaBadge';
import { CategoryIcon } from '../../components/ui/CategoryBadge';
import { RowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { issueTitle, timeAgo } from '../issues/IssueCard';
import { ManageIssueDrawer, teamName, useTeams } from './ManageIssueDrawer';

type Sort = 'deadline' | 'newest' | 'upvotes';

export function AdminIssueManager() {
  const { issues, issuesLoading, issuesError, refresh } = useApp();
  const teams = useTeams();
  const [mode, setMode] = useState<'table' | 'board'>('table');
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<'all' | Stage>('all');
  const [cat, setCat] = useState('all');
  const [team, setTeam] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('deadline');
  const [selected, setSelected] = useState<any>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return issues
      .filter(i => (stage === 'all' || stageOf(i) === stage)
        && (cat === 'all' || i.category === cat)
        && (team === 'all' || (team === 'none' ? !i.assignedTeam : i.assignedTeam === team))
        && (!overdueOnly || (isOpen(i) && slaState(i).overdue))
        && (!n || `${i.id} ${i.description} ${i.locationAddress} ${i.ward || ''} ${i.username || ''}`.toLowerCase().includes(n)))
      .sort((a, b) => sort === 'newest' ? +new Date(b.timestamp) - +new Date(a.timestamp)
        : sort === 'upvotes' ? (b.upvotes || 0) - (a.upvotes || 0)
          : (isOpen(b) ? 1 : 0) - (isOpen(a) ? 1 : 0) || slaState(a).remainingMs - slaState(b).remainingMs);
  }, [issues, q, stage, cat, team, overdueOnly, sort]);

  const overdueCount = issues.filter(i => isOpen(i) && slaState(i).overdue).length;
  const stageCounts = useMemo(() => Object.fromEntries(STAGES.map(s => [s, issues.filter(i => stageOf(i) === s).length])), [issues]);
  const filtersOn = q || stage !== 'all' || cat !== 'all' || team !== 'all' || overdueOnly;
  const clear = () => { setQ(''); setStage('all'); setCat('all'); setTeam('all'); setOverdueOnly(false); };

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Issue manager" subtitle="Triage, assign crews, move tickets forward and close them with photo proof."
        actions={<Segmented label="Layout" value={mode} onChange={setMode} options={[{ value: 'table', label: 'Table', icon: <Table2 size={14} /> }, { value: 'board', label: 'Board', icon: <Columns3 size={14} /> }]} />} />

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <Input type="search" aria-label="Search tickets" className="pl-9" placeholder="Search ticket ID, street, ward, reporter…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="Status" value={stage} onChange={e => setStage(e.target.value as any)} className="h-9 w-[170px] py-0 text-[13px]">
              <option value="all">All statuses</option>
              {STAGES.map(s => <option key={s} value={s}>{s} ({stageCounts[s] || 0})</option>)}
            </Select>
            <Select aria-label="Category" value={cat} onChange={e => setCat(e.target.value)} className="h-9 w-[190px] py-0 text-[13px]">
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select aria-label="Crew" value={team} onChange={e => setTeam(e.target.value)} className="h-9 w-[210px] py-0 text-[13px]">
              <option value="all">All crews</option>
              <option value="none">Unassigned</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="h-9 w-[160px] py-0 text-[13px]">
              <option value="deadline">Deadline first</option>
              <option value="newest">Newest</option>
              <option value="upvotes">Most upvoted</option>
            </Select>
            <button onClick={() => setOverdueOnly(v => !v)} aria-pressed={overdueOnly}
              className={cn('inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-[13px] font-semibold', overdueOnly ? 'border-danger bg-danger text-white' : 'border-line text-danger hover:bg-danger-soft')}>
              <AlarmClockOff size={14} /> Overdue <span className="tabular-nums">{overdueCount}</span>
            </button>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        {issuesError && !issues.length ? <ErrorState message={issuesError} onRetry={refresh} />
          : issuesLoading ? <Card><RowSkeleton rows={8} /></Card>
            : filtered.length === 0 ? (
              <Card><EmptyState icon={<SearchX size={22} />} title="No tickets match" body="Adjust the filters to see more." action={filtersOn ? <Button variant="secondary" onClick={clear} leftIcon={<X size={14} />}>Clear filters</Button> : undefined} /></Card>
            ) : mode === 'table' ? (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-surface-muted/60">
                      <tr className="text-left text-xs font-semibold text-fg-subtle">
                        <th scope="col" className="px-4 py-3">Issue</th>
                        <th scope="col" className="px-3 py-3">Status</th>
                        <th scope="col" className="px-3 py-3">SLA</th>
                        <th scope="col" className="px-3 py-3">Priority</th>
                        <th scope="col" className="px-3 py-3">Crew</th>
                        <th scope="col" className="px-3 py-3 text-right">Votes</th>
                        <th scope="col" className="px-4 py-3 text-right">Reported</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filtered.slice(0, 100).map(i => (
                        <tr key={i.id} onClick={() => setSelected(i)} className="cursor-pointer hover:bg-surface-muted/70" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setSelected(i)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {i.imageUrl ? <img src={i.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] object-cover" /> : <CategoryIcon category={i.category} size={40} />}
                              <div className="min-w-0 max-w-[340px]">
                                <p className="truncate font-semibold text-fg">{issueTitle(i)}</p>
                                <p className="truncate text-xs text-fg-muted"><span className="font-mono">#{i.id}</span> · {i.category} · {i.ward || shortAddress(i.locationAddress)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><StatusChip issue={i} size="sm" /></td>
                          <td className="px-3 py-3"><SlaBadge issue={i} size="sm" /></td>
                          <td className="px-3 py-3"><span className={cn('text-xs font-semibold', i.priority === 'Emergency' ? 'text-danger' : i.priority === 'High' ? 'text-warning' : 'text-fg-muted')}>{i.priority || 'Normal'}</span></td>
                          <td className="px-3 py-3 text-[13px] text-fg-muted"><span className="block max-w-[170px] truncate" title={teamName(teams, i.assignedTeam)}>{teamName(teams, i.assignedTeam)}</span></td>
                          <td className="px-3 py-3 text-right tabular-nums text-fg-muted"><span className="inline-flex items-center gap-1"><ThumbsUp size={12} />{i.upvotes || 0}</span></td>
                          <td className="px-4 py-3 text-right text-xs text-fg-muted whitespace-nowrap">{timeAgo(i.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-line px-4 py-2.5 text-xs text-fg-muted">{filtered.length} ticket{filtered.length === 1 ? '' : 's'}{filtered.length > 100 ? ' · showing first 100' : ''}</p>
              </Card>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                <div className="grid min-w-[1100px] grid-cols-5 gap-3">
                  {STAGE_FLOW.map(s => {
                    const col = filtered.filter(i => stageOf(i) === s);
                    const Icon = STAGE_META[s].icon;
                    return (
                      <section key={s} aria-label={s} className="rounded-[var(--radius-lg)] border border-line bg-surface-muted/60 p-2">
                        <header className="flex items-center justify-between px-2 py-2">
                          <span className="flex items-center gap-2 text-[13px] font-semibold"><span className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: STAGE_META[s].dot }}><Icon size={13} /></span>{s}</span>
                          <span className="rounded-full bg-surface px-2 text-xs font-semibold tabular-nums text-fg-muted">{col.length}</span>
                        </header>
                        <div className="space-y-2 max-h-[calc(100vh-320px)] min-h-[200px] overflow-y-auto pr-0.5">
                          {col.slice(0, 30).map((i, k) => (
                            <motion.button key={i.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(k, 8) * 0.03 }}
                              onClick={() => setSelected(i)} className="block w-full rounded-[var(--radius-md)] border border-line bg-surface p-3 text-left shadow-[var(--shadow-e1)] hover:border-line-strong">
                              <div className="flex items-start gap-2.5">
                                <CategoryIcon category={i.category} size={28} />
                                <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug line-clamp-2">{issueTitle(i)}</p>
                              </div>
                              <p className="mt-2 truncate text-xs text-fg-muted">{i.ward || shortAddress(i.locationAddress)} · {teamName(teams, i.assignedTeam)}</p>
                              <div className="mt-2 flex items-center justify-between"><SlaBadge issue={i} size="sm" /><span className="inline-flex items-center gap-1 text-xs text-fg-subtle"><ThumbsUp size={11} />{i.upvotes || 0}</span></div>
                            </motion.button>
                          ))}
                          {col.length === 0 && <p className="px-2 py-6 text-center text-xs text-fg-subtle">Nothing here</p>}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}
      </div>
      <ManageIssueDrawer issue={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
