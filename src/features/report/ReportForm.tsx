import React, { useState, useEffect, useMemo } from 'react';
import { User, CheckCircle2, Camera, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Marker, useMap } from 'react-leaflet';
import '../../lib/leafletSetup';
import { apiFetch, cn, safeJson } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const ReportForm = ({ user, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    category: 'Potholes',
    description: '',
    latitude: user?.latitude || 17.3850,
    longitude: user?.longitude || 78.4867,
    locationAddress: user?.locationAddress || '',
    priority: 'Normal',
    division: 'Nashik Road',
    prabhag: '17'
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: { 'User-Agent': 'CivicConnect-App' }
        });
        const data = await safeJson(res);
        setFormData(prev => ({ 
          ...prev, 
          locationAddress: data?.display_name || '',
          latitude,
          longitude
        }));
      } catch (err) {
        console.error('Reverse geocoding error:', err);
      } finally {
        setLocating(false);
      }
    }, (err) => {
      console.error('Geolocation error:', err);
      alert('Could not detect your location. Please select it on the map or type your address.');
      setLocating(false);
    }, { enableHighAccuracy: true });
  };

  const searchAddress = async () => {
    if (!formData.locationAddress) return;
    setLocating(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.locationAddress)}`, {
        headers: { 'User-Agent': 'CivicConnect-App' }
      });
      const data = await safeJson(res);
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setFormData(prev => ({ 
          ...prev, 
          locationAddress: display_name,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        }));
      } else {
        alert('Address not found. Please try a different search or use the map.');
      }
    } catch (err) {
      console.error('Search address error:', err);
    } finally {
      setLocating(false);
    }
  };

  const categories = [
    'Potholes', 
    'Garbage Overflow', 
    'Road Damage', 
    'Broken Streetlight', 
    'Water Leakage', 
    'Drainage Problem', 
    'Public Facility Damage', 
    'Other'
  ];
  const priorities = ['Normal', 'High', 'Emergency'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.description || formData.description.length < 5) {
      return alert('Please providing a description (at least 5 characters).');
    }
    if (!formData.latitude || !formData.longitude) {
      return alert('Please select a valid location on the map.');
    }
    if (!image) {
      return alert('Please upload a photo of the issue.');
    }

    setLoading(true);
    try {
      let finalImageUrl = null;
      
      // Step 1: Upload Image via FormData
      const imageFormData = new FormData();
      imageFormData.append('image', image);
      
      const token = localStorage.getItem('civic_token');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: imageFormData
      });

      if (!uploadRes.ok) {
        const errData = await safeJson(uploadRes);
        throw new Error(errData?.error || 'Image upload failed');
      }

      const uploadData = await safeJson(uploadRes);
      finalImageUrl = uploadData?.imageUrl;

      // Step 2: Submit Report with imageUrl
      const res = await apiFetch('/api/reportIssue', {
        method: 'POST',
        body: JSON.stringify({
          category: formData.category,
          description: formData.description,
          imageUrl: finalImageUrl,
          locationAddress: formData.locationAddress,
          latitude: formData.latitude,
          longitude: formData.longitude,
          priority: formData.priority,
          division: formData.division,
          prabhag: formData.prabhag
        })
      });

      if (res.ok) {
        const data = await safeJson(res);
        // Clear form
        setFormData({
          category: 'Potholes',
          description: '',
          locationAddress: user?.locationAddress || '',
          latitude: user?.latitude || 17.3850,
          longitude: user?.longitude || 78.4867,
          priority: 'Normal',
          division: 'Nashik Road',
          prabhag: '17'
        });
        setImage(null);
        
        // Show appropriate feedback based on AI analysis
        if (data?.aiAnalysis?.isFake) {
          const reason = data.aiAnalysis.fakeReason || 'The uploaded image does not match your description/category';
          alert(`⚠️ Report Flagged as Fake\n\nYour report has been flagged because the AI detected a mismatch between your image and description.\n\nReason: ${reason}\n\nPlease ensure your uploaded photo matches what you are describing. Repeated fake submissions may result in account suspension.`);
        } else if (data.isDuplicate) {
          alert('Issue reported! Note: AI detected this might be a duplicate of a nearby issue. We have linked them for faster resolution.');
        } else {
          alert('✅ Issue reported successfully! AI verified your image matches the description.');
        }
        if (onSuccess) onSuccess();
      } else {
        const data = await safeJson(res);
        alert(data?.error || 'Failed to submit report');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(err.message || 'Error submitting report. Please try again.');
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

  const LocationPicker = () => {
    const markerRef = React.useRef<any>(null);
    const eventHandlers = useMemo(() => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setFormData(prev => ({ ...prev, latitude: newPos.lat, longitude: newPos.lng }));
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`, {
            headers: { 'User-Agent': 'CivicConnect-App' }
          })
          .then(safeJson)
          .then(data => setFormData(prev => ({ ...prev, locationAddress: data?.display_name || '' })))
          .catch(console.error);
        }
      },
    }), []);

    return (
      <>
        <MapUpdater center={[formData.latitude, formData.longitude]} />
        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={[formData.latitude, formData.longitude]}
          ref={markerRef}
        />
      </>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Report a Civic Issue</h2>
          <p className="text-slate-500">Help us improve your neighborhood by reporting local problems.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl text-xs font-bold border border-blue-100">
          <CheckCircle2 size={16} />
          Earn 10 Reputation Points
        </div>
      </div>
      
      <Card className="p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
            <textarea 
              required
              rows={6}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-medium"
              placeholder="Describe the issue in detail... (what, where, how severe)"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Photo</label>
            <div className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group",
              image ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 hover:border-civic-primary hover:bg-slate-50"
            )}>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => setImage(e.target.files?.[0] || null)}
              />
              <Camera className={cn("mx-auto mb-2 transition-colors", image ? "text-emerald-500" : "text-slate-400 group-hover:text-civic-primary")} size={32} />
              <p className={cn("text-sm font-medium", image ? "text-emerald-700" : "text-slate-500")}>
                {image ? image.name : 'Click or drag to upload issue photo'}
              </p>
              {image && <p className="text-[10px] text-emerald-500 mt-1">Photo attached successfully</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" type="button" onClick={() => onSuccess()} className="flex-1 rounded-2xl py-4">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-[2] rounded-2xl py-4 shadow-xl shadow-civic-primary/20">
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};
