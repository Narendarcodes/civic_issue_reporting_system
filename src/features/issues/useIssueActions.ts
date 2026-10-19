import { useState } from 'react';
import { api } from '../../lib/api';
import { useApp } from '../../app/AppContext';
import { useToast } from '../../components/ui/Toast';

/** Upvote ("me too") toggle shared by cards, detail and the duplicate warning. */
export function useUpvote() {
  const { refresh, refreshMe, user } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const upvote = async (issue: any) => {
    if (!issue?.id || busy) return;
    if (issue.userId === user?.id) {
      toast({ tone: 'info', title: "That's your own report", body: 'Share it with neighbours so they can confirm it.' });
      return;
    }
    setBusy(issue.id);
    try {
      const r = await api<{ message: string }>(`/api/issues/${issue.id}/upvote`, { method: 'POST' });
      await refresh();
      refreshMe();
      toast({ tone: 'success', title: r?.message === 'Upvote removed' ? 'Upvote removed' : 'Thanks — your neighbours count on it', body: r?.message === 'Upvote removed' ? undefined : 'Upvotes push issues up the queue and help verify them.' });
    } catch (e: any) {
      toast({ tone: 'error', title: 'Could not upvote', body: e.message });
    } finally {
      setBusy(null);
    }
  };
  return { upvote, busy };
}

export const hasVoted = (issue: any, userId?: string) => !!userId && Array.isArray(issue?.votedBy) && issue.votedBy.includes(userId);
