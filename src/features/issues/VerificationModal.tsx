import React, { useState } from 'react';
import { X, Check, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch, cn, safeJson } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const VerificationModal = ({ issue, onClose, onVoteSuccess }: any) => {
  const [voteData, setVoteData] = useState({ vote: 'Resolved Properly', comment: '' });
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety Check: Not Resolved MUST have photo
    if (voteData.vote === 'Not Resolved' && !proofImage) {
      return alert('A photo proof is required when marking an issue as Not Resolved.');
    }

    setLoading(true);
    try {
      let finalProofUrl = null;
      if (proofImage) {
        const formData = new FormData();
        formData.append('image', proofImage);
        
        const token = localStorage.getItem('civic_token');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await safeJson(uploadRes);
          finalProofUrl = uploadData?.imageUrl;
        } else {
          throw new Error('Verification image upload failed');
        }
      }

      const res = await apiFetch(`/api/issues/${issue.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          isResolved: voteData.vote === 'Resolved Properly',
          feedback: voteData.comment,
          verificationImage: finalProofUrl
        })
      });

      if (res.ok) {
        alert('Verification submitted successfully!');
        await onVoteSuccess();
      } else {
        const data = await safeJson(res);
        alert(data?.error || 'Failed to submit verification');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      alert(err.message || 'An error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="max-w-xl w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side: Context */}
          <div className="bg-slate-50 p-8 border-r border-slate-100">
            <Badge variant="info" className="mb-4">Verification Mission</Badge>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Help Verify the Fix</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Your feedback helps ensure that civic issues are resolved to the highest standard. Please compare the reported issue with the current state.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original Report</p>
                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  {issue.imageUrl ? (
                    <img src={issue.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={32} /></div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Worker Update</p>
                <div className="aspect-video rounded-2xl overflow-hidden border border-emerald-100 bg-emerald-50 flex items-center justify-center">
                  {issue.workerImageUrl ? (
                    <img src={issue.workerImageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium">Marked as fixed by team</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Action */}
          <div className="p-8 flex flex-col">
            <div className="flex-1">
              <form onSubmit={handleVote} className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Is it resolved properly?</label>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      type="button"
                      onClick={() => setVoteData({ ...voteData, vote: 'Resolved Properly' })}
                      className={cn(
                        "flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all text-left", 
                        voteData.vote === 'Resolved Properly' 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                          : "border-slate-100 hover:border-slate-200 text-slate-500"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", voteData.vote === 'Resolved Properly' ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200")}>
                        {voteData.vote === 'Resolved Properly' && <Check size={14} />}
                      </div>
                      <span className="font-bold">Yes, it's fixed!</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setVoteData({ ...voteData, vote: 'Not Resolved' })}
                      className={cn(
                        "flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all text-left", 
                        voteData.vote === 'Not Resolved' 
                          ? "border-red-500 bg-red-50 text-red-700" 
                          : "border-slate-100 hover:border-slate-200 text-slate-500"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", voteData.vote === 'Not Resolved' ? "border-red-500 bg-red-500 text-white" : "border-slate-200")}>
                        {voteData.vote === 'Not Resolved' && <X size={14} />}
                      </div>
                      <span className="font-bold">No, still an issue.</span>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">
                      Upload Proof {voteData.vote === 'Not Resolved' ? '(Required)' : '(Optional)'}
                    </label>
                    <div className={cn(
                      "border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer relative",
                      voteData.vote === 'Not Resolved' 
                        ? "border-red-200 bg-red-50/30 hover:border-red-400" 
                        : "border-slate-200 bg-slate-50/30 hover:border-civic-primary"
                    )}>
                      <input 
                        type="file" 
                        required={voteData.vote === 'Not Resolved'} 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={e => setProofImage(e.target.files?.[0] || null)} 
                      />
                      <Camera className={cn("mx-auto mb-2", voteData.vote === 'Not Resolved' ? "text-red-400" : "text-slate-400")} size={24} />
                      <p className={cn("text-xs font-medium", voteData.vote === 'Not Resolved' ? "text-red-500" : "text-slate-500")}>
                        {proofImage ? proofImage.name : 'Take a photo of the current state'}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Additional Feedback</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-civic-primary bg-slate-50/50"
                    rows={3}
                    placeholder="Any comments for the team?"
                    value={voteData.comment}
                    onChange={e => setVoteData({ ...voteData, comment: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={loading} className="flex-1 rounded-2xl py-4 shadow-lg shadow-civic-primary/20">
                    {loading ? 'Submitting...' : 'Submit Verification'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
