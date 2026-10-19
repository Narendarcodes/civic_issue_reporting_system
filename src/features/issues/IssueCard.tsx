import React, { useState } from 'react';
import { X, ChevronDown, AlertTriangle, CheckCircle2, Check, Eye, MapPin, Camera, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch, cn, getDistanceKm as getDistance, safeFormatDate, safeJson } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const IssueCard = ({ issue, onUpvote, onVerify, user, onRefresh }: any) => {
  const [showComparison, setShowComparison] = useState(false);
  const [showCommunityVote, setShowCommunityVote] = useState(false);
  const [communityVoteLoading, setCommunityVoteLoading] = useState(false);
  const [communityVoteProof, setCommunityVoteProof] = useState<File | null>(null);
  const [communityVoteComment, setCommunityVoteComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!issue) return null;

  const distance = user?.latitude && user?.longitude && issue?.latitude && issue?.longitude
    ? getDistance(user.latitude, user.longitude, issue.latitude, issue.longitude)
    : null;
  
  const isLocal = distance !== null && distance <= 5;
  const isResolved = issue.status === 'Resolved' || issue.status === 'Confirmed Resolved';
  const hasCommunityVotes = (issue.voteCountResolved || 0) > 0 || (issue.voteCountNotResolved || 0) > 0;

  const safeAddress = issue.locationAddress || 'Unknown Location';
  const safeUsername = issue.username || 'Anonymous';
  const safeDescription = issue.description || 'No description provided';

  const handleCommunityVote = async (vote: 'Resolved' | 'Not Resolved') => {
    setCommunityVoteLoading(true);
    try {
      let imageUrl = null;
      if (communityVoteProof) {
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(communityVoteProof);
        });
      }

      const res = await apiFetch('/api/communityVote', {
        method: 'POST',
        body: JSON.stringify({
          issueId: issue.id,
          vote,
          comment: communityVoteComment,
          image: imageUrl
        })
      });

      if (res.ok) {
        setShowCommunityVote(false);
        setCommunityVoteProof(null);
        setCommunityVoteComment('');
        if (onRefresh) await onRefresh();
      } else {
        const data = await safeJson(res);
        alert(data?.error || 'Failed to submit vote');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommunityVoteLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all border-slate-200/60 group">
      <div className="relative h-48 overflow-hidden">
        {issue.imageUrl ? (
          <img 
            src={issue.imageUrl} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
            <Camera size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <Badge variant="info">
              {issue.category}
            </Badge>
            {isLocal && (
              <Badge variant="success" className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20">
                <MapPin size={10} className="mr-1" /> Local
              </Badge>
            )}
          </div>
          <div className={cn("flex items-center gap-1 backdrop-blur-md rounded-lg px-2 py-1 border w-fit shadow-lg", 
            issue.priority === 'Emergency' ? "bg-red-500/80 border-red-500 text-white" : 
            issue.priority === 'High' ? "bg-orange-500/80 border-orange-500 text-white" : 
            "bg-blue-500/80 border-blue-500 text-white")}>
            <AlertTriangle size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">{issue.priority}</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">
              {safeAddress.split(',')[0]}
            </p>
            <h4 className="text-white font-bold text-lg leading-tight line-clamp-1">
              {safeDescription}
            </h4>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 border border-white/20">
            <span className="text-white text-[10px] font-bold">
              {distance !== null ? `${distance.toFixed(1)}km away` : 'Distance unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
              {(safeUsername[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{safeUsername}</p>
              <p className="text-[10px] text-slate-500">{issue.timestamp ? safeFormatDate(issue.timestamp, 'MMM d, h:mm a') : 'N/A'}</p>
            </div>
          </div>
          <Badge variant={isResolved ? 'success' : 'warning'}>
            {issue.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Community Pulse</span>
            <span>{issue.upvotes} Upvotes</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((issue.upvotes / 20) * 100, 100)}%` }}
              className={cn(
                "h-full rounded-full",
                issue.priority === 'Emergency' ? "bg-red-500" : "bg-civic-primary"
              )}
            />
          </div>
        </div>

        {hasCommunityVotes && (
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Community Verification</span>
              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check size={10} /> {issue.voteCountResolved || 0}
                </span>
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <X size={10} /> {issue.voteCountNotResolved || 0}
                </span>
              </div>
            </div>
            <div className="flex h-1 gap-0.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${((issue.voteCountResolved || 0) / ((issue.voteCountResolved || 0) + (issue.voteCountNotResolved || 0) || 1)) * 100}%` }} 
              />
              <div 
                className="bg-red-400 h-full transition-all duration-500" 
                style={{ width: `${((issue.voteCountNotResolved || 0) / ((issue.voteCountResolved || 0) + (issue.voteCountNotResolved || 0) || 1)) * 100}%` }} 
              />
            </div>
          </div>
        )}

        {issue.userId === user?.id && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracking Status</span>
              <span className="text-[10px] font-medium text-civic-primary">{issue.status}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div className={cn("h-full bg-civic-primary transition-all duration-500", 
                issue.status === 'Pending' ? 'w-1/4' : 
                issue.status === 'Assigned' ? 'w-2/4' :
                issue.status === 'In Progress' ? 'w-3/4' : 
                issue.status === 'Pending Citizen Confirmation' ? 'w-[85%]' : 
                (issue.status === 'Resolved' || issue.status === 'Confirmed Resolved') ? 'w-full' : 'w-0'
              )} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpvote?.(issue.id); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-civic-primary hover:text-white transition-all border border-slate-100"
          >
            <ThumbsUp size={18} />
            Support
          </button>
          
          {issue.status === 'Pending Citizen Confirmation' && onVerify && (
            <button 
              onClick={(e) => { e.stopPropagation(); onVerify?.(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
            >
              <CheckCircle2 size={18} />
              Verify Resolution
            </button>
          )}

          {(issue.workerImageUrl || issue.proofImageUrl) && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowComparison(!showComparison); }}
              className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-100"
              title="Compare Before/After"
            >
              <Eye size={18} />
            </button>
          )}
        </div>

        {issue.citizenVerification && (
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Reporter Verification</span>
              <Badge variant="success" className="text-[9px] py-0 px-1.5">
                {issue.citizenVerification.vote}
              </Badge>
            </div>
            {issue.citizenVerification.comment && (
              <p className="text-xs text-slate-600 italic">"{issue.citizenVerification.comment}"</p>
            )}
            {issue.citizenVerification.verificationImage && (
              <img 
                src={issue.citizenVerification.verificationImage} 
                className="w-full h-24 object-cover rounded-lg border border-emerald-200" 
                referrerPolicy="no-referrer" 
              />
            )}
          </div>
        )}

        {issue.status === 'Resolved' && !onVerify && (
          <div className="pt-2">
            <button 
              onClick={() => setShowCommunityVote(!showCommunityVote)}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              <span>Community Voting</span>
              <ChevronDown size={14} className={cn("transition-transform", showCommunityVote && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {showCommunityVote && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
                    <div className="flex gap-2">
                      <button 
                        disabled={communityVoteLoading}
                        onClick={() => handleCommunityVote('Resolved')}
                        className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100 hover:bg-emerald-100 transition-all"
                      >
                        RESOLVED ✔
                      </button>
                      <button 
                        disabled={communityVoteLoading}
                        onClick={() => handleCommunityVote('Not Resolved')}
                        className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black border border-red-100 hover:bg-red-100 transition-all"
                      >
                        NOT RESOLVED ✘
                      </button>
                    </div>
                    <div className="space-y-2">
                      <textarea 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[10px] outline-none focus:ring-2 focus:ring-civic-primary"
                        placeholder="Add a comment (optional)..."
                        value={communityVoteComment}
                        onChange={e => setCommunityVoteComment(e.target.value)}
                      />
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={e => setCommunityVoteProof(e.target.files?.[0] || null)}
                        />
                        <div className="py-2 border border-dashed border-slate-200 rounded-lg text-center bg-white">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {communityVoteProof ? communityVoteProof.name : 'Attach Proof (Optional)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {issue.communityVotes && issue.communityVotes.length > 0 && (
          <div className="pt-2 border-t border-slate-100 mt-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Community Feedback</p>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {issue.communityVotes.map((v: any, idx: number) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-700">{v.username}</span>
                    <span className={cn("text-[8px] font-bold px-1 rounded", v.vote === 'Resolved' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                      {v.vote}
                    </span>
                  </div>
                  {v.comment && <p className="text-[10px] text-slate-600 italic">"{v.comment}"</p>}
                  {v.image && <img src={v.image} className="mt-1 w-full h-16 object-cover rounded border border-slate-200" referrerPolicy="no-referrer" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showComparison && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-slate-100"
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Reported</p>
                  <img src={issue.imageUrl} className="w-full aspect-square rounded-lg object-cover border border-slate-200" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase">Worker Fix</p>
                  {issue.workerImageUrl ? (
                    <img src={issue.workerImageUrl} className="w-full aspect-square rounded-lg object-cover border border-emerald-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[9px] text-slate-400 text-center p-1">Pending</div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-red-600 uppercase">Citizen Proof</p>
                  {issue.proofImageUrl ? (
                    <img src={issue.proofImageUrl} className="w-full aspect-square rounded-lg object-cover border border-red-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[9px] text-slate-400 text-center p-1">No proof</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};
