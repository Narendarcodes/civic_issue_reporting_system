import { createContext, useContext } from 'react';

export type CitizenView = 'dashboard' | 'report' | 'feed' | 'history' | 'leaderboard' | 'wards' | 'profile';
export type AdminView = 'admin-dashboard' | 'admin-map' | 'admin-issues' | 'admin-analytics' | 'wards' | 'profile';
export type AppView = CitizenView | AdminView;

export interface AppState {
  user: any;
  issues: any[];
  issuesLoading: boolean;
  issuesError: string | null;
  refresh: () => Promise<any>;
  refreshMe: () => Promise<any>;
  view: AppView;
  go: (v: AppView) => void;
  openIssue: (id: string | null) => void;
  logout: () => void;
  isAdmin: boolean;
}

export const AppCtx = createContext<AppState | null>(null);
export function useApp(): AppState {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
