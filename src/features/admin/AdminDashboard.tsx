import React from 'react';
import { LayoutDashboard, AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '../../lib/leafletSetup';
import { safeFormatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

export const AdminDashboard = ({ issues = [], setView }: any) => {
  const safeIssues = Array.isArray(issues) ? issues : [];
  const stats = {
    total: safeIssues.length,
    pending: safeIssues.filter((i: any) => i && i.status === 'Pending').length,
    resolved: safeIssues.filter((i: any) => i && (i.status === 'Resolved' || i.status === 'Confirmed Resolved')).length,
    fake: safeIssues.filter((i: any) => i && i.isFake).length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900">Admin Command Center</h2>
          <p className="text-slate-500">Overview of city-wide civic operations and issue management.</p>
        </div>
        <Button onClick={() => setView('admin-issues')}>View All Issues</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={stats.total} icon={<LayoutDashboard className="text-blue-500" />} />
        <StatCard label="Awaiting Action" value={stats.pending} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard label="Fake/Flagged" value={stats.fake} icon={<AlertTriangle className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-slate-900 text-white">
          <h3 className="text-xl font-bold mb-6">Welcome VCB Admin To Complaint App</h3>
          <div className="space-y-4">
            {[
              'Potholes',
              'Waste and Garbage Dumping',
              'Broken Drainage Chambers',
              'Stray Dogs'
            ].map(cat => (
              <button 
                key={cat}
                onClick={() => setView('admin-issues')}
                className="w-full flex items-center justify-between p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <span className="text-sm font-bold">{cat} Complaints</span>
                <ArrowRight size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        </Card>
        <AdminRecentReports issues={issues.slice(0, 5)} setView={setView} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AdminHeatmap issues={issues} />
      </div>
    </motion.div>
  );
};

export const AdminHeatmap = ({ issues }: any) => (
  <Card className="h-[450px] p-0 overflow-hidden relative">
    <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200">
      <h4 className="text-xs font-black text-slate-900 uppercase">Complaint Density</h4>
    </div>
    <MapContainer center={[17.3850, 78.4867]} zoom={12} style={{ height: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {issues.map((i: any) => (
        <Marker key={i.id} position={[i.latitude, i.longitude]}>
          <Popup>
            <div className="text-xs">
              <p className="font-bold">{i.category}</p>
              <p>{i.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  </Card>
);

export const AdminRecentReports = ({ issues = [], setView }: any) => {
  const safeIssues = Array.isArray(issues) ? issues : [];
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Recent Complaints</h3>
        <button onClick={() => setView('admin-issues')} className="text-xs font-bold text-civic-primary">View All</button>
      </div>
      <div className="space-y-4">
        {safeIssues.slice(0, 10).map((i: any) => (
          <div 
            key={i.id} 
            onClick={() => setView('admin-issues')}
            className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
              <img src={i.imageUrl || `https://picsum.photos/seed/${i.id}/100`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{i.description || 'No description'}</p>
              <p className="text-[10px] text-slate-500 font-medium">
                {i.category || 'Issue'} • {i.timestamp ? safeFormatDate(i.timestamp, 'h:mm a') : 'N/A'}
              </p>
            </div>
            <Badge variant={i.priority === 'Emergency' ? 'danger' : i.priority === 'High' ? 'warning' : 'info'}>
              {i.priority || 'Normal'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
