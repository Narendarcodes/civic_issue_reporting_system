import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Card } from '../../components/ui/Card';

import { IssueCard } from '../issues/IssueCard';
import { VerificationModal } from '../issues/VerificationModal';

export const MyReports = ({ issues = [], user, onRefresh }: any) => {
  const [votingIssue, setVotingIssue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'New' | 'In-Progress' | 'Completed'>('New');

  // Ensure we are only looking at the user's issues with safe array logic
  const myIssues = (Array.isArray(issues) ? issues : []).filter((i: any) => i && i.userId === user?.id);

  const displayedIssues = useMemo(() => {
    return myIssues.filter(i => {
      if (activeTab === 'New') return i.status === 'Pending' || i.status === 'Assigned';
      if (activeTab === 'In-Progress') return i.status === 'In-Progress' || i.status === 'In Progress' || i.status === 'Pending Citizen Confirmation';
      if (activeTab === 'Completed') return i.status === 'Resolved' || i.status === 'Confirmed Resolved';
      return false;
    });
  }, [myIssues, activeTab]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">My Civic Reports</h2>
          <p className="text-slate-500">Track the progress of issues you've reported.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-sm font-bold text-slate-900">{myIssues.length} Reports</span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {(['New', 'In-Progress', 'Completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-4 px-2 text-sm font-bold transition-all border-b-2",
              activeTab === tab 
                ? "border-civic-primary text-civic-primary" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {displayedIssues.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <History size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No {activeTab} reports</h3>
          <p className="text-slate-500 mb-6">You don't have any reports in this category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedIssues.map((issue: any) => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              user={user}
              onRefresh={onRefresh}
              onVerify={() => setVotingIssue(issue)}
            />
          ))}
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
