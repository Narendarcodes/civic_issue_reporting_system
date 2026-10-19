import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { PlusCircle, ClipboardList, Clock3, CheckCircle2, Sparkles, ArrowRight, MapPin, AlarmClockOff, Trophy, Navigation } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { api } from '../../lib/api';
import { displayName, distanceMeters, isAwaitingConfirmation, isOpen, isResolved, nearestWard, shortAddress, slaState } from '../../lib/civic';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatSkeleton, IssueCardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { StatusChip } from '../../components/ui/StatusChip';
import { CategoryIcon } from '../../components/ui/CategoryBadge';
import { SlaBadge } from '../../components/ui/SlaBadge';
import { Avatar } from '../../components/ui/Avatar';
import { BaseMap, FitBounds } from '../../components/map/BaseMap';
import { ClusterLayer } from '../../components/map/ClusterLayer';
import { Marker } from 'react-leaflet';
import { meIcon } from '../../components/map/markers';
import { IssueCard, fmtDistance, issueTitle } from '../issues/IssueCard';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
const NEARBY_M = 3000;

export function Dashboard() {
  const { user, issues, issuesLoading, issuesError, refresh, go, openIssue } = useApp();
  const [leaders, setLeaders] = useState<any[] | null>(null);
  useEffect(() => { api<any[]>('/api/leaderboard').then(setLeaders).catch(() => setLeaders([])); }, []);

  const name = displayName(user).split(' ')[0];
  const home: [number, number] | null = user?.latitude != null ? [user.latitude, user.longitude] : null;
  const myWard = home ? nearestWard(home[0], home[1]) : null;

  const mine = useMemo(() => issues.filter(i => i.userId === user?.id), [issues, user?.id]);
  const awaiting = mine.filter(isAwaitingConfirmation);
  const nearby = useMemo(() => {
    if (!home) return issues.filter(isOpen).slice(0, 30);
    return issues
      .map(i => ({ i, d: distanceMeters(home[0], home[1], i.latitude, i.longitude) }))
      .filter(x => x.d <= NEARBY_M && x.i.status !== 'Closed')
      .sort((a, b) => a.d - b.d)
      .map(x => ({ ...x.i, _d: x.d }));
  }, [issues, home?.[0], home?.[1]]);
  const nearbyOpen = nearby.filter(isOpen);
  const nearbyOverdue = nearbyOpen.filter(i => slaState(i).overdue);
  const fixedNearby = nearby.filter(isResolved);

  if (issuesError && !issues.length) return <ErrorState message={issuesError} onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5"><MapPin size={12} />{myWard && myWard !== 'Unmapped' ? `${myWard}, Hyderabad` : shortAddress(user?.locationAddress)}</span>}
        title={<>{greeting()}, {name} <span aria-hidden>👋</span></>}
        subtitle={nearbyOpen.length ? `${nearbyOpen.length} open issue${nearbyOpen.length === 1 ? '' : 's'} within 3 km of you${nearbyOverdue.length ? ` — ${nearbyOverdue.length} past their deadline` : ''}.` : 'Your neighbourhood looks clear. Spot something? Report it in under a minute.'}
        actions={<Button size="lg" onClick={() => go('report')} leftIcon={<PlusCircle size={18} />}>Report an issue</Button>}
      />

      {awaiting.length > 0 && (
        <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} onClick={() => openIssue(awaiting[0].id)}
          className="flex w-full items-center gap-4 rounded-[var(--radius-lg)] border border-brand/30 bg-brand-soft p-4 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-brand-fg"><Sparkles size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-brand-strong">The crew says your {awaiting[0].category.toLowerCase()} report is fixed</span>
            <span className="block text-[13px] text-fg-muted">Take a look at the after photo and confirm — you earn 55 points.</span>
          </span>
          <ArrowRight size={18} className="text-brand-strong" />
        </motion.button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {issuesLoading ? [0, 1, 2, 3].map(i => <StatSkeleton key={i} />) : (
          <>
            <StatCard label="My reports" value={mine.length} icon={<ClipboardList size={16} />} hint={`${mine.filter(isOpen).length} still open`} />
            <StatCard label="Fixed for you" value={mine.filter(isResolved).length} icon={<CheckCircle2 size={16} />} tone="brand" hint={mine.length ? `${Math.round((mine.filter(isResolved).length / mine.length) * 100)}% of your reports` : 'Your first fix is one report away'} />
            <StatCard label="Open near you" value={nearbyOpen.length} icon={<Clock3 size={16} />} tone="warning" hint="Within 3 km" />
            <StatCard label="Reputation" value={user?.reputationPoints || 0} icon={<Trophy size={16} />} tone="info" hint={`${(user?.badges || []).length} badge${(user?.badges || []).length === 1 ? '' : 's'} earned`} />
          </>
        )}
      </div>

      {/* Map + nearest */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 overflow-hidden">
          <CardHeader title="Around you" subtitle="Open and recently fixed issues within 3 km" icon={<Navigation size={16} />}
            action={<Button size="sm" variant="ghost" onClick={() => go('feed')}>Open feed <ArrowRight size={14} /></Button>} />
          {issuesLoading ? <Skeleton className="h-[340px] w-full rounded-none" /> : (
            <BaseMap center={home || undefined} zoom={14} className="h-[340px] border-t border-line" label="Issues near you">
              {home && <Marker position={home} icon={meIcon()} />}
              <ClusterLayer issues={nearby} onSelect={i => openIssue(i.id)} />
              {home && <FitBounds points={[home, ...nearby.slice(0, 12).map(i => [i.latitude, i.longitude] as [number, number])]} />}
            </BaseMap>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Closest open issues" subtitle="Upvote the ones that affect you" icon={<MapPin size={16} />} />
          {issuesLoading ? <div className="space-y-3 p-5 pt-0">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            : nearbyOpen.length === 0 ? <EmptyState compact icon={<CheckCircle2 size={20} />} title="Nothing open nearby" body="Great news. Anything you report will show up here for your neighbours." />
              : (
                <ul className="divide-y divide-line">
                  {nearbyOpen.slice(0, 5).map(i => (
                    <li key={i.id}>
                      <button onClick={() => openIssue(i.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-muted">
                        <CategoryIcon category={i.category} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{issueTitle(i)}</span>
                          <span className="mt-1 flex items-center gap-2"><StatusChip issue={i} size="sm" /><SlaBadge issue={i} size="sm" /></span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-fg-subtle tabular-nums">{fmtDistance(i._d ?? 0)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
        </Card>
      </div>

      {/* Recently fixed + leaders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recently fixed near you</h2>
              <p className="text-[13px] text-fg-muted">Proof that reporting works — with before/after photos.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => go('wards')}>Ward scorecard <ArrowRight size={14} /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {issuesLoading ? [0, 1].map(i => <IssueCardSkeleton key={i} />)
              : fixedNearby.length ? fixedNearby.slice(0, 2).map((i, k) => <IssueCard key={i.id} issue={i} index={k} />)
                : <Card className="sm:col-span-2"><EmptyState compact icon={<CheckCircle2 size={20} />} title="No fixes nearby yet" body="When crews close issues around you, the before/after proof shows up here." /></Card>}
          </div>
        </div>
        <Card>
          <CardHeader title="Top neighbours" subtitle="Most helpful citizens this season" icon={<Trophy size={16} />}
            action={<Button size="sm" variant="ghost" onClick={() => go('leaderboard')}>All</Button>} />
          {leaders === null ? <div className="space-y-3 p-5 pt-0">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            : leaders.length === 0 ? <EmptyState compact title="No rankings yet" body="Report or verify an issue to get on the board." />
              : (
                <ol className="px-2 pb-3">
                  {leaders.slice(0, 5).map((l, idx) => (
                    <li key={l.id} className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 ${l.id === user?.id ? 'bg-brand-soft' : ''}`}>
                      <span className="w-5 text-center text-sm font-bold text-fg-subtle tabular-nums">{idx + 1}</span>
                      <Avatar name={displayName(l)} size={30} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{l.id === user?.id ? 'You' : displayName(l)}</span>
                      <span className="text-sm font-semibold tabular-nums">{l.reputationPoints}<span className="ml-0.5 text-xs font-medium text-fg-subtle">pts</span></span>
                    </li>
                  ))}
                </ol>
              )}
        </Card>
      </div>
    </div>
  );
}
