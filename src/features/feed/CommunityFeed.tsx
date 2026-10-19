import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Map as MapIcon, CheckCircle2, Clock, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '../../lib/leafletSetup';
import { apiFetch, cn, safeFormatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

import { IssueCard } from '../issues/IssueCard';
import { VerificationModal } from '../issues/VerificationModal';

export const CommunityFeed = ({ issues = [], user, onRefresh }: any) => {
  const [filter, setFilter] = useState('All');
  const [showMap, setShowMap] = useState(false);
  const [votingIssue, setVotingIssue] = useState<any>(null);
  
  const safeIssues = Array.isArray(issues) ? issues : [];
  const mapCenterLat = parseFloat(user?.latitude) || 17.3850;
  const mapCenterLng = parseFloat(user?.longitude) || 78.4867;

  const categories = [
    'All', 
    'Potholes', 
    'Garbage Overflow', 
    'Road Damage', 
    'Broken Streetlight', 
    'Water Leakage', 
    'Drainage Problem', 
    'Public Facility Damage', 
    'Other'
  ];

  const handleUpvote = async (issueId: string) => {
    try {
      const res = await apiFetch(`/api/issues/${issueId}/upvote`, {
        method: 'POST'
      });
      if (res.ok && onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIssues = useMemo(() => {
    let result = filter === 'All' ? safeIssues : safeIssues.filter((i: any) => i && i.category === filter);
    return result;
  }, [safeIssues, filter]);

  const stats = useMemo(() => {
    const resolved = safeIssues.filter((i: any) => i && i.status === 'Confirmed Resolved').length;
    const pending = safeIssues.filter((i: any) => i && i.status !== 'Confirmed Resolved').length;
    return { resolved, pending };
  }, [safeIssues]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 p-8 sm:p-12 text-white">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-civic-primary/50 to-transparent" />
          <MapIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <Badge variant="info" className="bg-civic-primary/20 text-civic-primary border-civic-primary/30 mb-4">
            Community Pulse
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-display font-bold mb-4 leading-tight">
            Your neighborhood, <br />
            <span className="text-civic-primary">better together.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md">
            Join {issues.length}+ active citizens in reporting and verifying local issues. Every action counts towards a cleaner city.
          </p>
          
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Issues Resolved</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">In Progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-civic-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search issues, locations, or categories..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-4 focus:ring-civic-primary/10 focus:border-civic-primary transition-all text-sm font-medium"
            onChange={(e) => {
              // Simple client-side search logic could be added here
            }}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                filter === c 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            variant={showMap ? 'primary' : 'outline'} 
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 rounded-xl"
          >
            {showMap ? <LayoutDashboard size={18} /> : <MapIcon size={18} />}
            {showMap ? 'List View' : 'Map View'}
          </Button>
        </div>
      </div>

      {showMap ? (
        <Card className="h-[600px] p-0 overflow-hidden relative">
          <MapContainer center={[mapCenterLat, mapCenterLng]} zoom={13} style={{ height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredIssues.map((issue: any) => {
              if (!issue || !issue.latitude || !issue.longitude) return null;
              return (
                <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                  <Popup className="custom-popup">
                    <div className="w-64">
                      {issue.imageUrl && <img src={issue.imageUrl} className="w-full h-32 object-cover rounded-lg mb-2" referrerPolicy="no-referrer" />}
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={issue.priority === 'Emergency' ? 'danger' : 'info'}>{issue.category || 'Issue'}</Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{issue.priority || 'Normal'}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm mb-1">{(issue.description || '').slice(0, 50)}...</p>
                      <p className="text-[10px] text-slate-500 mb-3">{issue.locationAddress || 'Unknown location'}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-medium text-slate-400">
                          {issue.timestamp ? safeFormatDate(issue.timestamp, 'MMM d') : 'N/A'}
                        </span>
                        <Badge variant={issue.status === 'Issue Resolved' || issue.status === 'Confirmed Resolved' ? 'success' : 'warning'}>
                          {issue.status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </Card>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIssues.map((issue: any) => (
              <IssueCard 
                key={issue.id} 
                issue={issue} 
                onUpvote={handleUpvote} 
                user={user}
                onRefresh={onRefresh}
                onVerify={issue.userId === user?.id ? () => setVotingIssue(issue) : undefined}
              />
            ))}
            {filteredIssues.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <MapIcon size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-medium">No issues found in this category nearby.</p>
              </div>
            )}
          </div>

          {/* Success Stories Section */}
          <div className="pt-12 border-t border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900">Civic Success Stories</h3>
                <p className="text-slate-500 text-sm">Real impact, powered by citizens like you.</p>
              </div>
              <Button variant="outline" className="rounded-xl">View All Impact</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Main St Pothole Fixed', location: 'Downtown', time: '2 days ago', icon: '🛣️' },
                { title: 'Park Lighting Restored', location: 'Green Valley', time: '5 days ago', icon: '💡' },
                { title: 'Illegal Dumping Cleared', location: 'East Side', time: '1 week ago', icon: '🧹' },
              ].map((story, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                    {story.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{story.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">{story.location} • {story.time}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                    <CheckCircle2 size={14} />
                    Verified by 12 Citizens
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {votingIssue && (
          <VerificationModal 
            issue={votingIssue} 
            onClose={() => setVotingIssue(null)} 
            onVoteSuccess={() => setVotingIssue(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
