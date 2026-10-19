/**
 * UI-side civic vocabulary: colours + icons for categories and stages.
 * Domain rules (SLA hours, stage mapping, wards) live in shared/civic.ts.
 */
import {
  CircleDot, Trash2, Construction, Lightbulb, Droplets, Waves, Landmark, CircleHelp,
  Inbox, ShieldCheck, UserCheck, Hammer, CheckCircle2, XCircle, type LucideIcon,
} from 'lucide-react';
import type { Stage } from '../../shared/civic';

export * from '../../shared/civic';

export const APP_NAME = 'Civi-Snap';
export const APP_TAGLINE = 'Report it. Track it. Get it fixed.';

export interface CategoryMeta { color: string; soft: string; icon: LucideIcon; svg: string; short: string }
export const CATEGORY_META: Record<string, CategoryMeta> = {
  Potholes: { color: '#ea580c', soft: 'rgba(234,88,12,0.12)', icon: CircleDot, short: 'Pothole', svg: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/>" },
  'Garbage Overflow': { color: '#65a30d', soft: 'rgba(101,163,13,0.12)', icon: Trash2, short: 'Garbage', svg: "<path d=\"M10 11v6\"/><path d=\"M14 11v6\"/><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"/><path d=\"M3 6h18\"/><path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>" },
  'Road Damage': { color: '#a16207', soft: 'rgba(161,98,7,0.12)', icon: Construction, short: 'Road', svg: "<rect x=\"2\" y=\"6\" width=\"20\" height=\"8\" rx=\"1\"/><path d=\"M17 14v7\"/><path d=\"M7 14v7\"/><path d=\"M17 3v3\"/><path d=\"M7 3v3\"/><path d=\"M10 14 2.3 6.3\"/><path d=\"m14 6 7.7 7.7\"/><path d=\"m8 6 8 8\"/>" },
  'Broken Streetlight': { color: '#ca8a04', soft: 'rgba(202,138,4,0.14)', icon: Lightbulb, short: 'Streetlight', svg: "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\"/><path d=\"M9 18h6\"/><path d=\"M10 22h4\"/>" },
  'Water Leakage': { color: '#0284c7', soft: 'rgba(2,132,199,0.12)', icon: Droplets, short: 'Water', svg: "<path d=\"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z\"/><path d=\"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97\"/>" },
  'Drainage Problem': { color: '#7c3aed', soft: 'rgba(124,58,237,0.12)', icon: Waves, short: 'Drainage', svg: "<path d=\"M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\"/><path d=\"M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\"/><path d=\"M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\"/>" },
  'Public Facility Damage': { color: '#db2777', soft: 'rgba(219,39,119,0.12)', icon: Landmark, short: 'Facility', svg: "<path d=\"M10 18v-7\"/><path d=\"M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z\"/><path d=\"M14 18v-7\"/><path d=\"M18 18v-7\"/><path d=\"M3 22h18\"/><path d=\"M6 18v-7\"/>" },
  Other: { color: '#64748b', soft: 'rgba(100,116,139,0.14)', icon: CircleHelp, short: 'Other', svg: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\"/><path d=\"M12 17h.01\"/>" },
};
export const categoryMeta = (c?: string): CategoryMeta => CATEGORY_META[c || 'Other'] || CATEGORY_META.Other;

export interface StageMeta { icon: LucideIcon; chip: string; dot: string; description: string }
/** One status-chip vocabulary used on every screen. */
export const STAGE_META: Record<Stage, StageMeta> = {
  Reported: { icon: Inbox, chip: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20', dot: '#64748b', description: 'Received and visible to the community' },
  Verified: { icon: ShieldCheck, chip: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25', dot: '#7c3aed', description: 'Confirmed by neighbours or an officer' },
  Assigned: { icon: UserCheck, chip: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25', dot: '#d97706', description: 'A field crew owns the fix' },
  'In progress': { icon: Hammer, chip: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25', dot: '#0284c7', description: 'Crew is working on site' },
  Resolved: { icon: CheckCircle2, chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25', dot: '#059669', description: 'Fixed — with photo proof' },
  Rejected: { icon: XCircle, chip: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25', dot: '#e11d48', description: 'Closed as invalid or duplicate' },
};

/** Recharts palette — fixed order so charts agree with each other. */
export const CHART = {
  brand: '#059669',
  accent: '#0d9488',
  sky: '#0284c7',
  amber: '#d97706',
  rose: '#e11d48',
  violet: '#7c3aed',
  slate: '#94a3b8',
};

export const displayName = (u: any): string =>
  (u?.fullName && String(u.fullName).trim()) || (u?.username && !/^citizen_/.test(u.username) ? u.username : '') || (u?.email ? String(u.email).split('@')[0] : 'Citizen');

export const initials = (name?: string) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || '?';

export const shortAddress = (addr?: string) => (addr || 'Location not set').split(',').slice(0, 2).join(',').trim();
