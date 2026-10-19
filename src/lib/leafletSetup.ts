// Leaflet base styles + default marker icon fix (bundlers break Leaflet's
// icon URL detection). Imported by every map-using feature so Leaflet only
// ships in the lazily-loaded map chunks.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Leaflet plugins (markercluster, heat) attach to the global `L`.
if (typeof window !== 'undefined') (window as any).L = L;

export default L;
