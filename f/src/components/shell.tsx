import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Gauge,
  Workflow,
  FileUp,
  Users,
  SearchCheck,
  WandSparkles,
  ClipboardCheck,
  Send,
  Inbox,
  Megaphone,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/AppContext'
import { useCountUp, Pressable, RiseIn } from '@/components/motion'
import { StatusDot, MonoLabel, ModeToggle } from '@/components/ui'
import type { ConsoleMode } from '@/components/ui'
// TODO(cleanup): activity feed is demo data until the backend exposes recent activity (roadmap M4).
import { demoActivity } from '@/lib/demo'

const MOUNTAIN_IMG = 'https://images.unsplash.com/photo-1765199873767-5359d2447b33?auto=format&w=900&q=80&fit=crop'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge, active: true },
  { to: '/pipeline', label: 'Pipeline', icon: Workflow },
  { to: '/import', label: 'Import', icon: FileUp },
  { to: '/people', label: 'People', icon: Users },
  { to: '/research', label: 'Research', icon: SearchCheck },
  { to: '/personalization', label: 'Personalization', icon: WandSparkles },
  { to: '/review', label: 'Review', icon: ClipboardCheck, badge: 'queue' },
  { to: '/outreach', label: 'Outreach', icon: Send },
  { to: '/replies', label: 'Replies', icon: Inbox, badge: 'replies' },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
]

const toneDot: Record<string, string> = { sage: '#7FB069', amber: '#E8A552', blue: '#5B7DB1', terra: '#C4715A' }

function ConsoleRail() {
  const { stats, reviewQueue, replies, bulkApproveAndSend } = useApp()
  const reviewCount = reviewQueue.length || stats?.reviewQueue || 0
  const replyCount = replies.length || 0
  const sentToday = stats?.outreach.sent ?? 260
  const cap = stats?.config.dailySendLimit ?? 400
  const pct = Math.min(100, Math.round((sentToday / cap) * 100))

  return (
    <aside className="rounded-[24px] overflow-hidden relative flex flex-col min-h-[calc(100vh-56px)]">
      <img
        alt="Layered blue mountain ridges at dusk"
        src={MOUNTAIN_IMG}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 scrim" />
      <div className="relative flex flex-col h-full p-6 pb-7">
        {/* brand */}
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
            <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
              <path d="M3.4 11.3 20 4.5l-6.6 15.9-2.2-6.1-7.8-3Z" fill="#141d26" />
              <path d="m11.2 14.3 8.4-9.6" stroke="#141d26" strokeWidth="1.2" />
            </svg>
          </span>
          <div>
            <p className="font-display text-[22px] font-normal text-white leading-none">Outreach Console</p>
          </div>
        </div>
        <p className="font-mono text-[11px] text-white/60 mt-2 ml-12">V2 · college pipeline</p>

        {/* live status */}
        <div className="mt-5 inline-flex self-start items-center gap-2 rounded-full px-3.5 py-2 bg-[rgba(20,28,34,.45)] border border-white/20 backdrop-blur-sm">
          <StatusDot color="#7FB069" pulse />
          <span className="font-mono text-[10px] tracking-[0.14em] text-white/82 uppercase">
            Live · Window 09:00–17:00
          </span>
        </div>

        {/* nav */}
        <nav className="mt-7 flex flex-col gap-[2px]">
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'nav-item relative flex items-center gap-3 pl-4 pr-3 py-[11px] rounded-[14px] text-[15px] font-semibold',
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-white" />
                    )}
                    <Icon className="w-4 text-[14px] shrink-0" />
                    {item.label}
                    {item.badge === 'queue' && reviewCount > 0 && (
                      <span className="ml-auto font-mono text-[10px] px-2 py-[3px] rounded-full bg-amber/20 text-amber border border-amber/35">
                        {reviewCount}
                      </span>
                    )}
                    {item.badge === 'replies' && replyCount > 0 && (
                      <span className="ml-auto font-mono text-[10px] px-2 py-[3px] rounded-full bg-blue/25 text-blue-soft border border-blue/40">
                        {replyCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* recent activity */}
        <div className="mt-8 pt-5 border-t border-white/12">
          <p className="font-mono text-[9px] text-white/45 tracking-[0.18em] uppercase mb-3">recent activity</p>
          <div className="flex flex-col gap-3">
            {demoActivity.map(a => (
              <div key={a.id} className="flex items-start gap-2.5">
                <span className="mt-[6px] w-[5px] h-[5px] rounded-full shrink-0" style={{ background: toneDot[a.tone] }} />
                <p className="text-[12px] text-white/60 leading-snug">
                  {a.text} <span className="font-mono text-white/40">{a.time}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* daily quota */}
        <div className="mt-auto pt-8">
          <div className="rounded-[18px] p-4 bg-[rgba(10,16,22,.42)] border border-white/12 backdrop-blur-[2px]">
            <div className="flex items-end justify-between">
              <p className="font-mono text-[20px] text-white leading-none">
                <QuotaCount to={sentToday} /> <span className="text-white/50 text-[15px]">/ {cap}</span>
              </p>
              <span className="font-mono text-[9px] text-sage-bright tracking-wider">{pct}%</span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-white/18 overflow-hidden">
              <QuotaBar pct={pct} />
            </div>
            <p className="font-mono text-[10px] text-white/60 mt-2.5 tracking-wide">daily send cap</p>
          </div>
          <Pressable
            onClick={() => bulkApproveAndSend()}
            className="press mt-4 w-full rounded-full bg-white text-[#14202a] font-semibold text-[14px] py-3 hover:-translate-y-px transition-transform"
          >
            Approve & send {stats?.reviewQueue ?? reviewCount}
          </Pressable>
          <ServiceDots />
        </div>
      </div>
    </aside>
  )
}

const QuotaCount: React.FC<{ to: number }> = ({ to }) => {
  const text = useCountUp(to, { duration: 1500, delay: 300 })
  return <span>{text}</span>
}

const QuotaBar: React.FC<{ pct: number }> = ({ pct }) => {
  const [w, setW] = useState(0)
  React.useEffect(() => {
    const t = window.setTimeout(() => setW(pct), 500)
    return () => window.clearTimeout(t)
  }, [pct])
  return (
    <div className="h-full rounded-full bg-white/65 bar-grow" style={{ width: `${w}%` }} />
  )
}

const ServiceDots: React.FC = () => (
  <div className="mt-5 flex items-start justify-between">
    {[
      { name: 'Supabase', ok: true },
      { name: 'Brevo', ok: true },
      { name: 'Gmail', ok: true },
      { name: 'OpenAI', ok: true },
      { name: 'Airtable', ok: false },
    ].map(s => (
      <div key={s.name} className="flex flex-col items-center gap-1.5">
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: s.ok ? '#7FB069' : 'rgba(255,255,255,.35)' }} />
        <span className="font-mono text-[9px] text-white/60">{s.name}</span>
      </div>
    ))}
  </div>
)

/* ------------------------------------------------------------------ */
/* Header                                                               */
/* ------------------------------------------------------------------ */

const nowLabel = () => {
  const d = new Date()
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} · ${hh}:${mm} IST`
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { stats, campaigns, refresh, loading } = useApp()
  const [mode, setMode] = useState<ConsoleMode>('live')
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'running').length
  const queued = stats?.reviewQueue ?? 0

  return (
    <div className="min-h-screen w-full bg-paper text-ink px-7 py-7 font-body">
      <div className="grid grid-cols-[300px_1fr] gap-7 items-start max-w-[1720px] mx-auto">
        <ConsoleRail />

        <main className="flex flex-col gap-7 min-w-0">
          {/* header */}
          <header className="stg flex items-start justify-between pt-2 px-1 flex-wrap gap-4">
            <div>
              <MonoLabel className="text-[12px] tracking-wide">{nowLabel()}</MonoLabel>
              <h1 className="font-display font-light text-[40px] text-ink leading-[1.1] mt-1.5">Good afternoon, Shahid</h1>
              <p className="text-[15px] text-ink-dim mt-1.5">
                {activeCampaigns} campaigns active · 41 institutions in flight · {queued} drafts cleared review
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <ModeToggle mode={mode} onChange={setMode} variant="header" />
              <Pressable
                onClick={() => refresh()}
                className="press raised-sm w-12 h-12 rounded-[16px] flex items-center justify-center text-ink-dim"
                aria-label="Refresh data"
                title="Refresh data"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Pressable>
            </div>
          </header>

          <RiseIn delay={120}>{children}</RiseIn>
        </main>
      </div>
    </div>
  )
}
