import React, { useMemo } from 'react';
import { PlusCircle, Map as MapIcon, History, ChevronRight, AlertTriangle, CheckCircle2, Clock, MapPin, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

import { CivicAlerts } from '../dashboard/CivicAlerts';
import { IssueCard } from '../issues/IssueCard';

export const Dashboard = ({ issues = [], setView, user, onRefresh }: any) => {
  const userIssues = (issues || []).filter((i: any) => i && i.userId === user?.id);
  
  const stats = {
    total: userIssues.length,
    pending: userIssues.filter((i: any) => i.status !== 'Issue Resolved' && i.status !== 'Confirmed Resolved').length,
    resolved: userIssues.filter((i: any) => i.status === 'Issue Resolved' || i.status === 'Confirmed Resolved').length,
    emergency: userIssues.filter((i: any) => i.priority === 'Emergency').length,
  };

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(name => ({ name, resolved: 0, reported: 0 }));
    
    (issues || []).forEach((issue: any) => {
      if (!issue || !issue.timestamp) return;
      const date = new Date(issue.timestamp);
      const day = date.getDay();
      data[day].reported += 1;
      if (issue.status === 'Resolved' || issue.status === 'Confirmed Resolved' || issue.status === 'Pending Citizen Confirmation') {
        data[day].resolved += 1;
      }
    });
    
    // Reorder array to start from Mon to Sun
    return [...data.slice(1), data[0]];
  }, [issues]);

  const recentActivities = useMemo(() => {
    return (issues || [])
      .slice(0, 5)
      .map((issue: any) => ({
        user: issue.username || 'Anonymous',
        action: (issue.status === 'Resolved' || issue.status === 'Confirmed Resolved' || issue.status === 'Pending Citizen Confirmation') ? 'resolved' : 'reported',
        target: issue.category,
        time: new Date(issue.timestamp).toLocaleDateString(),
        icon: (issue.status === 'Resolved' || issue.status === 'Confirmed Resolved' || issue.status === 'Pending Citizen Confirmation') 
          ? <CheckCircle2 size={14} className="text-emerald-500" /> 
          : <PlusCircle size={14} className="text-blue-500" />
      }));
  }, [issues]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <Badge variant="info" className="mb-2">Citizen Dashboard</Badge>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">
            Hello, <span className="text-civic-primary">{user?.username}</span>
          </h2>
          <p className="text-slate-500 flex items-center gap-2">
            <MapPin size={16} className="text-civic-primary" />
            {user?.locationAddress?.split(',')[0] || 'Your neighborhood'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-xl flex items-center gap-4 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-civic-primary/20 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-civic-primary/40 transition-colors" />
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-civic-primary relative z-10">
              <ThumbsUp size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-bold">{user?.reputationPoints || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reputation</p>
            </div>
          </div>
          <Button onClick={() => setView('report')} className="h-full px-8 rounded-[1.5rem] shadow-lg shadow-civic-primary/20 hover:scale-105 active:scale-95 transition-all">
            <PlusCircle size={20} className="mr-2" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Reports" value={stats.total} icon={<MapIcon className="text-blue-500" />} trend="+2 this week" />
        <StatCard label="Active" value={stats.pending} icon={<Clock className="text-amber-500" />} trend="Action needed" />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} trend="100% success" />
        <StatCard label="Emergency" value={stats.emergency} icon={<AlertTriangle className="text-red-500" />} trend="High priority" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Impact Chart */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Community Impact</h3>
              <p className="text-xs text-slate-500">Resolved vs Reported issues this week</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-civic-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Reported</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Resolved</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="reported" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorReported)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorResolved)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Feed */}
        <div className="space-y-6">
          <CivicAlerts />
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Live Activity</h3>
            <div className="space-y-6">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1">{activity.icon}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-slate-600 leading-tight">
                      <span className="font-bold text-slate-900">{activity.user}</span> {activity.action} <span className="font-medium text-civic-primary">{activity.target}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-2 text-xs font-bold text-civic-primary hover:bg-blue-50 rounded-xl transition-all border border-blue-100">
              View All Activity
            </button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Nearby Issues</h3>
            <button onClick={() => setView('feed')} className="text-civic-primary text-sm font-bold flex items-center gap-1">
              Explore Map <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issues.slice(0, 2).map((issue: any) => (
            <IssueCard key={issue.id} issue={issue} user={user} onRefresh={onRefresh} />
          ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Civic Leaderboard</h3>
          <Card className="p-0 overflow-hidden border-slate-200/60 bg-white/50 backdrop-blur-md">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Top Contributors</span>
              <div className="flex items-center gap-1 text-emerald-400">
                <History size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Weekly</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { name: 'Rahul S.', points: 1250, badge: 'Guardian', color: 'bg-amber-100 text-amber-700' },
                { name: 'Priya K.', points: 980, badge: 'Active', color: 'bg-slate-100 text-slate-700' },
                { name: 'Amit V.', points: 750, badge: 'Reporter', color: 'bg-orange-100 text-orange-700' },
                { name: user?.username, points: user?.reputationPoints || 0, badge: 'You', color: 'bg-blue-100 text-blue-700' }
              ].sort((a, b) => b.points - a.points).map((u, i) => (
                <div key={i} className={cn("p-4 flex items-center justify-between transition-colors hover:bg-slate-50/50", u.name === user?.username && "bg-blue-50/50")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black", u.color)}>
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold shadow-sm">
                      {u.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{u.badge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{u.points}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
