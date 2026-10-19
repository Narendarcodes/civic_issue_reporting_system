import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from '../../lib/leafletSetup';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { categoryIcon, clusterIcon } from './markers';
import { categoryMeta, slaState, stageOf } from '../../lib/civic';

const esc = (s: string) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Clustered, category-coloured issue markers (leaflet.markercluster).
 * Imperative on purpose: it is far faster than one React <Marker> per issue.
 */
export function ClusterLayer({ issues, onSelect, cluster = true }: { issues: any[]; onSelect?: (issue: any) => void; cluster?: boolean }) {
  const map = useMap();
  const groupRef = useRef<L.LayerGroup | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    const group: L.LayerGroup = cluster
      ? (L as any).markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 48,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: (c: any) => clusterIcon(c.getChildCount()),
        })
      : L.layerGroup();
    groupRef.current = group;
    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [map, cluster]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();
    const markers = issues
      .filter(i => typeof i?.latitude === 'number' && typeof i?.longitude === 'number')
      .map(i => {
        const overdue = slaState(i).overdue;
        const m = L.marker([i.latitude, i.longitude], { icon: categoryIcon(i.category, { overdue }), title: `${i.category} — ${stageOf(i)}`, alt: `${i.category} issue` });
        const meta = categoryMeta(i.category);
        m.bindTooltip(
          `<div style="font:600 12px/1.3 var(--font-sans)"><span style="color:${meta.color}">●</span> ${esc(i.category)}<br/><span style="font-weight:500;opacity:.75">${esc(stageOf(i))}${overdue ? ' · overdue' : ''}</span></div>`,
          { direction: 'top', offset: [0, -30], opacity: 1 },
        );
        m.on('click', () => selectRef.current?.(i));
        return m;
      });
    if ((group as any).addLayers) (group as any).addLayers(markers);
    else markers.forEach(mk => group.addLayer(mk));
  }, [issues]);

  return null;
}
