/**
 * Demo dataset for Civi-Snap — realistic Hyderabad reports for demos & screenshots.
 *
 *   npx tsx scripts/seed-demo.ts            # wipes demo collections and reseeds
 *
 * Uses the real Mongoose models (backend/models) and the shared SLA/ward rules
 * (shared/civic.ts), so timelines, SLA countdowns, overdue walls and ward
 * scorecards all come out consistent. Timestamps are relative to "now" so the
 * data always looks fresh.
 *
 * Demo logins (local only — change before any real deployment):
 *   Citizen: priya@demo.civisnap.in   (email OTP; in dev without SMTP the code is shown on screen)
 *   Admin:   username ghmc.admin / password CiviSnap@2026
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../backend/models/User.js';
import { Issue } from '../backend/models/Issue.js';
import { WorkerTeam } from '../backend/models/WorkerTeam.js';
import { Notification } from '../backend/models/Notification.js';
import { SystemConfig } from '../backend/models/SystemConfig.js';
import { CATEGORIES, WARDS, slaHoursFor } from '../shared/civic.js';

dotenv.config();
const URI = process.env.LOCAL_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civic_issue';

const HOUR = 3600_000;
const NOW = Date.now();
const iso = (hoursAgo: number) => new Date(NOW - hoursAgo * HOUR).toISOString();

// ------------------------------------------------------------------ people
const DEMO_CITIZEN = { id: 'demo-priya', fullName: 'Priya Reddy', email: 'priya@demo.civisnap.in', city: 'Hyderabad', postalCode: '500034', address: 'Road No. 12, Banjara Hills', lat: 17.41205, lng: 78.43795 };
const NEIGHBOURS = [
  ['u-arjun', 'Arjun Rao', 'arjun.rao@demo.civisnap.in', 1340, 14],
  ['u-fatima', 'Fatima Begum', 'fatima.b@demo.civisnap.in', 1185, 12],
  ['u-karthik', 'Karthik Varma', 'karthik.v@demo.civisnap.in', 960, 10],
  ['u-sneha', 'Sneha Kulkarni', 'sneha.k@demo.civisnap.in', 845, 9],
  ['u-ravi', 'Ravi Teja', 'ravi.teja@demo.civisnap.in', 720, 8],
  ['u-ananya', 'Ananya Iyer', 'ananya.i@demo.civisnap.in', 610, 6],
  ['u-mohammed', 'Mohammed Imran', 'imran.m@demo.civisnap.in', 540, 6],
  ['u-lakshmi', 'Lakshmi Devi', 'lakshmi.d@demo.civisnap.in', 415, 4],
  ['u-vikram', 'Vikram Goud', 'vikram.g@demo.civisnap.in', 330, 3],
  ['u-deepa', 'Deepa Nair', 'deepa.n@demo.civisnap.in', 210, 2],
] as const;
const nameOf = (id: string) => (id === DEMO_CITIZEN.id ? DEMO_CITIZEN.fullName : NEIGHBOURS.find(n => n[0] === id)?.[1] || 'Citizen');

const TEAMS = [
  { id: 'team-001', name: 'Sanitation Crew — Circle 18', members: ['S. Yadav', 'K. Bai', 'R. Pasha'] },
  { id: 'team-002', name: 'Roads & Potholes — Zone West', members: ['M. Reddy', 'P. Naik'] },
  { id: 'team-003', name: 'Water & Drainage (HMWSSB)', members: ['A. Khan', 'V. Rao', 'T. Das'] },
  { id: 'team-004', name: 'Streetlights — Electrical Wing', members: ['N. Chary', 'B. Singh'] },
  { id: 'team-005', name: 'Parks & Public Facilities', members: ['G. Prasad'] },
];
const teamFor = (cat: string) =>
  /Garbage/.test(cat) ? 'team-001' : /Pothole|Road/.test(cat) ? 'team-002' : /Water|Drainage/.test(cat) ? 'team-003' : /Streetlight/.test(cat) ? 'team-004' : 'team-005';

// ------------------------------------------------------------------ photos
const BEFORE: Record<string, string> = {
  Potholes: '/demo/pothole-before.jpg', 'Garbage Overflow': '/demo/garbage-before.jpg', 'Road Damage': '/demo/roaddamage-before.jpg',
  'Broken Streetlight': '/demo/streetlight-before.jpg', 'Water Leakage': '/demo/water-before.jpg', 'Drainage Problem': '/demo/drainage-before.jpg',
  'Public Facility Damage': '/demo/facility-before.jpg', Other: '/demo/roaddamage-before.jpg',
};
const AFTER: Record<string, string | undefined> = {
  Potholes: '/demo/pothole-after.jpg', 'Garbage Overflow': '/demo/garbage-after.jpg', 'Road Damage': '/demo/pothole-after.jpg',
  'Broken Streetlight': '/demo/streetlight-after.jpg', 'Water Leakage': '/demo/water-after.jpg', 'Drainage Problem': '/demo/drainage-after.jpg',
};

// ------------------------------------------------------------------ issues
type Stage = 'reported' | 'verified' | 'assigned' | 'progress' | 'awaiting' | 'confirmed' | 'rejected';
interface Row {
  id: string; cat: (typeof CATEGORIES)[number]; ward: string; dLat: number; dLng: number; addr: string; desc: string;
  stage: Stage; age: number; fixAfter?: number; up: number; by: string; prio?: 'Normal' | 'High' | 'Emergency';
}

// dLat/dLng are small offsets (degrees) from the ward centre — keeps pins on real streets nearby.
const ROWS: Row[] = [
  // --- Banjara Hills (Priya's area)
  { id: 'CS-2041', cat: 'Potholes', ward: 'Banjara Hills', dLat: -0.00026, dLng: -0.00135, addr: 'Road No. 12, near Banjara Hills Metro pillar 1102', desc: 'Deep pothole in the left lane outside the metro pillar. Two-wheelers are swerving into traffic to avoid it, worse after last night’s rain.', stage: 'assigned', age: 30, up: 9, by: 'u-arjun', prio: 'High' },
  { id: 'CS-2038', cat: 'Garbage Overflow', ward: 'Banjara Hills', dLat: 0.0021, dLng: 0.0012, addr: 'Road No. 10, opposite GVK One back gate', desc: 'Community bin overflowing for three days, bags spilling onto the footpath. Stray dogs tearing them open at night.', stage: 'awaiting', age: 52, fixAfter: 20, up: 12, by: DEMO_CITIZEN.id },
  { id: 'CS-2035', cat: 'Broken Streetlight', ward: 'Banjara Hills', dLat: -0.0031, dLng: 0.0024, addr: 'Road No. 2, near Lotus Pond lane', desc: 'Streetlight dead for a week on a dark stretch near the pond. Women walking back from the bus stop avoid this road.', stage: 'progress', age: 70, up: 7, by: DEMO_CITIZEN.id },
  { id: 'CS-2029', cat: 'Water Leakage', ward: 'Banjara Hills', dLat: 0.0042, dLng: -0.0031, addr: 'Road No. 14, outside Care Hospital outpatient block', desc: 'Burst pipeline flooding the footpath, clean water running into the drain since morning.', stage: 'confirmed', age: 260, fixAfter: 16, up: 15, by: DEMO_CITIZEN.id, prio: 'High' },
  { id: 'CS-2047', cat: 'Drainage Problem', ward: 'Banjara Hills', dLat: 0.0015, dLng: -0.0042, addr: 'Road No. 11, MLA Colony junction', desc: 'Storm drain choked with plastic and silt, water stagnating and mosquitoes breeding.', stage: 'reported', age: 5, up: 1, by: DEMO_CITIZEN.id },
  { id: 'CS-2026', cat: 'Road Damage', ward: 'Banjara Hills', dLat: -0.0048, dLng: -0.0021, addr: 'Road No. 1, approach to Panjagutta flyover', desc: 'Road surface cracked and crumbling across both lanes after the cable-laying work. Buses are slowing to a crawl.', stage: 'assigned', age: 90, up: 18, by: 'u-fatima' },
  { id: 'CS-2044', cat: 'Public Facility Damage', ward: 'Banjara Hills', dLat: 0.0036, dLng: 0.0040, addr: 'Bus shelter, Road No. 3 near City Center Mall', desc: 'Bench in the bus shelter is broken — slats missing and the frame is bent. Elderly commuters have nowhere to sit.', stage: 'verified', age: 40, up: 5, by: DEMO_CITIZEN.id },

  // --- Jubilee Hills
  { id: 'CS-2012', cat: 'Potholes', ward: 'Jubilee Hills', dLat: 0.0012, dLng: 0.0018, addr: 'Road No. 36, near Jubilee Hills Check Post', desc: 'Cluster of potholes at the signal, cars braking suddenly. Accident risk at night.', stage: 'confirmed', age: 410, fixAfter: 41, up: 22, by: 'u-karthik', prio: 'High' },
  { id: 'CS-2033', cat: 'Garbage Overflow', ward: 'Jubilee Hills', dLat: -0.0022, dLng: 0.0031, addr: 'Film Nagar main road, near the temple arch', desc: 'Garbage dumped on the roadside after the weekend market, not cleared.', stage: 'progress', age: 14, up: 6, by: 'u-sneha' },
  { id: 'CS-2019', cat: 'Broken Streetlight', ward: 'Jubilee Hills', dLat: 0.0031, dLng: -0.0024, addr: 'Road No. 45, near KBR Park gate 3', desc: 'Three consecutive lights out along the walking track side of the road.', stage: 'awaiting', age: 120, fixAfter: 40, up: 9, by: 'u-ananya' },

  // --- Ameerpet
  { id: 'CS-2031', cat: 'Drainage Problem', ward: 'Ameerpet', dLat: 0.0009, dLng: -0.0011, addr: 'Ameerpet X Roads, below metro station stairs', desc: 'Open drain overflowing onto the road below the metro stairs every time it rains. Commuters wading through sewage.', stage: 'assigned', age: 96, up: 27, by: 'u-mohammed', prio: 'High' },
  { id: 'CS-2008', cat: 'Garbage Overflow', ward: 'Ameerpet', dLat: -0.0018, dLng: 0.0021, addr: 'Satyam Theatre lane, Ameerpet', desc: 'Commercial waste from coaching centres piling up in the lane.', stage: 'confirmed', age: 520, fixAfter: 19, up: 11, by: 'u-ravi' },
  { id: 'CS-2046', cat: 'Water Leakage', ward: 'Ameerpet', dLat: 0.0027, dLng: 0.0015, addr: 'SR Nagar main road, near Umesh Chandra statue', desc: 'Leaking valve chamber, water bubbling up through the road surface.', stage: 'reported', age: 9, up: 2, by: 'u-lakshmi' },

  // --- Madhapur
  { id: 'CS-2015', cat: 'Potholes', ward: 'Madhapur', dLat: 0.0021, dLng: 0.0026, addr: 'Hitech City Road, near Cyber Towers signal', desc: 'Large water-filled pothole right at the signal; cabs and autos queueing around it during office hours.', stage: 'confirmed', age: 330, fixAfter: 41, up: 31, by: 'u-arjun', prio: 'High' },
  { id: 'CS-2036', cat: 'Road Damage', ward: 'Madhapur', dLat: -0.0016, dLng: -0.0021, addr: 'Ayyappa Society main road', desc: 'Road dug up for a cable and left unrestored for two weeks.', stage: 'progress', age: 100, up: 14, by: 'u-karthik' },
  { id: 'CS-2042', cat: 'Broken Streetlight', ward: 'Madhapur', dLat: 0.0032, dLng: -0.0012, addr: 'Madhapur Police Station road', desc: 'Streetlight flickering and now completely off near the police station.', stage: 'verified', age: 26, up: 4, by: 'u-deepa' },
  { id: 'CS-2023', cat: 'Garbage Overflow', ward: 'Madhapur', dLat: -0.0029, dLng: 0.0034, addr: 'Image Gardens road, near food stalls', desc: 'Food-stall waste dumped beside the lake fencing, strong smell in the evening.', stage: 'confirmed', age: 290, fixAfter: 22, up: 8, by: 'u-sneha' },

  // --- Gachibowli
  { id: 'CS-2004', cat: 'Drainage Problem', ward: 'Gachibowli', dLat: 0.0018, dLng: 0.0025, addr: 'Gachibowli Flyover service road, towards DLF', desc: 'Roadside drain fully blocked; service road floods within ten minutes of rain.', stage: 'confirmed', age: 620, fixAfter: 57, up: 19, by: 'u-fatima' },
  { id: 'CS-2039', cat: 'Potholes', ward: 'Gachibowli', dLat: -0.0021, dLng: -0.0016, addr: 'Indira Nagar road, near Gachibowli Stadium', desc: 'Pothole cluster near the stadium entrance, getting bigger every week.', stage: 'assigned', age: 50, up: 10, by: 'u-vikram' },
  { id: 'CS-2048', cat: 'Road Damage', ward: 'Gachibowli', dLat: 0.0031, dLng: -0.0029, addr: 'Telecom Nagar, lane 4', desc: 'Tarmac broken up after the storm, half of the lane is rubble and bikes are skidding.', stage: 'reported', age: 3, up: 3, by: 'u-ananya', prio: 'High' },

  // --- Kondapur
  { id: 'CS-2027', cat: 'Water Leakage', ward: 'Kondapur', dLat: 0.0014, dLng: 0.0019, addr: 'Botanical Garden road, near Kothaguda junction', desc: 'Main line leak — a stream of water across the road for two days.', stage: 'progress', age: 15, up: 16, by: 'u-ravi', prio: 'High' },
  { id: 'CS-2010', cat: 'Garbage Overflow', ward: 'Kondapur', dLat: -0.0022, dLng: -0.0017, addr: 'Raghavendra Colony, opposite the park', desc: 'Overflowing bins next to the children’s park.', stage: 'confirmed', age: 480, fixAfter: 17, up: 7, by: 'u-lakshmi' },

  // --- Kukatpally
  { id: 'CS-2017', cat: 'Garbage Overflow', ward: 'Kukatpally', dLat: 0.0012, dLng: -0.0015, addr: 'KPHB Colony Phase 3, near Rythu Bazaar', desc: 'Vegetable market waste piled outside the Rythu Bazaar for days.', stage: 'confirmed', age: 360, fixAfter: 19, up: 13, by: 'u-mohammed' },
  { id: 'CS-2021', cat: 'Potholes', ward: 'Kukatpally', dLat: -0.0019, dLng: 0.0023, addr: 'JNTU road, near Kukatpally bus depot', desc: 'Deep pothole near the depot exit, buses scraping their undercarriage.', stage: 'assigned', age: 160, up: 21, by: 'u-karthik', prio: 'High' },
  { id: 'CS-2032', cat: 'Drainage Problem', ward: 'Kukatpally', dLat: 0.0027, dLng: 0.0018, addr: 'Vivekananda Nagar, Road No. 2', desc: 'Manhole cover broken and drain overflowing onto the street.', stage: 'verified', age: 60, up: 8, by: 'u-deepa', prio: 'Emergency' },
  { id: 'CS-2043', cat: 'Broken Streetlight', ward: 'Kukatpally', dLat: -0.0031, dLng: -0.0026, addr: 'Allwyn Colony, main road', desc: 'Entire stretch dark after a transformer issue, chain snatching reported last week.', stage: 'progress', age: 22, up: 11, by: 'u-vikram', prio: 'High' },

  // --- Secunderabad
  { id: 'CS-2006', cat: 'Road Damage', ward: 'Secunderabad', dLat: 0.0011, dLng: 0.0016, addr: 'SD Road, near Paradise Circle', desc: 'Uneven patchwork and exposed gravel causing two-wheeler skids at the circle.', stage: 'confirmed', age: 700, fixAfter: 98, up: 17, by: 'u-arjun' },
  { id: 'CS-2030', cat: 'Garbage Overflow', ward: 'Secunderabad', dLat: -0.0016, dLng: -0.0013, addr: 'Secunderabad station, Platform 10 exit road', desc: 'Garbage heap by the auto stand outside the station exit.', stage: 'assigned', age: 58, up: 15, by: 'u-fatima' },
  { id: 'CS-2045', cat: 'Public Facility Damage', ward: 'Secunderabad', dLat: 0.0024, dLng: -0.0022, addr: 'Clock Tower park, Secunderabad', desc: 'Broken benches and a damaged railing in the Clock Tower park.', stage: 'reported', age: 14, up: 2, by: 'u-sneha' },

  // --- Begumpet
  { id: 'CS-2014', cat: 'Water Leakage', ward: 'Begumpet', dLat: 0.0013, dLng: 0.0012, addr: 'Prakash Nagar, near Begumpet metro', desc: 'Pipe burst under the footpath, water seeping through cracks.', stage: 'confirmed', age: 390, fixAfter: 29, up: 9, by: 'u-ravi' },
  { id: 'CS-2034', cat: 'Potholes', ward: 'Begumpet', dLat: -0.0018, dLng: 0.0021, addr: 'Begumpet flyover down-ramp', desc: 'Pothole right where the flyover ends, dangerous at speed.', stage: 'progress', age: 56, up: 19, by: 'u-mohammed', prio: 'High' },

  // --- Himayatnagar
  { id: 'CS-2025', cat: 'Drainage Problem', ward: 'Himayatnagar', dLat: 0.0012, dLng: -0.0012, addr: 'Himayatnagar main road, near Minerva', desc: 'Drain blocked near the shopping street, water logging outside shops.', stage: 'awaiting', age: 76, fixAfter: 44, up: 6, by: 'u-lakshmi' },
  { id: 'CS-2018', cat: 'Broken Streetlight', ward: 'Himayatnagar', dLat: -0.0016, dLng: 0.0015, addr: 'Liberty X Roads, towards Tank Bund', desc: 'Two poles without lights near the junction.', stage: 'confirmed', age: 450, fixAfter: 61, up: 5, by: 'u-deepa' },

  // --- Charminar
  { id: 'CS-2002', cat: 'Garbage Overflow', ward: 'Charminar', dLat: 0.0009, dLng: 0.0013, addr: 'Laad Bazaar lane, near Charminar', desc: 'Waste piling up in the bangle market lane, tourists walking around it.', stage: 'confirmed', age: 840, fixAfter: 31, up: 24, by: 'u-mohammed' },
  { id: 'CS-2024', cat: 'Road Damage', ward: 'Charminar', dLat: -0.0014, dLng: -0.0011, addr: 'Pathergatti road', desc: 'Heritage-zone road surface broken after pipeline work.', stage: 'assigned', age: 210, up: 12, by: 'u-fatima' },
  { id: 'CS-2040', cat: 'Drainage Problem', ward: 'Charminar', dLat: 0.0021, dLng: -0.0019, addr: 'Gulzar Houz, east side', desc: 'Sewage overflowing from an old drain near the fountain.', stage: 'progress', age: 30, up: 14, by: 'u-vikram', prio: 'High' },

  // --- Dilsukhnagar
  { id: 'CS-2011', cat: 'Potholes', ward: 'Dilsukhnagar', dLat: 0.0012, dLng: 0.0011, addr: 'Dilsukhnagar bus stand road', desc: 'Potholes all along the bus bay, buses stopping in the middle lane instead.', stage: 'confirmed', age: 560, fixAfter: 86, up: 16, by: 'u-karthik' },
  { id: 'CS-2037', cat: 'Garbage Overflow', ward: 'Dilsukhnagar', dLat: -0.0016, dLng: 0.0019, addr: 'Kothapet fruit market road', desc: 'Rotting fruit waste dumped beside the market wall.', stage: 'assigned', age: 16, up: 10, by: 'u-ananya' },

  // --- older, closed history (fills analytics + scorecards)
  { id: 'CS-1987', cat: 'Garbage Overflow', ward: 'Kukatpally', dLat: -0.0008, dLng: 0.0031, addr: 'Moosapet main road', desc: 'Overflowing bins outside the bus stop.', stage: 'confirmed', age: 1180, fixAfter: 20, up: 6, by: 'u-ravi' },
  { id: 'CS-1979', cat: 'Potholes', ward: 'Secunderabad', dLat: 0.0031, dLng: 0.0027, addr: 'Rashtrapati Road', desc: 'Pothole outside the market, scooters falling.', stage: 'confirmed', age: 1320, fixAfter: 95, up: 9, by: 'u-sneha' },
  { id: 'CS-1990', cat: 'Broken Streetlight', ward: 'Charminar', dLat: -0.0023, dLng: 0.0028, addr: 'Shalibanda road', desc: 'Dark stretch, four lights out near the school.', stage: 'confirmed', age: 1050, fixAfter: 70, up: 7, by: 'u-mohammed' },
  { id: 'CS-1993', cat: 'Water Leakage', ward: 'Dilsukhnagar', dLat: 0.0026, dLng: -0.0021, addr: 'Chaitanyapuri, near the metro', desc: 'Leaking pipeline flooding the service road.', stage: 'confirmed', age: 930, fixAfter: 38, up: 8, by: 'u-karthik' },
  { id: 'CS-1996', cat: 'Drainage Problem', ward: 'Secunderabad', dLat: -0.0029, dLng: 0.0024, addr: 'Bholakpur', desc: 'Sewage overflowing from the main drain after rain.', stage: 'confirmed', age: 880, fixAfter: 72, up: 12, by: 'u-fatima' },
  { id: 'CS-1999', cat: 'Garbage Overflow', ward: 'Charminar', dLat: 0.0027, dLng: -0.0024, addr: 'Madina Building lane', desc: 'Waste pile next to the wholesale shops.', stage: 'confirmed', age: 760, fixAfter: 44, up: 10, by: 'u-vikram' },
  { id: 'CS-2001', cat: 'Potholes', ward: 'Kondapur', dLat: 0.0024, dLng: -0.0026, addr: 'Masjid Banda road', desc: 'Series of potholes near the school gate.', stage: 'confirmed', age: 700, fixAfter: 52, up: 6, by: 'u-ananya' },
  { id: 'CS-2003', cat: 'Broken Streetlight', ward: 'Ameerpet', dLat: 0.0031, dLng: -0.0027, addr: 'Balkampet road', desc: 'Streetlight off near the Yellamma temple.', stage: 'confirmed', age: 640, fixAfter: 26, up: 5, by: 'u-lakshmi' },

  // --- rejected (shows the Rejected chip + honest moderation)
  { id: 'CS-2028', cat: 'Potholes', ward: 'Ameerpet', dLat: -0.0031, dLng: -0.0024, addr: 'Ameerpet', desc: 'test test pothole', stage: 'rejected', age: 140, up: 0, by: 'u-deepa' },
];

const STATUS: Record<Stage, string> = {
  reported: 'Pending', verified: 'Verified', assigned: 'Assigned', progress: 'In Progress',
  awaiting: 'Pending Citizen Confirmation', confirmed: 'Confirmed Resolved', rejected: 'Closed',
};

function buildIssue(r: Row) {
  const w = WARDS.find(x => x.name === r.ward)!;
  const lat = +(w.lat + r.dLat).toFixed(6), lng = +(w.lng + r.dLng).toFixed(6);
  const prio = r.prio || 'Normal';
  const reporter = nameOf(r.by);
  const team = teamFor(r.cat);
  const t0 = r.age;
  const hist: any[] = [{ status: 'Pending', at: iso(t0), by: reporter, note: 'Report submitted' }];
  const order: Stage[] = ['reported', 'verified', 'assigned', 'progress', 'awaiting', 'confirmed'];
  const upto = r.stage === 'rejected' ? 0 : order.indexOf(r.stage);
  const fix = r.fixAfter ?? Math.max(4, Math.round(slaHoursFor(r.cat, prio) * 0.6));
  // spread stage transitions across the time to fix (or the age, if still open)
  const span = upto >= 4 ? fix : t0 * 0.85;
  const at = (frac: number) => iso(t0 - span * frac);
  if (upto >= 1) hist.push({ status: 'Verified', at: at(0.12), by: 'community', note: '3+ neighbours confirmed this issue' });
  if (upto >= 2) hist.push({ status: 'Assigned', at: at(0.25), by: 'ghmc.admin', note: `Assigned to ${TEAMS.find(t => t.id === team)!.name}` });
  if (upto >= 3) hist.push({ status: 'In Progress', at: at(0.55), by: 'ghmc.admin' });
  if (upto >= 4) hist.push({ status: 'Pending Citizen Confirmation', at: at(1), by: 'ghmc.admin', note: 'Crew marked the fix complete; awaiting citizen confirmation' });
  if (upto >= 5) hist.push({ status: 'Confirmed Resolved', at: iso(t0 - fix + 3 > 0 ? t0 - fix - 3 : 0.5), by: reporter, note: 'Reporter confirmed the fix' });
  if (r.stage === 'rejected') hist.push({ status: 'Closed', at: iso(t0 - 2), by: 'ghmc.admin', note: 'Rejected: photo does not match the description' });

  const resolved = upto >= 4;
  const voters = NEIGHBOURS.map(n => n[0]).filter(id => id !== r.by);
  const votedBy = voters.slice(0, Math.min(r.up, voters.length));
  const communityVotes = resolved ? voters.slice(0, Math.min(4, Math.max(1, Math.round(r.up / 5)))).map((id, k) => ({ userId: id, username: nameOf(id), vote: k === 3 && r.up < 12 ? 'Not Resolved' : 'Resolved', comment: '', timestamp: iso(t0 - fix + 1 + k) })) : [];
  const after = resolved ? AFTER[r.cat] : undefined;

  return {
    id: r.id, userId: r.by, username: reporter, userEmail: r.by === DEMO_CITIZEN.id ? DEMO_CITIZEN.email : NEIGHBOURS.find(n => n[0] === r.by)?.[2],
    category: r.cat, description: r.desc, imageUrl: BEFORE[r.cat],
    locationAddress: `${r.addr}, ${r.ward}, Hyderabad, Telangana`, latitude: lat, longitude: lng, ward: r.ward,
    priority: prio, status: STATUS[r.stage], timestamp: iso(t0),
    upvotes: Math.max(r.up, votedBy.length), votedBy,
    assignedTeam: upto >= 2 ? team : undefined,
    resolvedAt: resolved ? iso(t0 - fix) : undefined,
    resolutionImage: after, workerImageUrl: after,
    closureCheck: resolved ? { verdict: 'unavailable', confidence: null, reasoning: 'AI check unavailable — no GEMINI_API_KEY configured. Reviewed manually by the ward officer.', model: null, checkedAt: iso(t0 - fix) } : null,
    citizenVerification: r.stage === 'confirmed' ? { userId: r.by, username: reporter, vote: 'Resolved Properly', comment: r.cat === 'Water Leakage' ? 'Fixed the same day. Footpath is dry now — thank you!' : 'Looks good, thanks to the crew.', verificationImage: null, timestamp: iso(Math.max(0.5, t0 - fix - 3)) } : null,
    communityVotes, voteCountResolved: communityVotes.filter(v => v.vote === 'Resolved').length, voteCountNotResolved: communityVotes.filter(v => v.vote !== 'Resolved').length,
    isFake: r.stage === 'rejected' ? 1 : 0,
    adminNotes: r.stage === 'rejected' ? 'Rejected: photo does not match the description.' : '',
    statusHistory: hist,
  };
}

async function main() {
  await mongoose.connect(URI);
  console.log(`🌱 Seeding demo data into ${URI.replace(/\/\/[^@]*@/, '//***@')}`);
  await Promise.all([(Issue as any).deleteMany({}), (Notification as any).deleteMany({}), (WorkerTeam as any).deleteMany({}), (User as any).deleteMany({})]);

  const adminPass = await bcrypt.hash('CiviSnap@2026', 10);
  await (User as any).create({ id: 'admin-ghmc', username: 'ghmc.admin', fullName: 'GHMC Ward Officer', email: 'officer@demo.civisnap.in', password: adminPass, role: 'admin', reputationPoints: 0, badges: [] });

  const issues = ROWS.map(buildIssue);
  const reports = (id: string) => issues.filter(i => i.userId === id).length;
  await (User as any).create({
    id: DEMO_CITIZEN.id, username: 'citizen_priya', fullName: DEMO_CITIZEN.fullName, email: DEMO_CITIZEN.email, address: DEMO_CITIZEN.address, city: DEMO_CITIZEN.city,
    postalCode: DEMO_CITIZEN.postalCode, locationAddress: 'Road No. 12, Banjara Hills, Hyderabad, Telangana 500034', latitude: DEMO_CITIZEN.lat, longitude: DEMO_CITIZEN.lng,
    reputationPoints: 785, badges: ['Founding Reporter'], role: 'citizen', reportedIssuesCount: reports(DEMO_CITIZEN.id),
  });
  for (const [id, fullName, email, pts, n] of NEIGHBOURS) {
    const w = WARDS[(NEIGHBOURS.findIndex(x => x[0] === id) * 5) % WARDS.length];
    await (User as any).create({ id, username: `citizen_${id.slice(2)}`, fullName, email, city: 'Hyderabad', role: 'citizen', reputationPoints: pts, badges: pts > 900 ? ['Locality Hero'] : [], reportedIssuesCount: Math.max(n, reports(id)), latitude: w.lat, longitude: w.lng, locationAddress: `${w.name}, Hyderabad` });
  }
  await (WorkerTeam as any).insertMany(TEAMS.map(t => ({ ...t, activeTasks: issues.filter(i => i.assignedTeam === t.id && ['Assigned', 'In Progress'].includes(i.status)).length })));
  await (Issue as any).insertMany(issues);

  const notes = [
    [DEMO_CITIZEN.id, 'Issue Resolution – Please Verify', 'Your reported issue "Garbage Overflow" has been marked as resolved. Please verify the fix.', 'CS-2038', 30],
    [DEMO_CITIZEN.id, 'Issue In Progress', 'Your reported issue "Broken Streetlight" is now being worked on.', 'CS-2035', 40],
    [DEMO_CITIZEN.id, 'Your report was verified', '3 neighbours confirmed your bus-shelter report.', 'CS-2044', 34],
    ['admin', 'New Civic Issue', 'A new High priority issue has been reported in Other.', 'CS-2048', 3],
    ['admin', 'SLA breached', 'Issue #CS-2031 (Drainage Problem) is past its 48 h deadline.', 'CS-2031', 48],
    ['admin', 'Resolution Confirmed', 'Priya Reddy confirmed that issue #CS-2029 (Water Leakage) is properly resolved.', 'CS-2029', 240],
  ] as const;
  await (Notification as any).insertMany(notes.map(([to, title, message, issueId, h], k) => ({ id: `n-${k}`, recipientRole: to, title, message, issueId, isRead: k > 2 && k !== 4, timestamp: iso(h) })));

  if (!(await (SystemConfig as any).findOne({ id: 'default' }))) {
    await (SystemConfig as any).create({ id: 'default', categories: [...CATEGORIES], priorities: ['Normal', 'High', 'Emergency'] });
  }

  const by = (s: string) => issues.filter(i => i.status === s).length;
  console.log(`✅ ${issues.length} issues across ${new Set(issues.map(i => i.ward)).size} areas · ${NEIGHBOURS.length + 1} citizens · ${TEAMS.length} crews`);
  console.log(`   Pending ${by('Pending')} · Verified ${by('Verified')} · Assigned ${by('Assigned')} · In Progress ${by('In Progress')} · Awaiting ${by('Pending Citizen Confirmation')} · Confirmed ${by('Confirmed Resolved')} · Rejected ${by('Closed')}`);
  console.log('   Citizen login: priya@demo.civisnap.in (email OTP — shown on screen in dev mode)');
  console.log('   Admin login:   ghmc.admin / CiviSnap@2026');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
