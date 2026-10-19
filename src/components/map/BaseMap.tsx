import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import '../../lib/leafletSetup';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

export const HYDERABAD: [number, number] = [17.4239, 78.4438];

/**
 * OpenStreetMap standard tiles (free, no key; attribution required).
 * Dark mode re-tints the same tiles with a CSS filter (see .civic-tiles-dark in index.css).
 */
export function ThemedTiles() {
  const { resolved } = useTheme();
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      maxZoom={19}
      className={resolved === 'dark' ? 'civic-tiles-dark' : 'civic-tiles'}
    />
  );
}

export function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center[0], center[1]]);
  return null;
}

export function FitBounds({ points, maxZoom = 15 }: { points: [number, number][]; maxZoom?: number }) {
  const map = useMap();
  const key = points.map(p => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    const fit = () => {
      map.invalidateSize();
      if (points.length === 1) map.setView(points[0], maxZoom);
      else map.fitBounds(points as LatLngBoundsExpression, { padding: [36, 36], maxZoom });
    };
    fit();
    const t = setTimeout(fit, 300); // container may still be animating in
    return () => clearTimeout(t);
  }, [key]);
  return null;
}

/** Fix grey tiles when the map mounts inside an animating / resizing container. */
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [map]);
  return null;
}

export function BaseMap({ center = HYDERABAD, zoom = 12, className, children, scrollWheelZoom = false, label = 'Map' }: {
  center?: LatLngExpression; zoom?: number; className?: string; children?: React.ReactNode; scrollWheelZoom?: boolean; label?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden', className)} role="region" aria-label={label}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={scrollWheelZoom} style={{ height: '100%', width: '100%' }} zoomControl>
        <ThemedTiles />
        <InvalidateOnResize />
        {children}
      </MapContainer>
    </div>
  );
}
