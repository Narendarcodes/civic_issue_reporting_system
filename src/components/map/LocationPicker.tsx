import React, { useMemo, useRef } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import { categoryIcon } from './markers';

/** Draggable pin; clicking the map also moves it. */
export function LocationPicker({ position, onChange, category }: { position: [number, number]; onChange: (lat: number, lng: number) => void; category?: string }) {
  const ref = useRef<any>(null);
  useMapEvents({ click: e => onChange(e.latlng.lat, e.latlng.lng) });
  const handlers = useMemo(() => ({
    dragend() {
      const m = ref.current;
      if (m) { const p = m.getLatLng(); onChange(p.lat, p.lng); }
    },
  }), [onChange]);
  return <Marker draggable eventHandlers={handlers} position={position} ref={ref} icon={categoryIcon(category || 'Other', { selected: true })} />;
}
