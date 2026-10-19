import React from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, MapPin, Camera, MessageCircleWarning } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '../../lib/utils';
import { distanceMeters, isAwaitingConfirmation, shortAddress } from '../../lib/civic';
import { useApp } from '../../app/AppContext';
import { StatusChip } from '../../components/ui/StatusChip';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { SlaBadge } from '../../components/ui/SlaBadge';
import { Avatar } from '../../components/ui/Avatar';
import { useUpvote, hasVoted } from './useIssueActions';

export const fmtDistance = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`);
export const issueTitle = (i: any) => {
  const d = String(i?.description || '').trim();
  const first = d.split(/(?<=[.!?])\s/)[0] || d;
  return first.length > 90 ? first.slice(0, 88).trimEnd() + '…' : first || `${i?.category || 'Civic'} issue`;
};
export const timeAgo = (ts?: string) => {
  try { return ts ? formatDistanceToNowStrict(new Date(ts), { addSuffix: true }) : ''; } catch { return ''; }
};

export function IssueCard({ issue, index = 0, compact }: { issue: any; index?: number; compact?: boolean }) {
  const { user, openIssue } = useApp();
  const { upvote, busy } = useUpvote();
  const dist = user?.latitude != null && issue?.latitude != null ? distanceMeters(user.latitude, user.longitude, issue.latitude, issue.longitude) : null;
  const voted = hasVoted(issue, user?.id);
  const mine = issue.userId === user?.id;
  const img = issue.resolutionImage && issue.status !== 'Pending Citizen Confirmation' ? issue.resolutionImage : issue.imageUrl;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover group overflow-hidden flex flex-col"
    >
      <button onClick={() => openIssue(issue.id)} className="relative block text-left" aria-label={`Open ${issue.category} issue: ${issueTitle(issue)}`}>
        <div className={cn('relative overflow-hidden bg-surface-sunken', compact ? 'aspect-[16/9]' : 'aspect-[16/10]')}>
          {img ? (
            <img src={img} alt={`${issue.category} reported at ${shortAddress(issue.locationAddress)}`} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
          ) : (
            <div className="grid h-full w-full place-items-center text-fg-subtle"><Camera size={32} /></div>
          )}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute left-3 top-3 right-3 flex items-start justify-between gap-2">
            <CategoryBadge category={issue.category} onImage />
            <SlaBadge issue={issue} size="sm" onImage />
          </div>
          {issue.priority === 'Emergency' && (
            <span className="absolute left-3 bottom-3 rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Emergency</span>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <button onClick={() => openIssue(issue.id)} className="text-left">
          <h3 className="font-sans text-[15px] font-semibold leading-snug text-fg line-clamp-2">{issueTitle(issue)}</h3>
        </button>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-fg-muted">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{shortAddress(issue.locationAddress)}</span>
          {dist !== null && <span className="shrink-0 text-fg-subtle">· {fmtDistance(dist)}</span>}
        </p>

        {mine && isAwaitingConfirmation(issue) && (
          <button onClick={() => openIssue(issue.id)} className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] bg-brand-soft px-3 py-2 text-left text-[13px] font-semibold text-brand-strong">
            <MessageCircleWarning size={16} /> Crew says it's fixed — confirm?
          </button>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <StatusChip issue={issue} size="sm" />
          </div>
          <button
            onClick={() => upvote(issue)}
            disabled={busy === issue.id}
            aria-pressed={voted}
            aria-label={`${voted ? 'Remove upvote' : 'Upvote'} (${issue.upvotes || 0})`}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold tabular-nums transition-colors',
              voted ? 'border-brand bg-brand text-brand-fg' : 'border-line text-fg-muted hover:border-brand hover:text-brand',
            )}
          >
            <ThumbsUp size={14} strokeWidth={2.4} /> {issue.upvotes || 0}
          </button>
        </div>
        {!compact && (
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-fg-subtle">
            <Avatar name={issue.username || 'Citizen'} size={20} />
            <span className="truncate">{mine ? 'You' : issue.username || 'Citizen'}</span>
            <span>·</span>
            <span className="shrink-0">{timeAgo(issue.timestamp)}</span>
          </div>
        )}
      </div>
    </motion.article>
  );
}
