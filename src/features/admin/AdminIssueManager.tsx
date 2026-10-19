import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, MessageSquare, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch, cn, safeJson } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminIssueManager = ({ issues = [], onRefresh }: any) => {
  const [filter, setFilter] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  
  const safeIssues = Array.isArray(issues) ? issues : [];

  useEffect(() => {
    apiFetch('/api/admin/teams').then(safeJson).then(data => data && setTeams(data));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return safeIssues;
    if (filter === 'Resolved') return safeIssues.filter((i: any) => i && (i.status === 'Resolved' || i.status === 'Confirmed Resolved' || i.status === 'Pending Citizen Confirmation'));
    return safeIssues.filter((i: any) => i && i.status === filter);
  }, [safeIssues, filter]);

  const [adminResolutionImage, setAdminResolutionImage] = useState<string | null>(null);
  const [managementLoading, setManagementLoading] = useState(false);

  const updateIssue = async (id: string, updates: any) => {
    setManagementLoading(true);
    try {
      const res = await apiFetch(`/api/admin/issues/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...updates, resolutionImage: adminResolutionImage || updates.resolutionImage })
      });
      if (res.ok) {
        setSelectedIssue(null);
        setAdminResolutionImage(null);
        if (onRefresh) await onRefresh();
      } else {
        const errData = await safeJson(res);
        alert(errData?.error || 'Failed to update issue');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during update');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleAdminPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminResolutionImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold text-slate-900">Issue Management</h2>
        <div className="flex gap-2">
          {['All', 'Pending', 'In Progress', 'Resolved'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilter(s)}
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", filter === s ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Issue</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Reporter</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Team</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((i: any) => (
                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={i.imageUrl || `https://picsum.photos/seed/${i.id}/100`} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="max-w-[200px]">
                        <p className="text-sm font-bold text-slate-900 truncate">{i.description || 'No description'}</p>
                        <p className="text-[10px] text-slate-500">{(i.locationAddress || 'Unknown').split(',')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{i.username}</td>
                  <td className="px-6 py-4"><Badge variant={i.status === 'Resolved' || i.status === 'Confirmed Resolved' || i.status === 'Pending Citizen Confirmation' ? 'success' : i.status === 'Pending' ? 'warning' : 'info'}>{i.status}</Badge></td>
                  <td className="px-6 py-4 border-none">
                    <span className={cn("text-xs font-black uppercase", i.priority === 'Emergency' ? 'text-red-500' : i.priority === 'High' ? 'text-amber-500' : 'text-blue-500')}>
                      {i.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{i.assignedTeam || "Not Assigned"}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedIssue(i)} className="text-civic-primary hover:underline text-xs font-bold">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex flex-col h-[80vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <span className="bg-slate-100 p-1.5 rounded-lg"><MessageSquare size={16} /></span>
                  Ticket ID: <span className="text-slate-900 font-bold">{selectedIssue.id}</span>
                </div>
                <button onClick={() => setSelectedIssue(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                <img src={selectedIssue.imageUrl} className="w-full h-64 object-cover rounded-2xl border border-slate-200" referrerPolicy="no-referrer" />
                
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Complaint Type</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium">{selectedIssue.category}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Department</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400" />
                      {selectedIssue.assignedTeam || 'Unassigned Department'}
                    </div>
                  </div>

                  <div className="h-48 rounded-xl overflow-hidden border border-slate-200 relative">
                    {/* Placeholder map view to prevent layout issues */}
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin size={32} className="mx-auto text-red-500 mb-2" />
                        <p className="text-xs font-bold text-slate-500 max-w-[200px] truncate">{selectedIssue.locationAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Division</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium">{selectedIssue.division || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Prabhag</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium">{selectedIssue.prabhag || 'N/A'}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                    <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed min-h-[100px]">
                      {selectedIssue.description}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Grievance Severity</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium">{selectedIssue.priority}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Complaint By</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium">{selectedIssue.username}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Email Id</label>
                    <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium">{selectedIssue.userEmail || 'N/A'}</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-center font-bold text-slate-900 mb-4">Update Your Status</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      disabled={managementLoading}
                      onClick={() => updateIssue(selectedIssue.id, { status: 'In Progress' })}
                      className={cn(
                        "w-full py-3.5 rounded-xl font-bold transition-all shadow-md",
                        selectedIssue.status === 'In Progress' ? "bg-orange-500 text-white shadow-orange-500/20" : "bg-red-400 text-white hover:bg-red-500 shadow-red-400/20"
                      )}
                    >
                      {managementLoading && selectedIssue.status !== 'In Progress' ? 'Updating...' : 'In-Progress'}
                    </button>
                    <button
                      disabled={managementLoading}
                      onClick={() => updateIssue(selectedIssue.id, { status: 'Resolved' })}
                      className={cn(
                        "w-full py-3.5 rounded-xl font-bold transition-all shadow-md",
                        (selectedIssue.status === 'Resolved' || selectedIssue.status === 'Confirmed Resolved' || selectedIssue.status === 'Pending Citizen Confirmation') 
                          ? "bg-emerald-600 text-white shadow-emerald-600/20" 
                          : "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-800/20"
                      )}
                    >
                      {managementLoading && selectedIssue.status !== 'Resolved' ? 'Updating...' : 'Completed'}
                    </button>
                  </div>
                </div>

                <div className="space-y-6 mt-6">

                  {(selectedIssue.status !== 'Pending') && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6 mt-4">
                      <label className="block text-xs font-bold text-emerald-700 uppercase mb-2 tracking-widest">Upload Resolution Proof (AI Verification)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={managementLoading}
                        onChange={handleAdminPhotoUpload}
                        className="text-xs text-emerald-600 mb-2"
                      />
                      {adminResolutionImage && <img src={adminResolutionImage} className="w-full h-32 object-cover rounded-xl mt-2" />}
                      <p className="text-[10px] text-emerald-700 mt-2">Upload a photo showing the fixed issue before clicking "Completed" to trigger AI verification.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Assign Worker Team</label>
                    <select 
                      disabled={managementLoading}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 disabled:opacity-50"
                      value={selectedIssue.assignedTeam || ""}
                      onChange={(e) => updateIssue(selectedIssue.id, { assignedTeam: e.target.value })}
                    >
                      <option value="">Select a team</option>
                      {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Verification Status</h4>
                    {selectedIssue.citizenVerification ? (
                      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-900">Reporter Vote</span>
                          <Badge variant={selectedIssue.citizenVerification.vote === 'Resolved Properly' ? 'success' : 'danger'}>
                            {selectedIssue.citizenVerification.vote}
                          </Badge>
                        </div>
                        {selectedIssue.citizenVerification.comment && (
                          <p className="text-[10px] text-slate-500 italic mb-2">"{selectedIssue.citizenVerification.comment}"</p>
                        )}
                        {selectedIssue.citizenVerification.verificationImage && (
                          <img src={selectedIssue.citizenVerification.verificationImage} className="w-full h-24 object-cover rounded-xl" />
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No reporter verification yet.</p>
                    )}

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Community Feedback</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-emerald-500">+{selectedIssue.voteCountResolved || 0}</span>
                          <span className="text-[10px] font-bold text-red-500">-{selectedIssue.voteCountNotResolved || 0}</span>
                        </div>
                      </div>
                      
                      {selectedIssue.communityVotes && selectedIssue.communityVotes.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                          {selectedIssue.communityVotes.map((v: any, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3">
                              <div className={cn("w-2 h-2 mt-1.5 rounded-full shrink-0", v.vote === 'Resolved' ? 'bg-emerald-500' : 'bg-red-500')} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-600 italic">"{v.comment || 'No comment provided'}"</p>
                                {v.image && <img src={v.image} className="mt-2 w-20 h-12 object-cover rounded-lg" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No community feedback yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        if (confirm('Flag this report as fake? The user may be blocked after 3 reports.')) {
                          updateIssue(selectedIssue.id, { isFake: true, status: 'Closed' });
                        }
                      }}
                      className="flex-1 py-3 px-4 border-2 border-red-100 text-red-600 rounded-2xl font-bold text-xs hover:bg-red-50"
                    >
                      Flag as Fake Report
                    </button>
                    <Button onClick={() => setSelectedIssue(null)} className="flex-1 rounded-2xl">Close</Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
