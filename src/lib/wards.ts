import { WARDS, isOpen, isResolved, nearestWard, slaState, stageOf } from './civic';

export interface WardStats {
  ward: string;
  zone: string;
  total: number;
  open: number;
  resolved: number;
  overdue: number;
  resolutionRate: number;      // 0–1
  avgHoursToResolve: number | null;
  withinSlaRate: number | null; // share of resolved fixed inside SLA
  score: number;               // 0–100 composite
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
}

/** Ward / area scorecard computed purely from issue data — no extra API. */
export function computeWardStats(issues: any[]): WardStats[] {
  const by = new Map<string, any[]>();
  for (const i of issues) {
    if (stageOf(i) === 'Rejected') continue;
    const w = i.ward || nearestWard(i.latitude, i.longitude);
    if (!by.has(w)) by.set(w, []);
    by.get(w)!.push(i);
  }
  const out: WardStats[] = [];
  for (const [ward, list] of by) {
    const resolved = list.filter(isResolved);
    const open = list.filter(isOpen);
    const overdue = open.filter(i => slaState(i).overdue);
    const hrs = resolved
      .map(i => (i.resolvedAt ? (new Date(i.resolvedAt).getTime() - new Date(i.timestamp).getTime()) / 3600_000 : null))
      .filter((h): h is number => h !== null && isFinite(h) && h > 0);
    const within = resolved.filter(i => slaState(i).remainingMs >= 0).length;
    const resolutionRate = list.length ? resolved.length / list.length : 0;
    const withinSlaRate = resolved.length ? within / resolved.length : null;
    const overdueShare = list.length ? overdue.length / list.length : 0;
    const score = Math.round(100 * (0.5 * resolutionRate + 0.3 * (withinSlaRate ?? 0.5) + 0.2 * (1 - overdueShare)));
    const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'E';
    out.push({
      ward, zone: WARDS.find(w => w.name === ward)?.zone || '—', total: list.length, open: open.length, resolved: resolved.length,
      overdue: overdue.length, resolutionRate, avgHoursToResolve: hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : null,
      withinSlaRate, score, grade,
    });
  }
  return out.sort((a, b) => b.score - a.score || b.total - a.total);
}

export const fmtHours = (h: number | null) => (h === null ? '—' : h >= 48 ? `${(h / 24).toFixed(1)} d` : `${Math.round(h)} h`);
