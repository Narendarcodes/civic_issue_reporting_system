import React, { useMemo, useState } from 'react';
import { Search, LayoutGrid, Map as MapIcon, SearchX, AlarmClockOff, X } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { CATEGORIES, categoryMeta, distanceMeters, isOpen, isResolved, slaState, stageOf } from '../../lib/civic';
import { PageHeader } from '../../components/ui/PageHeader';
import { Segmented, Chip } from '../../components/ui/Segmented';
import { Select, Input } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IssueCardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { BaseMap, FitBounds } from '../../components/map/BaseMap';
import { ClusterLayer } from '../../components/map/ClusterLayer';
import { IssueCard } from '../issues/IssueCard';

type StatusFilter = 'all' | 'open' | 'overdue' | 'resolved';
type Sort = 'newest' | 'upvotes' | 'nearest' | 'deadline';

export function CommunityFeed() {
  const { issues, issuesLoading, issuesError, refresh, user, openIssue } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [sort, setSort] = useState<Sort>('newest');
  const [mode, setMode] = useState<'grid' | 'map'>('grid');

  const visible = useMemo(() => issues.filter(i => stageOf(i) !== 'Rejected'), [issues]);
  const counts = useMemo(() => ({
    all: visible.length,
    open: visible.filter(isOpen).length,
    overdue: visible.filter(i => isOpen(i) && slaState(i).overdue).length,
    resolved: visible.filter(isResolved).length,
  }), [visible]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = visible.filter(i => {
      if (cat !== 'All' && i.category !== cat) return false;
      if (status === 'open' && !isOpen(i)) return false;
      if (status === 'resolved' && !isResolved(i)) return false;
      if (status === 'overdue' && !(isOpen(i) && slaState(i).overdue)) return false;
      if (needle) {
        const hay = `${i.description} ${i.locationAddress} ${i.category} ${i.ward || ''} ${i.username || ''} ${i.id}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const home = user?.latitude != null ? [user.latitude, user.longitude] : null;
    r = [...r].sort((a, b) => {
      if (sort === 'upvotes') return (b.upvotes || 0) - (a.upvotes || 0);
      if (sort === 'deadline') return slaState(a).remainingMs - slaState(b).remainingMs;
      if (sort === 'nearest' && home) return distanceMeters(home[0], home[1], a.latitude, a.longitude) - distanceMeters(home[0], home[1], b.latitude, b.longitude);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return r;
  }, [visible, q, cat, status, sort, user?.latitude]);

  const clear = () => { setQ(''); setCat('All'); setStatus('all'); };
  const filtersOn = q || cat !== 'All' || status !== 'all';

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="What's happening in Hyderabad"
        subtitle={`${counts.open} open · ${counts.resolved} fixed · ${counts.overdue} past deadline. Upvote what affects you; verify fixes you can see.`}
        actions={<Segmented label="View" value={mode} onChange={setMode} options={[{ value: 'grid', label: 'Cards', icon: <LayoutGrid size={14} /> }, { value: 'map', label: 'Map', icon: <MapIcon size={14} /> }]} />}
      />

      <Card className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <Input type="search" aria-label="Search issues" placeholder="Search by street, area, category or ID…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented size="sm" className="max-w-full overflow-x-auto no-scrollbar" label="Status" value={status} onChange={setStatus} options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'open', label: 'Open', count: counts.open },
              { value: 'overdue', label: 'Overdue', count: counts.overdue, icon: <AlarmClockOff size={13} /> },
              { value: 'resolved', label: 'Fixed', count: counts.resolved },
            ]} />
            <label className="sr-only" htmlFor="feed-sort">Sort</label>
            <Select id="feed-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="h-9 w-auto py-0 text-[13px]">
              <option value="newest">Newest</option>
              <option value="upvotes">Most upvoted</option>
              <option value="nearest">Nearest to me</option>
              <option value="deadline">Deadline soonest</option>
            </Select>
          </div>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar" role="group" aria-label="Category filter">
          <Chip active={cat === 'All'} onClick={() => setCat('All')}>All categories</Chip>
          {CATEGORIES.map(c => {
            const m = categoryMeta(c); const Icon = m.icon;
            return <Chip key={c} active={cat === c} onClick={() => setCat(c)} icon={<Icon size={14} style={cat === c ? undefined : { color: m.color }} />}>{c}</Chip>;
          })}
        </div>
      </Card>

      <div className="mt-5">
        {issuesError && !issues.length ? <ErrorState message={issuesError} onRetry={refresh} />
          : mode === 'map' ? (
            <Card className="overflow-hidden">
              {issuesLoading ? <Skeleton className="h-[620px] w-full rounded-none" /> : (
                <BaseMap zoom={12} className="h-[620px]" scrollWheelZoom label="Issue map">
                  <ClusterLayer issues={filtered} onSelect={i => openIssue(i.id)} />
                  <FitBounds points={filtered.map(i => [i.latitude, i.longitude] as [number, number])} maxZoom={14} />
                </BaseMap>
              )}
              <p className="border-t border-line px-4 py-2.5 text-xs text-fg-muted">{filtered.length} issues shown · pins are coloured by category, red rings mark overdue issues · tap a pin for details</p>
            </Card>
          ) : issuesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <IssueCardSkeleton key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <Card><EmptyState icon={<SearchX size={22} />} title="No issues match these filters" body={status === 'overdue' ? 'Nothing is past its deadline right now. Nice.' : 'Try a different category or clear the search.'}
              action={filtersOn ? <Button variant="secondary" onClick={clear} leftIcon={<X size={14} />}>Clear filters</Button> : undefined} /></Card>
          ) : (
            <>
              <p className="mb-3 text-[13px] text-fg-muted">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.slice(0, 60).map((i, k) => <IssueCard key={i.id} issue={i} index={k} />)}
              </div>
            </>
          )}
      </div>
    </div>
  );
}
