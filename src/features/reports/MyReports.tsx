import React, { useMemo, useState } from 'react';
import { ClipboardList, PlusCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { isAwaitingConfirmation, isOpen, isResolved, stageOf, STAGE_FLOW } from '../../lib/civic';
import { PageHeader } from '../../components/ui/PageHeader';
import { Segmented } from '../../components/ui/Segmented';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { SlaBadge } from '../../components/ui/SlaBadge';
import { CategoryIcon } from '../../components/ui/CategoryBadge';
import { RowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { cn } from '../../lib/utils';
import { issueTitle, timeAgo } from '../issues/IssueCard';
import { shortAddress } from '../../lib/civic';

type Tab = 'active' | 'confirm' | 'done' | 'all';

/** Progress dots for the happy path. */
function MiniProgress({ issue }: { issue: any }) {
  const s = stageOf(issue);
  const idx = STAGE_FLOW.indexOf(s);
  return (
    <div className="flex items-center gap-1" aria-label={`Stage ${s}`}>
      {STAGE_FLOW.map((st, k) => <span key={st} className={cn('h-1.5 w-6 rounded-full', s === 'Rejected' ? 'bg-rose-300/60' : k <= idx ? 'bg-brand' : 'bg-surface-sunken')} />)}
    </div>
  );
}

export function MyReports() {
  const { issues, user, issuesLoading, issuesError, refresh, go, openIssue } = useApp();
  const mine = useMemo(() => issues.filter(i => i.userId === user?.id).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)), [issues, user?.id]);
  const confirm = mine.filter(isAwaitingConfirmation);
  const [tab, setTab] = useState<Tab>(confirm.length ? 'confirm' : 'active');
  const rows = mine.filter(i => tab === 'all' ? true : tab === 'active' ? isOpen(i) : tab === 'confirm' ? isAwaitingConfirmation(i) : (isResolved(i) && !isAwaitingConfirmation(i)) || stageOf(i) === 'Rejected');

  return (
    <div>
      <PageHeader eyebrow="Tracking" title="My reports" subtitle="Every report you've filed, where it stands, and how long the city has left to fix it."
        actions={<Button onClick={() => go('report')} leftIcon={<PlusCircle size={16} />}>New report</Button>} />
      <Segmented label="Filter reports" value={tab} onChange={setTab} options={[
        { value: 'active', label: 'In progress', count: mine.filter(isOpen).length },
        { value: 'confirm', label: 'Needs your OK', count: confirm.length },
        { value: 'done', label: 'Closed', count: mine.filter(i => (isResolved(i) && !isAwaitingConfirmation(i)) || stageOf(i) === 'Rejected').length },
        { value: 'all', label: 'All', count: mine.length },
      ]} className="mb-4 max-w-full overflow-x-auto no-scrollbar" />
      <Card className="overflow-hidden">
        {issuesError && !issues.length ? <div className="p-4"><ErrorState message={issuesError} onRetry={refresh} /></div>
          : issuesLoading ? <RowSkeleton rows={5} />
            : rows.length === 0 ? (
              <EmptyState icon={<ClipboardList size={22} />}
                title={mine.length === 0 ? 'You have not reported anything yet' : tab === 'confirm' ? 'Nothing waiting on you' : 'Nothing here'}
                body={mine.length === 0 ? 'Spotted a pothole or an overflowing bin? It takes under a minute, and you earn 10 points.' : 'When a crew marks one of your reports as fixed, it shows up here for you to confirm.'}
                action={mine.length === 0 ? <Button onClick={() => go('report')} leftIcon={<PlusCircle size={16} />}>Report your first issue</Button> : undefined} />
            ) : (
              <ul className="divide-y divide-line">
                {rows.map(i => (
                  <li key={i.id}>
                    <button onClick={() => openIssue(i.id)} className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-surface-muted sm:px-5">
                      {i.imageUrl ? <img src={i.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] object-cover" /> : <CategoryIcon category={i.category} size={56} />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-fg">{issueTitle(i)}</span>
                        <span className="mt-0.5 block truncate text-xs text-fg-muted">{i.category} · {shortAddress(i.locationAddress)} · {timeAgo(i.timestamp)}</span>
                        <span className="mt-2 flex flex-wrap items-center gap-2"><StatusChip issue={i} size="sm" /><SlaBadge issue={i} size="sm" /><span className="hidden sm:inline-flex"><MiniProgress issue={i} /></span></span>
                      </span>
                      {isAwaitingConfirmation(i) ? <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg">Confirm fix <ArrowRight size={13} /></span>
                        : <ArrowRight size={16} className="shrink-0 text-fg-subtle" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
      </Card>
    </div>
  );
}
