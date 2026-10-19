import React, { useState } from 'react';
import { format } from 'date-fns';
import { ThumbsUp, MapPin, Clock3, Share2, Check, X, UsersRound, Hash, Camera, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { distanceMeters, formatDuration, isAwaitingConfirmation, slaState, stageOf, shortAddress } from '../../lib/civic';
import { useApp } from '../../app/AppContext';
import { Modal } from '../../components/ui/Modal';
import { StatusChip } from '../../components/ui/StatusChip';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { SlaBadge, SlaBar, useNow } from '../../components/ui/SlaBadge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { BaseMap } from '../../components/map/BaseMap';
import { Marker } from 'react-leaflet';
import { categoryIcon } from '../../components/map/markers';
import { StatusTimeline } from './StatusTimeline';
import { ClosureProof } from './ClosureProof';
import { VerificationModal } from './VerificationModal';
import { useUpvote, hasVoted } from './useIssueActions';
import { fmtDistance, issueTitle, timeAgo } from './IssueCard';

export function IssueDetail({ issueId, onClose }: { issueId: string; onClose: () => void }) {
  const { issues, issuesLoading, user, refresh, isAdmin } = useApp();
  const issue = issues.find(i => i.id === issueId);
  const { upvote, busy } = useUpvote();
  const toast = useToast();
  const now = useNow();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [voting, setVoting] = useState(false);

  if (!issue) {
    return (
      <Modal open onClose={onClose} side="right" title="Issue" labelledBy="issue-title">
        {issuesLoading ? (
          <div className="space-y-4 p-5"><Skeleton className="aspect-[16/10] w-full" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-40 w-full" /></div>
        ) : (
          <EmptyState icon={<Hash size={20} />} title="Issue not found" body="It may have been removed or merged into another report." />
        )}
      </Modal>
    );
  }

  const stage = stageOf(issue);
  const sla = slaState(issue, now);
  const mine = issue.userId === user?.id;
  const voted = hasVoted(issue, user?.id);
  const dist = user?.latitude != null ? distanceMeters(user.latitude, user.longitude, issue.latitude, issue.longitude) : null;
  const hasAfter = !!(issue.resolutionImage || issue.workerImageUrl);
  const myCommunityVote = (issue.communityVotes || []).find((v: any) => v.userId === user?.id);
  const canCommunityVote = !isAdmin && !mine && stage === 'Resolved' && !myCommunityVote;

  const communityVote = async (vote: 'Resolved' | 'Not Resolved') => {
    setVoting(true);
    try {
      await api('/api/communityVote', { method: 'POST', body: { issueId: issue.id, vote, comment: '' } });
      await refresh();
      toast({ tone: 'success', title: 'Thanks for verifying', body: '+5 reputation for keeping the city honest.' });
    } catch (e: any) {
      toast({ tone: 'error', title: 'Could not record your vote', body: e.message });
    } finally {
      setVoting(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/user#feed&issue=${issue.id}`;
    try {
      if (navigator.share) await navigator.share({ title: issueTitle(issue), url });
      else { await navigator.clipboard.writeText(url); toast({ tone: 'success', title: 'Link copied' }); }
    } catch { /* user cancelled */ }
  };

  return (
    <Modal open onClose={onClose} side="right" title={<span className="flex items-center gap-2"><span className="text-fg-subtle font-mono text-xs">#{issue.id}</span></span>} labelledBy="issue-title">
      <div className="pb-8">
        {/* Media */}
        <div className="px-5 pt-5">
          {hasAfter && stage === 'Resolved' ? (
            <ClosureProof issue={issue} />
          ) : (
            <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken">
              {issue.imageUrl ? <img src={issue.imageUrl} alt={`${issue.category} at ${shortAddress(issue.locationAddress)}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                : <div className="grid h-full place-items-center text-fg-subtle"><Camera size={36} /></div>}
              <div className="absolute left-3 top-3"><CategoryBadge category={issue.category} onImage /></div>
            </div>
          )}
        </div>

        {/* Title block */}
        <div className="px-5 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip issue={issue} />
            <SlaBadge issue={issue} />
            {issue.priority === 'Emergency' && <span className="rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white">Emergency</span>}
            {issue.escalated && stage !== 'Resolved' && <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger ring-1 ring-inset ring-danger/25">Escalated</span>}
          </div>
          <h2 id="issue-title" className="mt-3 text-xl font-semibold leading-snug">{issueTitle(issue)}</h2>
          {(() => {
            const t = issueTitle(issue).replace(/…$/, '');
            const rest = String(issue.description || '').startsWith(t) ? String(issue.description).slice(t.length).trim() : String(issue.description || '');
            return rest && rest !== issueTitle(issue) ? <p className="mt-2 text-sm leading-relaxed text-fg-muted">{rest}</p> : null;
          })()}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-fg-muted">
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{shortAddress(issue.locationAddress)}{dist !== null && <span className="text-fg-subtle">· {fmtDistance(dist)} away</span>}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />Reported {timeAgo(issue.timestamp)}</span>
            {issue.ward && <span className="inline-flex items-center gap-1.5"><Building2 size={14} />{issue.ward}</span>}
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <Avatar name={issue.username || 'Citizen'} size={28} />
            <p className="text-[13px] text-fg-muted">Reported by <span className="font-semibold text-fg">{mine ? 'you' : issue.username || 'a citizen'}</span></p>
          </div>
        </div>

        {/* Actions */}
        <div className="mx-5 mt-5 flex flex-wrap gap-2">
          {mine && <span className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-surface-muted px-4 text-sm font-semibold text-fg-muted"><ThumbsUp size={16} />{issue.upvotes || 0} neighbours upvoted</span>}
          {!isAdmin && !mine && (
            <Button variant={voted ? 'primary' : 'secondary'} onClick={() => upvote(issue)} loading={busy === issue.id} leftIcon={<ThumbsUp size={16} />} aria-pressed={voted}>
              {voted ? 'Upvoted' : 'Me too'} · {issue.upvotes || 0}
            </Button>
          )}
          {mine && isAwaitingConfirmation(issue) && <Button onClick={() => setVerifyOpen(true)} leftIcon={<Check size={16} />}>Confirm the fix</Button>}
          <Button variant="ghost" onClick={share} leftIcon={<Share2 size={16} />}>Share</Button>
        </div>

        {/* Community verification of a fix */}
        {canCommunityVote && (
          <div className="mx-5 mt-5 rounded-[var(--radius-lg)] border border-line bg-surface-muted p-4">
            <p className="text-sm font-semibold">Live nearby? Is this really fixed?</p>
            <p className="text-xs text-fg-muted mt-0.5">Neighbour checks keep closures honest. +5 points.</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => communityVote('Resolved')} loading={voting} leftIcon={<Check size={14} />}>Yes, fixed</Button>
              <Button size="sm" variant="secondary" onClick={() => communityVote('Not Resolved')} disabled={voting} leftIcon={<X size={14} />}>Not fixed</Button>
            </div>
          </div>
        )}

        {/* SLA */}
        <section className="mx-5 mt-5 rounded-[var(--radius-lg)] border border-line p-4" aria-label="Service level">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Public SLA</p>
              <p className="mt-1 text-sm font-semibold">
                {sla.closed ? (sla.remainingMs >= 0 ? `Resolved ${formatDuration(sla.remainingMs)} ahead of target` : `Resolved ${formatDuration(sla.remainingMs)} after target`)
                  : sla.overdue ? `Overdue by ${formatDuration(sla.remainingMs)}` : `${formatDuration(sla.remainingMs)} left to fix`}
              </p>
            </div>
            <div className="text-right text-xs text-fg-muted">
              <p>Target {sla.hours} h{issue.priority === 'Emergency' ? ' (emergency)' : ''}</p>
              <p>Due {format(new Date(sla.dueAt), 'd MMM, h:mm a')}</p>
            </div>
          </div>
          <div className="mt-3"><SlaBar issue={issue} /></div>
        </section>

        {/* Timeline */}
        <section className="mx-5 mt-5 rounded-[var(--radius-lg)] border border-line p-4" aria-label="Timeline">
          <p className="eyebrow mb-4">Progress</p>
          <StatusTimeline issue={issue} />
        </section>

        {/* Community */}
        {((issue.communityVotes || []).length > 0 || issue.citizenVerification) && (
          <section className="mx-5 mt-5 rounded-[var(--radius-lg)] border border-line p-4" aria-label="Verification">
            <p className="eyebrow mb-3 flex items-center gap-1.5"><UsersRound size={13} />Verification</p>
            {issue.citizenVerification && (
              <div className={cn('mb-3 rounded-[var(--radius-md)] p-3 text-sm', issue.citizenVerification.vote === 'Resolved Properly' ? 'bg-brand-soft text-brand-strong' : 'bg-danger-soft text-danger')}>
                <p className="font-semibold">Reporter: {issue.citizenVerification.vote === 'Resolved Properly' ? 'confirmed fixed' : 'not fixed'}</p>
                {issue.citizenVerification.comment && <p className="mt-0.5 text-[13px] opacity-90">“{issue.citizenVerification.comment}”</p>}
              </div>
            )}
            <ul className="space-y-2">
              {(issue.communityVotes || []).slice(0, 6).map((v: any, k: number) => (
                <li key={k} className="flex items-center gap-2 text-[13px]">
                  <Avatar name={v.username || 'Neighbour'} size={22} />
                  <span className="font-medium text-fg">{v.username || 'Neighbour'}</span>
                  <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold', v.vote === 'Resolved' ? 'bg-brand-soft text-brand-strong' : 'bg-danger-soft text-danger')}>{v.vote === 'Resolved' ? 'Fixed' : 'Not fixed'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Map */}
        {typeof issue.latitude === 'number' && (
          <section className="mx-5 mt-5" aria-label="Location">
            <BaseMap center={[issue.latitude, issue.longitude]} zoom={16} className="h-48 rounded-[var(--radius-lg)] border border-line" label="Issue location">
              <Marker position={[issue.latitude, issue.longitude]} icon={categoryIcon(issue.category)} />
            </BaseMap>
            <p className="mt-2 text-xs text-fg-subtle">{issue.locationAddress}</p>
          </section>
        )}
      </div>
      <VerificationModal issue={issue} open={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </Modal>
  );
}
