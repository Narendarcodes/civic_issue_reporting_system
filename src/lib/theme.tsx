import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
interface ThemeCtx { pref: ThemePref; resolved: 'light' | 'dark'; setPref: (p: ThemePref) => void; toggle: () => void }

const Ctx = createContext<ThemeCtx>({ pref: 'system', resolved: 'light', setPref: () => {}, toggle: () => {} });
const KEY = 'civic_theme';
const systemDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(() => (localStorage.getItem(KEY) as ThemePref) || 'system');
  const [sys, setSys] = useState(systemDark());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSys(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' = pref === 'system' ? (sys ? 'dark' : 'light') : pref;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  const setPref = (p: ThemePref) => {
    localStorage.setItem(KEY, p);
    setPrefState(p);
  };
  const toggle = () => setPref(resolved === 'dark' ? 'light' : 'dark');

  return <Ctx.Provider value={{ pref, resolved, setPref, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
