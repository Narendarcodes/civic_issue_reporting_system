import L from '../../lib/leafletSetup';
import { categoryMeta } from '../../lib/civic';

const cache = new Map<string, L.DivIcon>();

/** Category-coloured teardrop pin with the category glyph (lucide paths). */
export function categoryIcon(category?: string, opts: { overdue?: boolean; selected?: boolean } = {}): L.DivIcon {
  const key = `${category}|${opts.overdue ? 1 : 0}|${opts.selected ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const m = categoryMeta(category);
  const icon = L.divIcon({
    className: `civic-pin${opts.overdue ? ' civic-pin--overdue' : ''}${opts.selected ? ' civic-pin--selected' : ''}`,
    html: `<div class="civic-pin__body" style="background:${m.color}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${m.svg}</svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 38],
    popupAnchor: [0, -34],
  });
  cache.set(key, icon);
  return icon;
}

export const clusterIcon = (count: number) => {
  const size = count < 10 ? 38 : count < 50 ? 46 : 54;
  return L.divIcon({
    className: 'civic-cluster',
    html: `<div class="civic-cluster__ring"><div class="civic-cluster__core">${count}</div></div>`,
    iconSize: [size, size],
  });
};

/** "You are here" dot. */
export const meIcon = () =>
  L.divIcon({
    className: 'civic-pin',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.22)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
