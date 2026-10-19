import { apiFetch, safeJson } from './utils';

export { apiFetch, safeJson };

/** Upload one image through the API (multer) and return its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('image', file);
  const token = localStorage.getItem('civic_token');
  const res = await fetch('/api/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
  const data = await safeJson(res);
  if (!res.ok || !data?.imageUrl) throw new Error(data?.error || 'Photo upload failed');
  return data.imageUrl as string;
}

/** JSON request helper that throws a readable Error on failure. */
export async function api<T = any>(url: string, init: { method?: string; body?: any } = {}): Promise<T> {
  const res = await apiFetch(url, { method: init.method || 'GET', ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}) });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}

// ---------------------------------------------------------------- Geocoding
// OpenStreetMap Nominatim (free, no key). Every call degrades to `null` so the
// UI can fall back to coordinates instead of erroring.
const NOMINATIM = 'https://nominatim.openstreetmap.org';
// Nominatim's usage policy allows ~1 request/second: serialise calls and cache results.
const geoCache = new Map<string, any>();
let geoChain: Promise<any> = Promise.resolve();
let lastGeo = 0;
function politely<T>(key: string, run: () => Promise<T>): Promise<T> {
  if (geoCache.has(key)) return Promise.resolve(geoCache.get(key));
  const p = geoChain.then(async () => {
    if (geoCache.has(key)) return geoCache.get(key);
    const wait = 1100 - (Date.now() - lastGeo);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastGeo = Date.now();
    const v = await run();
    if (v !== null) geoCache.set(key, v);
    return v;
  });
  geoChain = p.catch(() => null);
  return p;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  return politely(`r:${lat.toFixed(4)},${lng.toFixed(4)}`, () => reverseRaw(lat, lng));
}
async function reverseRaw(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=json&zoom=17&lat=${lat}&lon=${lng}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const d = await safeJson(r);
    return d?.display_name || null;
  } catch {
    return null;
  }
}

export async function searchAddress(q: string): Promise<{ lat: number; lng: number; label: string } | null> {
  return politely(`s:${q.trim().toLowerCase()}`, () => searchRaw(q));
}
async function searchRaw(q: string): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const r = await fetch(`${NOMINATIM}/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const d = await safeJson(r);
    if (!Array.isArray(d) || !d.length) return null;
    return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), label: d[0].display_name };
  } catch {
    return null;
  }
}

export const coordLabel = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
