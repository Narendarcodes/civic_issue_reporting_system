import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mail, KeyRound, ShieldCheck, Info, AlertTriangle, Building2, UserRound, MapPin, CheckCircle2 } from 'lucide-react';
import { safeJson } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { APP_NAME } from '../../lib/civic';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

interface Props { mode: 'login' | 'register'; portal: 'user' | 'admin'; onToggleMode: () => void; onBack: () => void }

async function post(url: string, body: any) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
  return data;
}

export function AuthScreen({ mode, portal, onToggleMode, onBack }: Props) {
  const admin = portal === 'admin';
  const [form, setForm] = useState({ username: '', password: '', email: '', otp: '', fullName: '', address: '', city: 'Hyderabad', postalCode: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const finish = (data: any) => {
    if (admin && data?.user?.role !== 'admin') throw new Error('This account is not an administrator. Use the citizen portal instead.');
    localStorage.setItem('civic_token', data.token);
    window.location.assign(data?.user?.role === 'admin' ? '/admin' : '/user');
  };

  const sendCode = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address.');
    if (mode === 'register' && form.fullName.trim().length < 2) return setError('Tell us your name.');
    setBusy(true);
    try {
      const d = await post('/api/send-email-otp', { email: form.email.trim() });
      setOtpSent(true);
      setDevOtp(d?.devOtp || null);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!admin && !otpSent) return sendCode();
    setBusy(true);
    try {
      if (admin) finish(await post('/api/login', { username: form.username.trim(), password: form.password }));
      else if (mode === 'login') finish(await post('/api/login', { email: form.email.trim(), otp: form.otp.trim() }));
      else finish(await post('/api/register', { ...form, email: form.email.trim(), otp: form.otp.trim() }));
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  const title = admin ? 'Officer sign in' : mode === 'login' ? 'Welcome back' : 'Create your account';
  const sub = admin ? 'For GHMC staff and ward officers.' : mode === 'login' ? 'Sign in with a one-time code sent to your email — no password to remember.' : 'Join your neighbours in getting Hyderabad fixed. Takes 30 seconds.';

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={admin ? '/demo/drainage-before.jpg' : '/demo/pothole-after.jpg'} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/75 to-slate-950/80" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <span className="inline-flex items-center gap-2.5">
            <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden><rect width="64" height="64" rx="16" fill="#fff" /><path d="M32 13c-8.3 0-15 6.5-15 14.6C17 38.5 32 51 32 51s15-12.5 15-23.4C47 19.5 40.3 13 32 13z" fill="#059669" /><path d="M25.5 28.2l4.6 4.6 8.4-8.6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="font-display text-xl font-semibold">{APP_NAME}</span>
          </span>
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-semibold leading-tight text-white">{admin ? 'Every complaint, every deadline, one console.' : 'Snap it. Pin it. Watch it get fixed.'}</h2>
            <ul className="mt-8 space-y-4 text-[15px] text-emerald-50/90">
              {(admin
                ? [[Building2, 'Route tickets to the right crew in a click'], [ShieldCheck, 'Close with before/after photo proof'], [MapPin, 'See hotspots and SLA breaches on a live map']]
                : [[MapPin, 'Report with a photo and exact GPS pin'], [UserRound, 'Neighbours upvote and verify — no duplicates'], [CheckCircle2, 'Public deadlines, before/after proof of every fix']]
              ).map(([Icon, t]: any) => (
                <li key={t} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/20"><Icon size={17} /></span>{t}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-emerald-100/70">Built for Hyderabad · Works on any phone · Free for citizens</p>
        </div>
      </aside>

      {/* Form */}
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg"><ArrowLeft size={16} />Home</button>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <div className="lg:hidden mb-8"><Logo sub={admin ? 'Admin console' : undefined} /></div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            {admin && <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-fg-muted ring-1 ring-line"><ShieldCheck size={13} />Staff only</span>}
            <h1 className="text-[28px] font-semibold leading-tight">{title}</h1>
            <p className="mt-2 text-[15px] text-fg-muted">{sub}</p>

            {!admin && (
              <div className="mt-6 grid grid-cols-2 rounded-[var(--radius-md)] border border-line bg-surface-muted p-1" role="tablist" aria-label="Sign in or register">
                {(['login', 'register'] as const).map(m => (
                  <button key={m} role="tab" aria-selected={mode === m} onClick={() => { if (mode !== m) { onToggleMode(); setOtpSent(false); setError(''); } }}
                    className={cn('h-9 rounded-[calc(var(--radius-md)-4px)] text-sm font-semibold transition-colors', mode === m ? 'bg-surface text-fg shadow-[var(--shadow-e1)]' : 'text-fg-muted hover:text-fg')}>
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {admin ? (
                <>
                  <div><label htmlFor="a-user" className="label">Username</label><Input id="a-user" autoComplete="username" value={form.username} onChange={set('username')} placeholder="e.g. ghmc.admin" required /></div>
                  <div><label htmlFor="a-pass" className="label">Password</label><Input id="a-pass" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} placeholder="••••••••" required /></div>
                </>
              ) : (
                <>
                  {mode === 'register' && (
                    <div><label htmlFor="r-name" className="label">Full name</label><Input id="r-name" autoComplete="name" value={form.fullName} onChange={set('fullName')} disabled={otpSent} placeholder="Priya Reddy" /></div>
                  )}
                  <div>
                    <label htmlFor="c-email" className="label">Email</label>
                    <div className="relative">
                      <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
                      <Input id="c-email" type="email" autoComplete="email" className="pl-9" value={form.email} onChange={set('email')} disabled={otpSent} placeholder="you@example.com" />
                    </div>
                  </div>
                  {mode === 'register' && !otpSent && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><label htmlFor="r-addr" className="label">Street / area <span className="font-normal text-fg-subtle">(optional)</span></label><Input id="r-addr" autoComplete="street-address" value={form.address} onChange={set('address')} placeholder="Road No. 12, Banjara Hills" /></div>
                      <div><label htmlFor="r-city" className="label">City</label><Input id="r-city" autoComplete="address-level2" value={form.city} onChange={set('city')} /></div>
                      <div><label htmlFor="r-pin" className="label">PIN code</label><Input id="r-pin" inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={set('postalCode')} placeholder="500034" /></div>
                    </div>
                  )}
                  <AnimatePresence>
                    {otpSent && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
                        <p className="text-[13px] text-fg-muted">We sent a 6-digit code to <span className="font-semibold text-fg">{form.email}</span>. <button type="button" className="font-semibold text-brand hover:underline" onClick={() => { setOtpSent(false); setForm(f => ({ ...f, otp: '' })); }}>Change</button></p>
                        {devOtp && (
                          <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-sky-200 bg-sky-50 p-3 text-[13px] text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-200" role="status">
                            <Info size={16} className="mt-0.5 shrink-0" />
                            <span>Local dev mode — email isn't configured, so here is your code: <span className="font-mono font-bold tracking-widest">{devOtp}</span>. <button type="button" className="font-semibold underline" onClick={() => setForm(f => ({ ...f, otp: devOtp }))}>Fill it in</button></span>
                          </div>
                        )}
                        <div>
                          <label htmlFor="c-otp" className="label">Verification code</label>
                          <div className="relative">
                            <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
                            <Input id="c-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="pl-9 font-mono text-lg tracking-[0.5em]" value={form.otp} onChange={set('otp')} placeholder="••••••" autoFocus />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {error && <p role="alert" className="flex items-start gap-2 rounded-[var(--radius-md)] bg-danger-soft p-3 text-[13px] font-medium text-danger"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}</p>}

              <Button type="submit" size="lg" className="w-full" loading={busy}>
                {admin ? 'Sign in to console' : !otpSent ? 'Email me a code' : mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-fg-muted">
              {admin ? <>Not staff? <a href="/user" className="font-semibold text-brand hover:underline">Go to the citizen app</a></> : <>Work for GHMC? <a href="/admin" className="font-semibold text-brand hover:underline">Officer sign in</a></>}
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
