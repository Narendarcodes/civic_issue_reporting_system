import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { apiFetch, cn, safeJson } from '../../lib/utils';
import { Card } from '../../components/ui/Card';

export const LeaderboardView = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await apiFetch('/api/leaderboard');
        if (res.ok) {
          const data = await safeJson(res);
          setLeaders(data || []);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Civic Heroes...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Civic Heroes Leaderboard</h2>
        <p className="text-slate-500">Top citizens who are actively making our community better.</p>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {leaders.map((leader, idx) => (
            <div key={leader.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-600 relative">
                  {idx < 3 && (
                    <Trophy className={cn(
                      "absolute -top-2 -right-2",
                      idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-amber-600"
                    )} size={20} />
                  )}
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{leader.username}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-civic-primary uppercase tracking-wider">{leader.reputationPoints} Points</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {leaders.length === 0 && <div className="p-8 text-center text-slate-500">No data available yet.</div>}
        </div>
      </Card>
    </div>
  );
};
