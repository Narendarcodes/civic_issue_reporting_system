import React, { useState, useEffect, useMemo } from 'react';
import { User, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import '../../lib/leafletSetup';
import { Area } from 'recharts';
import { apiFetch, safeJson } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const LocationSetup = ({ onComplete }: any) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [preview, setPreview] = useState<{lat: number, lng: number}>({ lat: 17.3850, lng: 78.4867 });

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setPreview({ lat: latitude, lng: longitude });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: { 'User-Agent': 'CivicConnect-App' }
        });
        const data = await safeJson(res);
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLocating(false);
      }
    }, (err) => {
      console.error(err);
      setLocating(false);
    }, { enableHighAccuracy: true });
  };

  const searchAddress = async () => {
    if (!address) return;
    setLocating(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
        headers: { 'User-Agent': 'CivicConnect-App' }
      });
      const data = await safeJson(res);
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setPreview({ lat: newLat, lng: newLng });
        setAddress(display_name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLocating(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/user/location', {
        method: 'PUT',
        body: JSON.stringify({
          locationAddress: address,
          latitude: preview.lat,
          longitude: preview.lng
        })
      });
      if (res.ok) {
        onComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, map.getZoom());
    }, [center]);
    return null;
  };

  const DraggableMarker = () => {
    const markerRef = React.useRef<any>(null);
    const eventHandlers = useMemo(() => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPreview({ lat: newPos.lat, lng: newPos.lng });
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`, {
            headers: { 'User-Agent': 'CivicConnect-App' }
          })
          .then(safeJson)
          .then(data => setAddress(data?.display_name || ''))
          .catch(console.error);
        }
      },
    }), []);

    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={[preview.lat, preview.lng]}
        ref={markerRef}>
        <Popup minWidth={90}>
          <span>Drag to your exact home location</span>
        </Popup>
      </Marker>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Set Your Location</h2>
        <p className="text-slate-500 mb-6">We use your location to show you civic issues and alerts in your immediate neighborhood.</p>
        
        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Home Address / Area</label>
              <button 
                type="button" 
                onClick={detectLocation}
                className="text-xs font-bold text-civic-primary hover:underline flex items-center gap-1"
                disabled={locating}
              >
                <MapPin size={12} />
                {locating ? 'Detecting...' : 'Detect My Location'}
              </button>
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 123 Main St, Jubilee Hills"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-civic-primary"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
                />
              </div>
              <Button type="button" onClick={searchAddress} disabled={locating} className="px-6">
                Search
              </Button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-64 rounded-xl overflow-hidden border border-slate-200">
            <MapContainer 
              center={[
                parseFloat(preview.lat as any) || 17.3850, 
                parseFloat(preview.lng as any) || 78.4867
              ]} 
              zoom={15} 
              style={{ height: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater 
                center={[
                  parseFloat(preview.lat as any) || 17.3850, 
                  parseFloat(preview.lng as any) || 78.4867
                ]} 
              />
              <DraggableMarker />
            </MapContainer>
          </motion.div>

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? 'Locating...' : 'Confirm Location'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
