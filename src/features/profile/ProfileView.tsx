import React, { lazy, Suspense, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Mail, MapPin, Sun, Moon, Monitor, Award, Flag, ShieldCheck, Eye, Flame, Star, LogOut, Pencil, Activity } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { useTheme, type ThemePref } from '../../lib/theme';
import { displayName, isResolved, shortAddress, stageOf } from '../../lib/civic';
import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusChip } from '../../components/ui/StatusChip';
import { issueTitle } from '../issues/IssueCard';

const LocationSetup = lazy(() => import('../auth/LocationSetup').then(m => ({ default: m.LocationSetup })));

export function ProfileView() {
  const { user, issues, isAdmin, logout, refreshMe, openIssue } = useApp();
  const { pref, setPref } = useTheme();
  const [editLoc, setEditLoc] = useState(false);
  const name = displayName(user);

  const mine = useMemo(() => issues.filter(i => i.userId === user?.id), [issues, user?.id]);
  const verifications = useMemo(() => issues.filter(i => (i.communityVotes || []).some((v: any) => v.userId === user?.id)).length, [issues, user?.id]);
  const upvotesGiven = useMemo(() => issues.filter(i => (i.votedBy || []).includes(user?.id)).length, [issues, user?.id]);
  const fixed = mine.filter(isResolved).length;

  const achievements = [
    { icon: Flag, label: 'First report', got: mine.length >= 1, hint: 'File your first report' },
    { icon: Eye, label: 'Eagle eye', got: mine.length >= 5, hint: '5 reports filed' },
    { icon: ShieldCheck, label: 'Fix verifier', got: verifications >= 1, hint: 'Verify a neighbour’s fix' },
    { icon: Star, label: 'Problem solver', got: fixed >= 3, hint: '3 of your reports fixed' },
    { icon: Flame, label: 'Community voice', got: upvotesGiven >= 10, hint: 'Upvote 10 issues' },
    ...((user?.badges || []) as string[]).map(b => ({ icon: Award, label: b, got: true, hint: b })),
  ];

  const activity = useMemo(() => {
    const ev: { at: string; text: string; issue: any }[] = [];
    for (const i of mine) for (const h of i.statusHistory || []) ev.push({ at: h.at, text: stageOf({ status: h.status }), issue: i });
    return ev.filter(e => e.at).sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 8);
  }, [mine]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow={isAdmin ? 'Account' : 'Profile'} title={isAdmin ? 'Your account' : 'Your civic profile'} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:row-span-2">
          <div className="flex flex-col items-center text-center">
            <Avatar name={name} size={88} />
            <h2 className="mt-4 text-xl font-semibold">{name}</h2>
            <p className="text-sm text-fg-muted">{isAdmin ? 'Administrator · GHMC operations' : `Citizen since ${user?.id ? '2026' : ''}`}</p>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-start gap-3"><Mail size={16} className="mt-0.5 text-fg-subtle" /><dd className="min-w-0 break-all text-fg">{user?.email || '—'}</dd></div>
            {!isAdmin && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-fg-subtle" />
                <dd className="min-w-0 flex-1 text-fg">{shortAddress(user?.locationAddress)}</dd>
                <button onClick={() => setEditLoc(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><Pencil size={12} />Change</button>
              </div>
            )}
          </dl>
          {!isAdmin && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[['Reputation', user?.reputationPoints || 0], ['Reports', mine.length], ['Fixed', fixed], ['Verified', verifications]].map(([l, v]) => (
                <div key={l as string} className="rounded-[var(--radius-md)] bg-surface-muted p-3 text-center">
                  <p className="font-display text-2xl font-semibold tabular-nums">{v}</p>
                  <p className="text-xs text-fg-muted">{l}</p>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="mt-6 w-full" onClick={logout} leftIcon={<LogOut size={16} />}>Sign out</Button>
        </Card>

        <Card className="lg:col-span-2 self-start">
          <CardHeader title="Appearance" subtitle="Dark mode follows your system unless you choose otherwise." />
          <div className="px-5 pb-5 sm:px-6">
            <Segmented<ThemePref> label="Theme" value={pref} onChange={setPref} options={[
              { value: 'light', label: 'Light', icon: <Sun size={14} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
              { value: 'system', label: 'System', icon: <Monitor size={14} /> },
            ]} />
          </div>
        </Card>

        {!isAdmin && (
          <Card className="lg:col-span-2">
            <CardHeader title="Achievements" subtitle="Earned from what you actually do on Civi-Snap." icon={<Award size={16} />} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-5 pb-5 sm:px-6">
              {achievements.map(a => {
                const Icon = a.icon;
                return (
                  <div key={a.label} className={cn('flex items-center gap-3 rounded-[var(--radius-md)] border p-3', a.got ? 'border-brand/25 bg-brand-soft' : 'border-dashed border-line')}>
                    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', a.got ? 'bg-brand text-brand-fg' : 'bg-surface-muted text-fg-subtle')}><Icon size={16} /></span>
                    <span className="min-w-0"><span className={cn('block truncate text-[13px] font-semibold', a.got ? 'text-fg' : 'text-fg-muted')}>{a.label}</span><span className="block truncate text-[11px] text-fg-subtle">{a.got ? 'Unlocked' : a.hint}</span></span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {!isAdmin && (
          <Card className="lg:col-span-3">
            <CardHeader title="Recent activity" subtitle="Status changes on issues you reported" icon={<Activity size={16} />} />
            {activity.length === 0 ? <EmptyState compact title="No activity yet" body="Updates on your reports will show up here." /> : (
              <ul className="divide-y divide-line">
                {activity.map((e, k) => (
                  <li key={k}>
                    <button onClick={() => openIssue(e.issue.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-muted sm:px-6">
                      <StatusChip stage={e.text as any} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm text-fg">{issueTitle(e.issue)}</span>
                      <span className="shrink-0 text-xs text-fg-subtle">{format(new Date(e.at), 'd MMM')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <Modal open={editLoc} onClose={() => setEditLoc(false)} title="Change your area" labelledBy="loc-title" className="max-w-2xl">
        <Suspense fallback={<div className="p-6 text-sm text-fg-muted">Loading map…</div>}>
          {editLoc && <LocationSetup user={user} embedded onComplete={async () => { await refreshMe(); setEditLoc(false); }} />}
        </Suspense>
      </Modal>
    </div>
  );
}
