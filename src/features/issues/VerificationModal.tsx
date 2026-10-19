import React, { useState } from 'react';
import { Check, X, Camera, ImagePlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, uploadImage } from '../../lib/api';
import { useApp } from '../../app/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { ClosureProof } from './ClosureProof';

/** Reporter confirms (or rejects) the crew's fix. "Not fixed" requires a photo. */
export function VerificationModal({ issue, open, onClose }: { issue: any; open: boolean; onClose: () => void }) {
  const { refresh, refreshMe } = useApp();
  const toast = useToast();
  const [choice, setChoice] = useState<'yes' | 'no'>('yes');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = (f: File | null) => { setFile(f); setPreview(f ? URL.createObjectURL(f) : null); setError(''); };

  const submit = async () => {
    if (choice === 'no' && !file) return setError('Add a photo of the current state so the crew can see what is still wrong.');
    setBusy(true);
    try {
      const verificationImage = file ? await uploadImage(file) : null;
      await api(`/api/issues/${issue.id}/confirm`, { method: 'POST', body: { isResolved: choice === 'yes', feedback: comment, verificationImage } });
      await refresh(); refreshMe();
      toast(choice === 'yes'
        ? { tone: 'success', title: 'Thanks for confirming the fix', body: '+55 reputation points added to your profile.' }
        : { tone: 'info', title: 'Issue reopened', body: 'The crew has been notified with your photo.' });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Is it really fixed?" labelledBy="verify-title" className="max-w-xl">
      <div className="space-y-5 p-5">
        <p className="text-sm text-fg-muted">The crew marked your report as resolved. Compare the photos — you have the final word.</p>
        <ClosureProof issue={issue} compact />
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Was it fixed?">
          {([['yes', 'Yes, it’s fixed', Check, 'border-brand bg-brand-soft text-brand-strong'], ['no', 'No, still a problem', X, 'border-danger bg-danger-soft text-danger']] as const).map(([v, label, Icon, on]) => (
            <button key={v} role="radio" aria-checked={choice === v} onClick={() => setChoice(v)}
              className={cn('flex items-center gap-2.5 rounded-[var(--radius-md)] border-2 px-3.5 py-3 text-sm font-semibold transition-colors', choice === v ? on : 'border-line text-fg-muted hover:border-line-strong')}>
              <span className={cn('grid h-6 w-6 place-items-center rounded-full', choice === v ? 'bg-current/10' : 'bg-surface-muted')}><Icon size={14} strokeWidth={3} /></span>
              {label}
            </button>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="verify-photo">Current photo {choice === 'no' ? <span className="text-danger">(required)</span> : <span className="text-fg-subtle font-normal">(optional)</span>}</label>
          <label htmlFor="verify-photo" className={cn('flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed p-3 hover:bg-surface-muted', choice === 'no' && !file ? 'border-danger/50' : 'border-line-strong')}>
            {preview ? <img src={preview} alt="Your verification photo" className="h-14 w-14 rounded-[var(--radius-sm)] object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-[var(--radius-sm)] bg-surface-muted text-fg-subtle"><Camera size={20} /></span>}
            <span className="text-sm text-fg-muted">{file ? file.name : 'Take or choose a photo of the spot today'}</span>
            <ImagePlus size={18} className="ml-auto text-fg-subtle" />
          </label>
          <input id="verify-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => pick(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="label" htmlFor="verify-comment">Note for the crew <span className="text-fg-subtle font-normal">(optional)</span></label>
          <Textarea id="verify-comment" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="e.g. Patched well, but the edges are already cracking" />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={busy} variant={choice === 'no' ? 'danger' : 'primary'}>{choice === 'yes' ? 'Confirm fix' : 'Reopen issue'}</Button>
        </div>
      </div>
    </Modal>
  );
}
