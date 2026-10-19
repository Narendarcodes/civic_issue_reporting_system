import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from '../../lib/leafletSetup';
import 'leaflet.heat';

/** Complaint-density heatmap (leaflet.heat). Weight grows with upvotes. */
export function HeatLayer({ issues }: { issues: any[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = issues
      .filter(i => typeof i?.latitude === 'number')
      .map(i => [i.latitude, i.longitude, Math.min(1, 0.35 + (i.upvotes || 0) / 25)]);
    const layer = (L as any).heatLayer(pts, {
      radius: 32, blur: 26, maxZoom: 15, minOpacity: 0.35,
      gradient: { 0.2: '#5eead4', 0.45: '#10b981', 0.7: '#f59e0b', 1: '#e11d48' },
    });
    layer.addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, issues]);
  return null;
}
