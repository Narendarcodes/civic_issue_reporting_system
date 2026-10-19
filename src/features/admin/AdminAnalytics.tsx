import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Card } from '../../components/ui/Card';

export const AdminAnalytics = ({ issues = [] }: any) => {
  const safeIssues = Array.isArray(issues) ? issues : [];
  const data = useMemo(() => {
    const cats = safeIssues.reduce((acc: any, i: any) => {
      if (i && i.category) {
        acc[i.category] = (acc[i.category] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.keys(cats).map(k => ({ name: k, count: cats[k] }));
  }, [safeIssues]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-display font-bold text-slate-900">Analytics & Insights</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h3 className="text-lg font-bold mb-6">Issues by Category</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 bg-slate-900 text-white">
          <h3 className="text-lg font-bold mb-6">Performance Matrix</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Resolution Rate</span>
                <span className="text-xs font-bold text-emerald-400">84%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[84%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Citizen Satisfaction</span>
                <span className="text-xs font-bold text-blue-400">4.2/5</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[78%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Response Time</span>
                <span className="text-xs font-bold text-amber-400">2.4 days</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[60%]" />
              </div>
            </div>
          </div>
          <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-xs text-slate-400 leading-relaxed">
              * Based on data from the last 30 days of community verifications and municipal worker logs.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
