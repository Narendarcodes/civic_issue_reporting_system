import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Map as MapIcon, History, User, Bell, LogOut, Menu, Trophy, AlertTriangle, Filter, BarChart3 as AnalyticsIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { cn, safeJson, apiFetch } from './lib/utils';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { NavItem } from './components/ui/NavItem';

// Route-level code splitting: each screen (and its heavy deps — Leaflet,
// Recharts) loads on demand instead of shipping in the entry chunk.
const named = <T extends Record<string, any>>(loader: () => Promise<T>, key: keyof T) =>
  lazy(() => loader().then(m => ({ default: m[key] as React.ComponentType<any> })));
const WelcomeScreen = named(() => import('./features/landing/WelcomeScreen'), 'WelcomeScreen');
const AuthScreen = named(() => import('./features/auth/AuthScreen'), 'AuthScreen');
const LocationSetup = named(() => import('./features/auth/LocationSetup'), 'LocationSetup');
const Dashboard = named(() => import('./features/dashboard/Dashboard'), 'Dashboard');
const ReportForm = named(() => import('./features/report/ReportForm'), 'ReportForm');
const CommunityFeed = named(() => import('./features/feed/CommunityFeed'), 'CommunityFeed');
const MyReports = named(() => import('./features/reports/MyReports'), 'MyReports');
const LeaderboardView = named(() => import('./features/leaderboard/LeaderboardView'), 'LeaderboardView');
const ProfileView = named(() => import('./features/profile/ProfileView'), 'ProfileView');
const AdminDashboard = named(() => import('./features/admin/AdminDashboard'), 'AdminDashboard');
const AdminIssueManager = named(() => import('./features/admin/AdminIssueManager'), 'AdminIssueManager');
const AdminAnalytics = named(() => import('./features/admin/AdminAnalytics'), 'AdminAnalytics');

const Spinner = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-civic-primary" />
  </div>
);

export default function App({ forcePortal }: { forcePortal?: 'user' | 'admin' } = {}) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState(forcePortal ? 'auth' : 'welcome');
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchIssues = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/issues');
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) setIssues(data);
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    }
    return null;
  };

  const fetchMe = async () => {
    const token = localStorage.getItem('civic_token');
    if (!token) return;
    try {
      const res = await apiFetch('/api/me');
      if (res.ok) {
        const userData = await safeJson(res);
        if (userData && typeof userData === 'object') {
          setUser(userData);
          return userData;
        }
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('civic_token');
      if (token) {
        try {
          const res = await apiFetch('/api/me');
          if (res.ok) {
            const userData = await safeJson(res);
            if (userData) {
              // Enforce portal separation: redirect wrong role
              if (forcePortal === 'admin' && userData.role !== 'admin') {
                localStorage.removeItem('civic_token');
                setView('auth');
                setLoading(false);
                return;
              }
              if (forcePortal === 'user' && userData.role === 'admin') {
                navigate('/admin');
                return;
              }
              setUser(userData);
              if (userData.role !== 'admin' && !userData.latitude && view !== 'location-setup') {
                setView('location-setup');
              } else {
                setView(userData.role === 'admin' ? 'admin-dashboard' : 'dashboard');
              }
            } else {
              localStorage.removeItem('civic_token');
              setView(forcePortal ? 'auth' : 'welcome');
            }
          } else {
            localStorage.removeItem('civic_token');
            setView(forcePortal ? 'auth' : 'welcome');
          }
        } catch (err) {
          console.error("Auth initialization error:", err);
          localStorage.removeItem('civic_token');
          setView(forcePortal ? 'auth' : 'welcome');
        }
      } else {
        setView(forcePortal ? 'auth' : 'welcome');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchIssues();
      const interval = setInterval(fetchIssues, 30000); // Poll for updates
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('civic_token');
    setUser(null);
    if (forcePortal) {
      setView('auth');
    } else {
      setView('welcome');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-civic-primary"></div>
      </div>
    );
  }

  if (view === 'welcome') {
    return <Suspense fallback={<Spinner />}><WelcomeScreen onLogin={() => setView('login')} onRegister={() => setView('register')} /></Suspense>;
  }

  // Standalone auth view for /user and /admin portals
  if (!user && view === 'auth') {
    const isAdminPortal = forcePortal === 'admin';
    return (
      <Suspense fallback={<Spinner />}>
      <AuthScreen
        isLoginView={true} 
        toggleView={() => setView('register')}
        onBack={() => navigate('/')}
        forcedPortal={forcePortal}
      /></Suspense>
    );
  }

  if (!user && view === 'register') {
    return (
      <Suspense fallback={<Spinner />}>
      <AuthScreen 
        isLoginView={false} 
        toggleView={() => setView('auth')}
        onBack={() => setView('welcome')}
      /></Suspense>
    );
  }

  if (!user && (view === 'login' || view === 'register')) {
    return (
      <Suspense fallback={<Spinner />}>
      <AuthScreen 
        isLoginView={view === 'login'} 
        toggleView={() => setView(view === 'login' ? 'register' : 'login')}
        onBack={() => setView('welcome')}
      /></Suspense>
    );
  }

  if (view === 'location-setup') {
    return <Suspense fallback={<Spinner />}><LocationSetup onComplete={() => setView('dashboard')} /></Suspense>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar / Mobile Nav */}
      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-civic-primary rounded-xl flex items-center justify-center text-white">
              <MapIcon size={24} />
            </div>
            <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">CivicConnect</h1>
          </div>

          <div className="flex-1 space-y-2">
            {user?.role === 'admin' ? (
              <>
                <NavItem active={view === 'admin-dashboard'} icon={<LayoutDashboard size={20} />} label="Admin Console" onClick={() => { setView('admin-dashboard'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'admin-issues'} icon={<Filter size={20} />} label="Manage Issues" onClick={() => { setView('admin-issues'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'admin-analytics'} icon={<AnalyticsIcon size={20} />} label="Analytics" onClick={() => { setView('admin-analytics'); setIsMenuOpen(false); }} />
              </>
            ) : (
              <>
                <NavItem active={view === 'dashboard'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => { setView('dashboard'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'report'} icon={<PlusCircle size={20} />} label="Report Issue" onClick={() => { setView('report'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'feed'} icon={<MapIcon size={20} />} label="Community Feed" onClick={() => { setView('feed'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'history'} icon={<History size={20} />} label="My Reports" onClick={() => { setView('history'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'leaderboard'} icon={<Trophy size={20} />} label="Leaderboard" onClick={() => { setView('leaderboard'); setIsMenuOpen(false); }} />
              </>
            )}
            <NavItem active={view === 'profile'} icon={<User size={20} />} label="Profile" onClick={() => { setView('profile'); setIsMenuOpen(false); }} />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-semibold text-sm"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <a href="/api/public/data" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer text-slate-500 hover:bg-slate-50 font-semibold text-sm">
              <AnalyticsIcon size={20} /> Open Data API
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between relative">
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 text-slate-400 hover:text-civic-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.username || 'User'}</p>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", user?.role === 'admin' ? "text-red-500" : "text-slate-500")}>
                  {user?.role === 'admin' ? 'Administrator' : 'Citizen'}
                </p>
              </div>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold", user?.role === 'admin' ? "bg-red-500" : "bg-slate-100 text-slate-600")}>
                {user?.username?.[0] || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto">
          <Suspense fallback={<Spinner />}>
          <AnimatePresence mode="wait">
            {(() => {
              try {
                if (view === 'admin-dashboard') return <AdminDashboard key="admin-dashboard" issues={issues || []} setView={setView} user={user} />;
                if (view === 'admin-issues') return <AdminIssueManager key="admin-issues" issues={issues || []} user={user} onRefresh={fetchIssues} />;
                if (view === 'admin-analytics') return <AdminAnalytics key="admin-analytics" issues={issues || []} />;
                
                if (view === 'dashboard') return <Dashboard key="dashboard" issues={issues || []} setView={setView} user={user} onRefresh={fetchIssues} />;
                if (view === 'feed') return <CommunityFeed key="feed" issues={issues || []} user={user} onRefresh={fetchIssues} />;
                if (view === 'report') return (
                  <ReportForm 
                    key="report" 
                    user={user} 
                    onSuccess={async () => {
                      await fetchIssues();
                      await fetchMe(); 
                      setView('history');
                    }} 
                  />
                );
                if (view === 'history') return <MyReports key="history" issues={(issues || []).filter(i => i && i.userId === user?.id)} user={user} onRefresh={fetchIssues} />;
                if (view === 'leaderboard') return <LeaderboardView key="leaderboard" />;
                if (view === 'profile') return <ProfileView key="profile" user={user} />;
              } catch (e) {
                console.error("View render crash:", e);
                return (
                  <Card key="error" className="p-12 text-center border-red-100 bg-red-50/30">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h3>
                    <p className="text-slate-500 mb-6">A component in this view failed to load safely.</p>
                    <Button onClick={() => window.location.reload()}>Try Refreshing</Button>
                  </Card>
                );
              }
            })()}
          </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsMenuOpen(false)} />
      )}
    </div>
  );
}
