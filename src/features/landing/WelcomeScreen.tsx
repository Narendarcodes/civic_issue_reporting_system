import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Camera, MapPin, ThumbsUp, ShieldCheck, ArrowRight, Timer, Copy, MapPinned, Sparkles, Building2, CheckCircle2, Github, Database, Menu, X,
} from 'lucide-react';
import { APP_NAME } from '../../lib/civic';
import { Logo } from '../../components/ui/Logo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { cn } from '../../lib/utils';

const fade = (d = 0) => ({ initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.25, delay: d, ease: [0.22, 1, 0.36, 1] as any } });

const STEPS = [
  { icon: Camera, title: 'Snap', body: 'Take a photo of the pothole, garbage pile or dead streetlight. GPS is read straight from the photo.' },
  { icon: MapPin, title: 'Pin & send', body: 'Confirm the exact spot on the map and pick a category. Under a minute, start to finish.' },
  { icon: ThumbsUp, title: 'Neighbours verify', body: 'People nearby upvote instead of duplicating. Three confirmations and it’s verified.' },
  { icon: ShieldCheck, title: 'Fixed — with proof', body: 'Crews close tickets with an after photo. You confirm the fix, or reopen it.' },
];
const FEATURES = [
  { icon: Timer, title: 'Public fix-by deadlines', body: 'Every category has an SLA. Each report shows a live countdown, and anything late lands on the city’s overdue wall.' },
  { icon: Copy, title: 'No more duplicate reports', body: 'Reporting the same pothole twice? We show the existing ticket within 100 m and let you upvote it instead.' },
  { icon: MapPinned, title: 'Ward scorecards', body: 'Resolution rate, time to fix and missed deadlines for every area — computed live from public data.' },
  { icon: Sparkles, title: 'Before/after closure proof', body: 'Crews must upload an after photo. With Gemini configured, AI compares both; otherwise it’s queued for manual review.' },
];

export function WelcomeScreen() {
  const [stats, setStats] = useState<{ total: number; resolved: number; citizens?: number; avgResolutionHours?: number | null } | null>(null);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    fetch('/api/public/stats').then(r => (r.ok ? r.json() : null)).then(d => d && typeof d.total === 'number' && setStats(d)).catch(() => {});
  }, []);
  const rate = stats && stats.total ? Math.round((stats.resolved / stats.total) * 100) : null;

  return (
    <div className="min-h-screen bg-bg text-fg overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass-overlay border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <a href="/" aria-label={`${APP_NAME} home`}><Logo /></a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-fg-muted" aria-label="Sections">
            <a href="#how" className="hover:text-fg">How it works</a>
            <a href="#proof" className="hover:text-fg">Proof</a>
            <a href="#features" className="hover:text-fg">Features</a>
            <a href="#cities" className="hover:text-fg">For cities</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <a href="/admin" className="hidden sm:inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg">Officer login</a>
            <a href="/user" className="btn-primary hidden sm:inline-flex h-9 py-0">Report an issue</a>
            <button className="md:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-surface-muted" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>{menu ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {menu && (
          <nav className="md:hidden border-t border-line px-5 py-3 space-y-1 text-sm font-semibold" aria-label="Mobile">
            {[['#how', 'How it works'], ['#proof', 'Proof'], ['#features', 'Features'], ['#cities', 'For cities'], ['/admin', 'Officer login']].map(([h, l]) => (
              <a key={h} href={h} onClick={() => setMenu(false)} className="block rounded-[var(--radius-md)] px-3 py-2.5 text-fg-muted hover:bg-surface-muted">{l}</a>
            ))}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_80%_-10%,color-mix(in_srgb,var(--brand)_16%,transparent),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-16 lg:grid-cols-[1fr_1.15fr] lg:pt-20 lg:pb-24">
          <div>
            <motion.span {...fade()} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-fg-muted shadow-[var(--shadow-e1)]">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Live in Hyderabad · free for citizens
            </motion.span>
            <motion.h1 {...fade(0.04)} className="mt-5 text-[42px] leading-[1.04] sm:text-[56px] font-semibold tracking-tight">
              Report it.<br />Track it.<br /><span className="text-brand">Get it fixed.</span>
            </motion.h1>
            <motion.p {...fade(0.08)} className="mt-5 max-w-lg text-[17px] leading-relaxed text-fg-muted">
              {APP_NAME} turns a photo of a pothole, garbage pile or broken streetlight into a public ticket with a GPS pin, a fix-by deadline and before/after proof when it's done.
            </motion.p>
            <motion.div {...fade(0.12)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/user" className="btn-primary h-12 px-6 text-[15px]"><Camera size={18} />Report an issue</a>
              <a href="#how" className="btn-secondary h-12 px-6 text-[15px]">See how it works <ArrowRight size={16} /></a>
            </motion.div>
            <motion.dl {...fade(0.16)} className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                [stats ? stats.total.toLocaleString('en-IN') : '—', 'issues reported'],
                [rate !== null ? `${rate}%` : '—', 'resolved'],
                [stats?.avgResolutionHours ? `${stats.avgResolutionHours} h` : '—', 'avg. time to fix'],
              ].map(([v, l]) => (
                <div key={l}><dt className="sr-only">{l}</dt><dd className="font-display text-[26px] font-semibold tabular-nums">{v}</dd><p className="text-xs text-fg-muted">{l}</p></div>
              ))}
            </motion.dl>
          </div>

          {/* Product visual: real screenshots of the app */}
          <motion.div {...fade(0.1)} className="relative">
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface shadow-[var(--shadow-e3)]">
              <div className="flex items-center gap-1.5 border-b border-line bg-surface-muted px-3 py-2.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 h-5 flex-1 max-w-[260px] rounded-full bg-surface text-[10px] leading-5 px-3 text-fg-subtle">civisnap.app/admin</span>
              </div>
              <img src="/landing/hero-admin.png" alt={`${APP_NAME} admin console: city overview with live complaint map, overdue wall and KPIs`} className="block w-full" />
            </div>
            <div className="absolute -bottom-10 -left-4 sm:-left-10 w-[34%] min-w-[150px] overflow-hidden rounded-[28px] border-[6px] border-slate-900 bg-slate-900 shadow-[var(--shadow-e3)]">
              <img src="/landing/hero-mobile.png" alt={`${APP_NAME} citizen app on a phone: report stepper`} className="block w-full rounded-[22px]" />
            </div>
            <div className="absolute -right-2 -top-6 sm:-right-6 hidden sm:flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-3 pr-4 shadow-[var(--shadow-e3)]">
              <img src="/demo/pothole-after.jpg" alt="" className="h-11 w-11 rounded-[var(--radius-sm)] object-cover" />
              <div><p className="text-[13px] font-semibold">Pothole fixed in 41 h</p><p className="text-xs text-brand font-semibold flex items-center gap-1"><CheckCircle2 size={12} />Confirmed by 4 neighbours</p></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <motion.p {...fade()} className="eyebrow">How it works</motion.p>
          <motion.h2 {...fade(0.04)} className="mt-2 max-w-2xl text-3xl sm:text-4xl font-semibold">From photo to fixed, in four public steps.</motion.h2>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, k) => {
              const Icon = s.icon;
              return (
                <motion.li key={s.title} {...fade(0.05 * k)} className="relative rounded-[var(--radius-xl)] border border-line bg-bg p-6">
                  <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-fg-subtle/25">{k + 1}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-brand"><Icon size={20} /></span>
                  <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Proof */}
      <section id="proof" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <motion.p {...fade()} className="eyebrow">Closure proof</motion.p>
            <motion.h2 {...fade(0.04)} className="mt-2 text-3xl sm:text-4xl font-semibold">“Resolved” means a photo, not a checkbox.</motion.h2>
            <motion.p {...fade(0.08)} className="mt-4 text-[15px] leading-relaxed text-fg-muted">Crews close a ticket by uploading an after photo from the same spot. The reporter gets the final word, and neighbours can verify too. No more tickets closed from an office chair.</motion.p>
            <motion.ul {...fade(0.12)} className="mt-6 space-y-3 text-sm">
              {['Before/after side by side on every closed issue', 'Reporter confirms or reopens with a photo', 'Optional Gemini check flags mismatched photos'].map(t => (
                <li key={t} className="flex items-center gap-2.5"><CheckCircle2 size={17} className="text-brand" />{t}</li>
              ))}
            </motion.ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['pothole', 'Pothole · Madhapur', '41 h'], ['garbage', 'Garbage · Kukatpally', '19 h']].map(([k, label, t], i) => (
              <motion.figure key={k} {...fade(0.06 * i)} className="overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface shadow-[var(--shadow-e2)]">
                <div className="grid grid-cols-2">
                  <div className="relative"><img src={`/demo/${k}-before.jpg`} alt={`${label} before`} className="aspect-[3/4] w-full object-cover" /><span className="absolute left-2 top-2 rounded-full bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Before</span></div>
                  <div className="relative"><img src={`/demo/${k}-after.jpg`} alt={`${label} after`} className="aspect-[3/4] w-full object-cover" /><span className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">After</span></div>
                </div>
                <figcaption className="flex items-center justify-between px-4 py-3 text-[13px]"><span className="font-semibold">{label}</span><span className="text-brand font-semibold">Fixed in {t}</span></figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <motion.p {...fade()} className="eyebrow">Built for accountability</motion.p>
          <motion.h2 {...fade(0.04)} className="mt-2 max-w-2xl text-3xl sm:text-4xl font-semibold">Everything a city needs to be held to its word.</motion.h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, k) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} {...fade(0.04 * k)} className="flex gap-4 rounded-[var(--radius-xl)] border border-line bg-bg p-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-brand"><Icon size={20} /></span>
                  <div><h3 className="text-lg font-semibold">{f.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.body}</p></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact + cities CTA */}
      <section id="cities" className="mx-auto max-w-6xl px-5 py-20">
        <motion.div {...fade()} className="relative overflow-hidden rounded-[28px] bg-emerald-950 px-6 py-14 text-white sm:px-14">
          <img src="/demo/streetlight-after.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/90 to-emerald-950/40" />
          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">For GHMC & ward officers</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">One console for every complaint in the city.</h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-emerald-50/85">Clustered live map and heatmap, an overdue wall sorted by breach, kanban triage, crew assignment and analytics — with an open data API for journalists and researchers.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/admin" className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 text-[15px] font-semibold text-emerald-900 hover:bg-emerald-50"><Building2 size={18} />Open the admin console</a>
                <a href="/api/public/data" className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/30 px-6 text-[15px] font-semibold text-white hover:bg-white/10"><Database size={18} />Open data API</a>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                [stats ? stats.total : '—', 'Reports filed'],
                [stats ? stats.resolved : '—', 'Fixed with proof'],
                [stats?.citizens ?? '—', 'Active citizens'],
                [rate !== null ? `${rate}%` : '—', 'Resolution rate'],
              ].map(([v, l]) => (
                <div key={l as string} className="rounded-[var(--radius-lg)] bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                  <dd className="font-display text-3xl font-semibold tabular-nums text-white">{v}</dd><dt className="mt-1 text-xs text-emerald-100/80">{l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>Built in Hyderabad for citizens and the people who fix the city.</p>
          <a href="https://github.com/Narendarcodes/civic_issue_reporting_system" className={cn('inline-flex items-center gap-1.5 font-semibold hover:text-fg')}><Github size={16} />Source</a>
        </div>
      </footer>
    </div>
  );
}
