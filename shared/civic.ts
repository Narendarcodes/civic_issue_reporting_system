/**
 * Shared civic domain vocabulary — used by both the Express API (server.ts)
 * and the React client so status names, SLA targets and wards never drift.
 */

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const CATEGORIES = [
  'Potholes',
  'Garbage Overflow',
  'Road Damage',
  'Broken Streetlight',
  'Water Leakage',
  'Drainage Problem',
  'Public Facility Damage',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Service-level targets (hours from report to resolution) per category.
 * Configurable: change a number here and both the public countdown and the
 * admin "Overdue" wall follow.
 */
export const SLA_HOURS: Record<string, number> = {
  Potholes: 72,
  'Garbage Overflow': 24,
  'Road Damage': 120,
  'Broken Streetlight': 48,
  'Water Leakage': 24,
  'Drainage Problem': 48,
  'Public Facility Damage': 96,
  Other: 120,
};
export const DEFAULT_SLA_HOURS = 96;
/** Emergency-priority issues get a tighter clock. */
export const EMERGENCY_SLA_FACTOR = 0.5;

export function slaHoursFor(category?: string, priority?: string): number {
  const base = (category && SLA_HOURS[category]) || DEFAULT_SLA_HOURS;
  return priority === 'Emergency' ? Math.round(base * EMERGENCY_SLA_FACTOR) : base;
}

// ---------------------------------------------------------------------------
// Status vocabulary
// ---------------------------------------------------------------------------
/**
 * Raw status strings stored in MongoDB (kept for backward compatibility with
 * existing data). Every raw value maps onto exactly one public stage below.
 */
export const RAW_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  AWAITING_CONFIRMATION: 'Pending Citizen Confirmation',
  CONFIRMED: 'Confirmed Resolved',
  CLOSED: 'Closed',
} as const;

/** The one public vocabulary shown everywhere in the UI. */
export type Stage = 'Reported' | 'Verified' | 'Assigned' | 'In progress' | 'Resolved' | 'Rejected';
export const STAGES: Stage[] = ['Reported', 'Verified', 'Assigned', 'In progress', 'Resolved', 'Rejected'];
/** The happy-path order used for timelines and progress bars. */
export const STAGE_FLOW: Stage[] = ['Reported', 'Verified', 'Assigned', 'In progress', 'Resolved'];

export function stageOf(issue: { status?: string; isFake?: number | boolean } | null | undefined): Stage {
  if (!issue) return 'Reported';
  if (issue.isFake && Number(issue.isFake) >= 1) return 'Rejected';
  switch (issue.status) {
    case 'Verified':
      return 'Verified';
    case 'Assigned':
      return 'Assigned';
    case 'In Progress':
    case 'In-Progress':
    case 'Work In Progress':
    case 'Reopened':
      return 'In progress';
    case 'Resolved':
    case 'Issue Resolved':
    case 'Pending Citizen Confirmation':
    case 'Confirmed Resolved':
      return 'Resolved';
    case 'Closed':
    case 'Rejected':
      return 'Rejected';
    default:
      return 'Reported';
  }
}

export const isOpen = (issue: any) => {
  const s = stageOf(issue);
  return s !== 'Resolved' && s !== 'Rejected';
};
export const isResolved = (issue: any) => stageOf(issue) === 'Resolved';
export const isAwaitingConfirmation = (issue: any) => issue?.status === RAW_STATUS.AWAITING_CONFIRMATION;

// ---------------------------------------------------------------------------
// SLA maths
// ---------------------------------------------------------------------------
export interface SlaState {
  hours: number;
  dueAt: number; // epoch ms
  /** ms remaining (negative when overdue). For closed issues: ms it beat/missed SLA by. */
  remainingMs: number;
  overdue: boolean;
  closed: boolean;
  /** 0–1 share of the SLA window already consumed (clamped). */
  consumed: number;
}

export function slaState(issue: any, now: number = Date.now()): SlaState {
  const hours = slaHoursFor(issue?.category, issue?.priority);
  const start = new Date(issue?.timestamp || now).getTime();
  const dueAt = start + hours * 3600_000;
  const closed = !isOpen(issue);
  const endRef = closed && issue?.resolvedAt ? new Date(issue.resolvedAt).getTime() : now;
  const remainingMs = dueAt - endRef;
  const consumed = Math.min(1, Math.max(0, (endRef - start) / (hours * 3600_000)));
  return { hours, dueAt, remainingMs, overdue: !closed && remainingMs < 0, closed, consumed };
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600_000);
  const m = Math.floor((abs % 3600_000) / 60_000);
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------------------------------------------------------------------------
// Geography — GHMC areas used for the ward scorecard
// ---------------------------------------------------------------------------
export interface Ward {
  name: string;
  zone: string;
  lat: number;
  lng: number;
}
export const WARDS: Ward[] = [
  { name: 'Banjara Hills', zone: 'Khairatabad', lat: 17.4126, lng: 78.4392 },
  { name: 'Jubilee Hills', zone: 'Khairatabad', lat: 17.4319, lng: 78.4071 },
  { name: 'Ameerpet', zone: 'Khairatabad', lat: 17.4375, lng: 78.4483 },
  { name: 'Madhapur', zone: 'Serilingampally', lat: 17.4483, lng: 78.3915 },
  { name: 'Gachibowli', zone: 'Serilingampally', lat: 17.4401, lng: 78.3489 },
  { name: 'Kondapur', zone: 'Serilingampally', lat: 17.4598, lng: 78.3636 },
  { name: 'Kukatpally', zone: 'Kukatpally', lat: 17.4849, lng: 78.4138 },
  { name: 'Secunderabad', zone: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { name: 'Begumpet', zone: 'Secunderabad', lat: 17.4447, lng: 78.4664 },
  { name: 'Himayatnagar', zone: 'Khairatabad', lat: 17.4012, lng: 78.4866 },
  { name: 'Charminar', zone: 'Charminar', lat: 17.3616, lng: 78.4747 },
  { name: 'Dilsukhnagar', zone: 'LB Nagar', lat: 17.3688, lng: 78.5247 },
];

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Nearest known ward to a point (used when a report has no explicit ward). */
export function nearestWard(lat?: number, lng?: number): string {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return 'Unmapped';
  let best = WARDS[0];
  let bestD = Infinity;
  for (const w of WARDS) {
    const d = distanceMeters(lat, lng, w.lat, w.lng);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return bestD < 6000 ? best.name : 'Unmapped';
}

/** Radius used for "is this already reported?" duplicate detection. */
export const DUPLICATE_RADIUS_M = 100;
/** Community upvotes that auto-promote a fresh report to "Verified". */
export const VERIFY_UPVOTE_THRESHOLD = 3;
