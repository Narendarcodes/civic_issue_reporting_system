import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, safeJson } from './lib/utils';
import { AppCtx, type AppState, type AppView } from './app/AppContext';
import { PageSkeleton } from './features/shell/PageSkeleton';

// Route-level code splitting: each screen (and its heavy deps — Leaflet,
// Recharts) loads on demand instead of shipping in the entry chunk.
const named = <T extends Record<string, any>>(loader: () => Promise<T>, key: keyof T) =>
  lazy(() => loader().then(m => ({ default: m[key] as React.ComponentType<any> })));

const WelcomeScreen = named(() => import('./features/landing/WelcomeScreen'), 'WelcomeScreen');
const AuthScreen = named(() => import('./features/auth/AuthScreen'), 'AuthScreen');
const LocationSetup = named(() => import('./features/auth/LocationSetup'), 'LocationSetup');
const AppShell = named(() => import('./features/shell/AppShell'), 'AppShell');

const CITIZEN_VIEWS: AppView[] = ['dashboard', 'report', 'feed', 'history', 'leaderboard', 'wards', 'profile'];
const ADMIN_VIEWS: AppView[] = ['admin-dashboard', 'admin-map', 'admin-issues', 'admin-analytics', 'wards', 'profile'];

/** `#feed&issue=abc` → { view: 'feed', issue: 'abc' } — lets every screen be deep-linked. */
function readHash(): { view?: string; issue?: string } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return {};
  const [view, ...rest] = raw.split('&');
  const params = new URLSearchParams(rest.join('&'));
  return { view: view || undefined, issue: params.get('issue') || undefined };
}
function writeHash(view: string, issue: string | null) {
  const next = `#${view}${issue ? `&issue=${issue}` : ''}`;
  if (window.location.hash !== next) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
}

const FullPageSpinner = () => (
  <div className="min-h-screen grid place-items-center bg-bg">
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-brand" aria-label="Loading" />
  </div>
);

type Phase = 'booting' | 'welcome' | 'auth' | 'register' | 'location' | 'app';

export default function App({ forcePortal }: { forcePortal?: 'user' | 'admin' } = {}) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('booting');
  const [user, setUser] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('dashboard');
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);
  const userRef = useRef<any>(null);
  userRef.current = user;

  const isAdmin = user?.role === 'admin';

  const refresh = useCallback(async () => {
    if (!userRef.current) return null;
    try {
      const res = await apiFetch('/api/issues');
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || `Could not load issues (${res.status})`);
      if (Array.isArray(data)) setIssues(data);
      setIssuesError(null);
      return data;
    } catch (err: any) {
      setIssuesError(err?.message || 'Network error');
      return null;
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const res = await apiFetch('/api/me');
      if (res.ok) {
        const u = await safeJson(res);
        if (u) setUser(u);
        return u;
      }
    } catch { /* keep current user */ }
    return null;
  }, []);

  // --- Boot: restore session + enforce portal separation
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('civic_token');
      if (!token) return setPhase(forcePortal ? 'auth' : 'welcome');
      try {
        const res = await apiFetch('/api/me');
        const u = res.ok ? await safeJson(res) : null;
        if (!u) throw new Error('session expired');
        if (forcePortal === 'admin' && u.role !== 'admin') {
          localStorage.removeItem('civic_token');
          return setPhase('auth');
        }
        if (forcePortal === 'user' && u.role === 'admin') return navigate('/admin' + window.location.hash);
        if (!forcePortal) return navigate((u.role === 'admin' ? '/admin' : '/user') + window.location.hash);
        setUser(u);
        const allowed = u.role === 'admin' ? ADMIN_VIEWS : CITIZEN_VIEWS;
        const h = readHash();
        setView(h.view && allowed.includes(h.view as AppView) ? (h.view as AppView) : u.role === 'admin' ? 'admin-dashboard' : 'dashboard');
        if (h.issue) setOpenIssueId(h.issue);
        setPhase(u.role !== 'admin' && (u.latitude === undefined || u.latitude === null) ? 'location' : 'app');
      } catch {
        localStorage.removeItem('civic_token');
        setPhase(forcePortal ? 'auth' : 'welcome');
      }
    })();
  }, [forcePortal]);

  // --- Data: initial load, gentle polling, refresh on focus
  useEffect(() => {
    if (!user) return;
    refresh();
    const t = setInterval(refresh, 30_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [user?.id]);

  useEffect(() => {
    if (phase === 'app') writeHash(view, openIssueId);
  }, [phase, view, openIssueId]);

  const go = useCallback((v: AppView) => {
    setView(v);
    setOpenIssueId(null);
    window.scrollTo({ top: 0 });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('civic_token');
    setUser(null);
    setIssues([]);
    window.history.replaceState(null, '', window.location.pathname);
    if (forcePortal) setPhase('auth');
    else { setPhase('welcome'); navigate('/'); }
  }, [forcePortal]);

  const ctx: AppState = useMemo(() => ({
    user, issues, issuesLoading, issuesError, refresh, refreshMe, view, go,
    openIssue: setOpenIssueId, logout, isAdmin,
  }), [user, issues, issuesLoading, issuesError, view, isAdmin]);

  if (phase === 'booting') return <FullPageSpinner />;

  return (
    <Suspense fallback={phase === 'app' ? <FullPageSpinner /> : <FullPageSpinner />}>
      {phase === 'welcome' && <WelcomeScreen />}
      {(phase === 'auth' || phase === 'register') && (
        <AuthScreen
          mode={phase === 'register' ? 'register' : 'login'}
          portal={forcePortal || 'user'}
          onToggleMode={() => setPhase(phase === 'register' ? 'auth' : 'register')}
          onBack={() => navigate('/')}
        />
      )}
      {phase === 'location' && user && (
        <LocationSetup user={user} onComplete={async () => { await refreshMe(); setPhase('app'); }} />
      )}
      {phase === 'app' && user && (
        <AppCtx.Provider value={ctx}>
          <AppShell openIssueId={openIssueId} fallback={<PageSkeleton />} />
        </AppCtx.Provider>
      )}
    </Suspense>
  );
}
