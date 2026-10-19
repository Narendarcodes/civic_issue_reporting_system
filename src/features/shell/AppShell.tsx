import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard, PlusCircle, Newspaper, ClipboardList, Trophy, MapPinned, UserRound, LogOut, Menu, X,
  Map as MapIcon, ListChecks, BarChart3, Database, Plus,
} from 'lucide-react';
import { useApp, type AppView } from '../../app/AppContext';
import { cn } from '../../lib/utils';
import { displayName, isOpen, slaState } from '../../lib/civic';
import { Logo } from '../../components/ui/Logo';
import { Avatar } from '../../components/ui/Avatar';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Notifications } from './Notifications';
import { LanguageButton } from './LanguageButton';
import { PageSkeleton } from './PageSkeleton';
import { ErrorBoundary } from './ErrorBoundary';

const named = <T extends Record<string, any>>(loader: () => Promise<T>, key: keyof T) =>
  lazy(() => loader().then(m => ({ default: m[key] as React.ComponentType<any> })));

const Dashboard = named(() => import('../dashboard/Dashboard'), 'Dashboard');
const ReportForm = named(() => import('../report/ReportForm'), 'ReportForm');
const CommunityFeed = named(() => import('../feed/CommunityFeed'), 'CommunityFeed');
const MyReports = named(() => import('../reports/MyReports'), 'MyReports');
const LeaderboardView = named(() => import('../leaderboard/LeaderboardView'), 'LeaderboardView');
const ProfileView = named(() => import('../profile/ProfileView'), 'ProfileView');
const WardScorecard = named(() => import('../wards/WardScorecard'), 'WardScorecard');
const AdminDashboard = named(() => import('../admin/AdminDashboard'), 'AdminDashboard');
const AdminMap = named(() => import('../admin/AdminMap'), 'AdminMap');
const AdminIssueManager = named(() => import('../admin/AdminIssueManager'), 'AdminIssueManager');
const AdminAnalytics = named(() => import('../admin/AdminAnalytics'), 'AdminAnalytics');
const IssueDetail = named(() => import('../issues/IssueDetail'), 'IssueDetail');

interface NavDef { view: AppView; label: string; icon: React.ComponentType<any>; badge?: number }

function useNav(): NavDef[] {
  const { isAdmin, issues, user } = useApp();
  if (isAdmin) {
    const overdue = issues.filter(i => isOpen(i) && slaState(i).overdue).length;
    return [
      { view: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard },
      { view: 'admin-issues', label: 'Issue manager', icon: ListChecks, badge: overdue || undefined },
      { view: 'admin-map', label: 'City map', icon: MapIcon },
      { view: 'admin-analytics', label: 'Analytics', icon: BarChart3 },
      { view: 'wards', label: 'Ward scorecard', icon: MapPinned },
      { view: 'profile', label: 'Account', icon: UserRound },
    ];
  }
  const awaiting = issues.filter(i => i.userId === user?.id && i.status === 'Pending Citizen Confirmation').length;
  return [
    { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { view: 'report', label: 'Report an issue', icon: PlusCircle },
    { view: 'feed', label: 'Community feed', icon: Newspaper },
    { view: 'history', label: 'My reports', icon: ClipboardList, badge: awaiting || undefined },
    { view: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { view: 'wards', label: 'Ward scorecard', icon: MapPinned },
    { view: 'profile', label: 'Profile', icon: UserRound },
  ];
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { view, go, logout, isAdmin } = useApp();
  const nav = useNav();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-6">
        <Logo sub={isAdmin ? 'Admin console' : 'Citizen'} />
      </div>
      <nav aria-label="Main" className="flex-1 space-y-0.5 px-3">
        {nav.map(n => {
          const active = view === n.view;
          const Icon = n.icon;
          return (
            <button
              key={n.view}
              onClick={() => { go(n.view); onNavigate?.(); }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold transition-colors duration-150',
                active ? 'bg-brand-soft text-brand-strong' : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
              )}
            >
              {active && <motion.span layoutId="nav-active" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand" transition={{ duration: 0.2 }} />}
              <Icon size={18} strokeWidth={2.1} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge ? <span className={cn('rounded-full px-1.5 text-[11px] font-bold tabular-nums', isAdmin ? 'bg-danger text-white' : 'bg-brand text-brand-fg')}>{n.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="mt-4 space-y-0.5 border-t border-line px-3 py-4">
        <a href="/api/public/data" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg">
          <Database size={18} /> Open data API
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold text-fg-muted hover:bg-danger-soft hover:text-danger">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Citizen mobile bottom navigation with a centred report action. */
function BottomNav() {
  const { view, go } = useApp();
  const items: { view: AppView; label: string; icon: React.ComponentType<any> }[] = [
    { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { view: 'feed', label: 'Feed', icon: Newspaper },
    { view: 'report', label: 'Report', icon: Plus },
    { view: 'history', label: 'Mine', icon: ClipboardList },
    { view: 'profile', label: 'Profile', icon: UserRound },
  ];
  return (
    <nav aria-label="Primary" className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface shadow-[0_-8px_24px_-16px_rgb(var(--shadow-color)/0.25)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map(it => {
          const active = view === it.view;
          const Icon = it.icon;
          if (it.view === 'report') {
            return (
              <button key={it.view} onClick={() => go('report')} aria-label="Report an issue" className="flex flex-col items-center justify-center py-1.5">
                <span className={cn('-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-fg shadow-[0_10px_24px_-8px_rgba(5,150,105,0.7)] ring-4 ring-bg', active && 'bg-brand-strong')}>
                  <Icon size={26} strokeWidth={2.4} />
                </span>
                <span className="mt-0.5 text-[11px] font-semibold text-fg-muted">Report</span>
              </button>
            );
          }
          return (
            <button key={it.view} onClick={() => go(it.view)} aria-current={active ? 'page' : undefined}
              className={cn('flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold', active ? 'text-brand' : 'text-fg-muted')}>
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  const { user, isAdmin, go } = useApp();
  const name = displayName(user);
  return (
    <header className="sticky top-0 z-30 glass-overlay border-x-0 border-t-0">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button onClick={onMenu} className="lg:hidden grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-surface-muted" aria-label="Open menu"><Menu size={20} /></button>
        <div className="lg:hidden"><Logo /></div>
        <div className="ml-auto flex items-center gap-1">
          <LanguageButton />
          <ThemeToggle />
          <Notifications />
          <button onClick={() => go('profile')} className="ml-2 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 sm:pr-3 hover:bg-surface-muted" aria-label="Open profile">
            <Avatar name={name} size={32} />
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-[13px] font-semibold text-fg max-w-[160px] truncate">{name}</span>
              <span className="block text-[11px] font-medium text-fg-subtle">{isAdmin ? 'Administrator' : `${user?.reputationPoints || 0} pts`}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function CurrentView() {
  const { view, isAdmin } = useApp();
  switch (view) {
    case 'admin-dashboard': return isAdmin ? <AdminDashboard /> : null;
    case 'admin-map': return isAdmin ? <AdminMap /> : null;
    case 'admin-issues': return isAdmin ? <AdminIssueManager /> : null;
    case 'admin-analytics': return isAdmin ? <AdminAnalytics /> : null;
    case 'dashboard': return <Dashboard />;
    case 'report': return <ReportForm />;
    case 'feed': return <CommunityFeed />;
    case 'history': return <MyReports />;
    case 'leaderboard': return <LeaderboardView />;
    case 'wards': return <WardScorecard />;
    case 'profile': return <ProfileView />;
    default: return null;
  }
}

export function AppShell({ openIssueId }: { openIssueId: string | null; fallback?: React.ReactNode }) {
  const { view, isAdmin, openIssue } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [view]);
  const wide = view === 'admin-map' || view === 'admin-issues';

  return (
    <div className="min-h-screen bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] btn-primary">Skip to content</a>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 border-r border-line bg-surface">
        <SideNav />
      </aside>

      {/* Mobile slide-in */}
      <AnimatePresence>
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div className="absolute inset-0 bg-slate-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-72 border-r border-line bg-surface shadow-[var(--shadow-e3)]">
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-surface-muted"><X size={18} /></button>
              <SideNav onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <Header onMenu={() => setMenuOpen(true)} />
        <main id="main" className={cn('mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-12', wide ? 'max-w-[1400px]' : 'max-w-[1200px]')}>
          <ErrorBoundary key={view}>
            <Suspense fallback={<PageSkeleton />}>
              <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
                <CurrentView />
              </motion.div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {!isAdmin && <BottomNav />}

      <Suspense fallback={null}>
        {openIssueId && <IssueDetail issueId={openIssueId} onClose={() => openIssue(null)} />}
      </Suspense>
    </div>
  );
}
