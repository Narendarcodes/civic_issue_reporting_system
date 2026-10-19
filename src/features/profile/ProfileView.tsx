import React from 'react';
import { Check, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Card } from '../../components/ui/Card';

export const ProfileView = ({ user }: any) => {
  const journey = [
    { date: 'Mar 10, 2026', event: 'Joined CivicConnect', icon: '👋', color: 'bg-blue-500' },
    { date: 'Mar 12, 2026', event: 'Reported first issue', icon: '📝', color: 'bg-amber-500' },
    { date: 'Mar 14, 2026', event: 'Earned "First Responder" badge', icon: '🚨', color: 'bg-emerald-500' },
    { date: 'Mar 15, 2026', event: 'Verified 5 local fixes', icon: '✅', color: 'bg-purple-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-1 p-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-civic-primary to-blue-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-500/20">
              {user?.username?.[0] || 'U'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
              <Check size={20} />
            </div>
          </div>
          
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-1 truncate w-full px-4">{user?.username}</h2>
          <p className="text-sm text-slate-500 mb-6 break-all px-4">{user?.email}</p>
          
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</span>
              <span className="text-xs font-bold text-civic-primary">Elite Citizen</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</span>
              <span className="text-xs font-bold text-slate-600">March 2026</span>
            </div>
          </div>

          <div className="mt-8 w-full pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Badges Unlocked</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {user?.badges?.map((badge: string) => (
                <div key={badge} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform cursor-help group relative">
                  {badge === 'First Responder' ? '🚨' : 
                   badge === 'Eagle Eye' ? '👁️' : 
                   badge === 'Locality Hero' ? '🏠' :
                   badge === 'Active Citizen' ? '🏅' : '🎖️'}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats & Journey */}
        <div className="md:col-span-2 space-y-8">
          {/* Impact Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-1">
              <p className="text-3xl font-black text-slate-900">{user?.reputationPoints || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reputation</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-1">
              <p className="text-3xl font-black text-emerald-500">{user?.badges?.length || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Badges</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-1">
              <p className="text-3xl font-black text-civic-accent">{(user?.reputationPoints || 0) * 1.5}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact Score</p>
            </div>
          </div>

          {/* Journey Timeline */}
          <Card className="p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-8">Civic Journey</h3>
            <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {journey.map((item, i) => (
                <div key={i} className="relative flex gap-6 items-start">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white z-10 shadow-lg", item.color)}>
                    <span className="text-sm">{item.icon}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Earning Guide */}
          <Card className="p-8 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-civic-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
            <h3 className="text-lg font-bold mb-6">How to Level Up</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { pts: '+10', label: 'Report an issue', color: 'text-blue-400' },
                { pts: '+50', label: 'Resolution confirmed', color: 'text-emerald-400' },
                { pts: '+5', label: 'Verify local fix', color: 'text-amber-400' },
                { pts: '+2', label: 'Receive upvote', color: 'text-purple-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <span className={cn("text-lg font-black", item.color)}>{item.pts}</span>
                  <span className="text-xs font-medium text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
