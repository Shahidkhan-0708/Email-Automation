import React, { useMemo } from 'react'
import {
  ArrowUp,
  CircleCheck,
  Check,
  X,
  FileUp,
  SearchCheck,
  WandSparkles,
  Send,
  Reply,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/AppContext'
import type { Personalization } from '@/lib/api'
import { CountUp, GrowingBar, Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Dial, StatusDot, Avatar, ScoreChip, EmptyState, initialsOf, Badge } from '@/components/ui'
import { replyClassColors } from '@/lib/demo'

/* ------------------------------------------------------------------ */
/* Send window activity card (Console Rail hero)                       */
/* ------------------------------------------------------------------ */

const HOUR_BARS = [38, 56, 72, 64, 81, 47, 30, 22, 16]

export const SendWindowCard: React.FC<{ className?: string }> = ({ className }) => {
  const { stats } = useApp()
  const sent = stats?.outreach.sent ?? 260
  const cap = stats?.config.dailySendLimit ?? 400
  const queued = stats?.reviewQueue ?? 0

  return (
    <Card className={className}>
      <div className="flex items-start gap-8">
        <div className="shrink-0">
          <MonoLabel>Send window</MonoLabel>
          <p className="font-display font-light text-[64px] leading-none text-ink mt-2">
            <CountUp to={sent} duration={1500} delay={300} />
          </p>
          <p className="font-mono text-[12px] text-ink-dim mt-1">/{cap} sent today</p>
          <span className="inline-flex items-center gap-1.5 mt-3 rounded-full recessed-sm px-3 py-1.5 font-mono text-[11px] text-sage-ink font-medium">
            <ArrowUp className="h-[9px] w-[9px]" /> +{queued} queued
          </span>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          {/* hourly activity graph */}
          <div className="recessed rounded-[16px] p-3">
            <div className="relative h-[108px] rounded-[10px]">
              {/* sage window 09:00–17:00 */}
              <div className="absolute top-0 bottom-[18px] rounded-[8px] bg-sage/20 ring-1 ring-sage/25" style={{ left: '37.5%', width: '33.333%' }}>
                <div className="absolute inset-x-2 bottom-0 flex items-end justify-between h-full">
                  {HOUR_BARS.map((h, i) => (
                    <div
                      key={i}
                      className={cn('w-[6px] rounded-t-[3px]', i < 6 ? 'bg-amber' : i === 6 ? 'bg-amber/55' : i === 7 ? 'bg-amber/30' : 'bg-amber/20')}
                      style={{ height: `${h}%`, transformOrigin: 'bottom', animation: `popIn 700ms cubic-bezier(0.34,1.56,0.64,1) both`, animationDelay: `${600 + i * 55}ms` }}
                    />
                  ))}
                </div>
              </div>
              {/* now marker */}
              <div className="absolute top-[-4px] bottom-[14px] w-[2px] bg-amber" style={{ left: '59.7%' }}>
                <span className="absolute -top-[5px] -left-[4px] w-[10px] h-[10px] rounded-full bg-amber pulse-dot" />
                <span className="absolute -top-[22px] -left-[13px] font-mono text-[9px] text-amber">14:22</span>
              </div>
              {/* baseline + labels */}
              <div className="absolute left-0 right-0 bottom-[16px] h-[1px] bg-shadow" />
              <div className="absolute left-0 right-0 bottom-0 flex justify-between font-mono text-[9px] text-faint">
                {['00', '03', '06', '09', '12', '15', '18', '21', '24'].map(t => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* sliders */}
          <div className="grid grid-cols-2 gap-6 mt-5">
            <SliderControl label="Per-hour cap" value="40" color="#E8A552" fill={62} />
            <SliderControl label="Cooldown" value="90s" color="#5B7DB1" fill={30} />
          </div>

          {/* stats row */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-fainter">
            <MiniStat label="peak hour" value="13:00 · 39 sent" tone="#4a4239" />
            <MiniStat label="avg gap" value="92s" tone="#4a4239" />
            <MiniStat label="bounces" value="4 · 0.6%" tone="#C4715A" />
            <MiniStat label="window ends" value="in 2h 38m" tone="#4a4239" />
          </div>
        </div>
      </div>
    </Card>
  )
}

const SliderControl: React.FC<{ label: string; value: string; color: string; fill: number }> = ({ label, value, color, fill }) => (
  <div>
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-[12px] text-ink-dim font-semibold">{label}</span>
      <span className="font-mono text-[12px]" style={{ color }}>{value}</span>
    </div>
    <div className="recessed-sm h-4 rounded-full relative">
      <div
        className="absolute left-1 top-1 bottom-1 rounded-full bar-grow"
        style={{ width: `${fill}%`, background: color, opacity: 0, animation: 'fadeIn 600ms ease 700ms forwards' }}
      />
      <span
        className="press raised-sm absolute w-6 h-6 rounded-full bg-paper top-1/2 -translate-y-1/2 -translate-x-1/2"
        style={{ left: `${fill}%` }}
      />
    </div>
  </div>
)

const MiniStat: React.FC<{ label: string; value: string; tone: string }> = ({ label, value, tone }) => (
  <div>
    <MonoLabel>{label}</MonoLabel>
    <p className="font-mono text-[13px] mt-1" style={{ color: tone }}>{value}</p>
  </div>
)

/* ------------------------------------------------------------------ */
/* Dials side column                                                    */
/* ------------------------------------------------------------------ */

export const DialCards: React.FC<{ className?: string }> = ({ className }) => {
  const { stats } = useApp()
  const delivered = stats?.outreach.sent ?? 704
  const replied = stats?.outreach.replied ?? 132
  return (
    <div className={cn('flex flex-col gap-7', className)}>
      <RiseIn delay={140}>
        <Card className="p-5 flex items-center gap-5">
          <Dial value={96} read="96.4" unit="%" color="#7FB069" delay={400} />
          <div>
            <p className="font-display text-[16px] text-ink">Delivery</p>
            <p className="font-mono text-[11px] text-faint mt-1">{delivered} delivered</p>
          </div>
        </Card>
      </RiseIn>
      <RiseIn delay={220}>
        <Card className="p-5 flex items-center gap-5">
          <Dial value={19} read="18.7" unit="%" color="#E8A552" delay={500} />
          <div>
            <p className="font-display text-[16px] text-ink">Reply</p>
            <p className="font-mono text-[11px] text-faint mt-1">{replied} replies</p>
          </div>
        </Card>
      </RiseIn>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pipeline stack (mixer bars)                                         */
/* ------------------------------------------------------------------ */

export interface StageDatum {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  value: number
}

export const PipelineStack: React.FC<{ stages: StageDatum[]; className?: string }> = ({ stages, className }) => {
  const max = Math.max(1, ...stages.map(s => s.value))
  return (
    <Card className={className}>
      <div className="flex items-end justify-between mb-5">
        <div>
          <SectionTitle>Pipeline stack</SectionTitle>
          <p className="text-[13px] text-faint mt-0.5">{stages.length} stages · last sync 3 min ago</p>
        </div>
        <MonoLabel>drop-off</MonoLabel>
      </div>
      <div className="flex flex-col gap-3.5">
        {stages.map((s, i) => {
          const pct = Math.max(1, Math.round((s.value / max) * 100))
          const prev = i > 0 ? stages[i - 1].value : 0
          const drop = i === 0 ? '—' : prev > 0 ? `${Math.round(((s.value - prev) / prev) * 100)}%` : '—'
          return (
            <div key={s.key} className="mix flex items-center gap-4">
              <span
                className={cn(
                  'w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 text-[14px]',
                  s.key === 'review' ? 'glow-amber text-amber-deep' : 'recessed-sm'
                )}
                style={s.key === 'review' ? undefined : { color: s.color }}
              >
                {s.icon}
              </span>
              <span className="font-display text-[15px] text-ink w-[124px] shrink-0">{s.label}</span>
              <div className="recessed-sm h-5 rounded-full flex-1 p-1">
                <GrowingBar width={pct} color={s.color} delay={400 + i * 70} />
              </div>
              <span
                className="font-mono text-[13px] w-[52px] text-right shrink-0 num-tabular"
                style={{ color: s.key === 'review' ? '#E8A552' : '#4a4239' }}
              >
                {s.value.toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-faint w-[42px] text-right shrink-0">{drop}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Approval list                                                        */
/* ------------------------------------------------------------------ */

export interface ApprovalItem {
  id: string
  name: string
  organization: string | null
  snippet: string
  score: number
  needsHuman?: boolean
}

export const ApprovalList: React.FC<{
  items: ApprovalItem[]
  title?: string
  sub?: string
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  footer?: React.ReactNode
  className?: string
}> = ({ items, title = 'Awaiting your approval', sub, onApprove, onReject, footer, className }) => (
  <Card className={cn('flex flex-col', className)}>
    <div className="flex items-end justify-between mb-5">
      <div>
        <SectionTitle>{title}</SectionTitle>
        {sub && <p className="text-[13px] text-faint mt-0.5">{sub}</p>}
      </div>
      <MonoLabel>confidence</MonoLabel>
    </div>
    {items.length === 0 ? (
      <EmptyState title="Queue is clear" hint="New AI personalizations will land here for your approval." />
    ) : (
      <div className="flex flex-col gap-4">
        {items.slice(0, 4).map((it, i) => (
          <div key={it.id}>
            {i > 0 && <div className="h-[1px] bg-fainter/70 mb-4" />}
            <div className="flex items-center gap-4">
              <Avatar initials={initialsOf(it.name)} tone={it.needsHuman ? 'terra' : 'default'} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink truncate">
                  {it.name}
                  {it.organization && <span className="text-faint font-normal"> · {it.organization}</span>}
                  {it.needsHuman && <Badge tone="terra" className="ml-1.5 align-middle">needs human</Badge>}
                </p>
                <p className="font-display italic font-light text-[13px] text-ink-dim truncate">“{it.snippet}”</p>
              </div>
              <ScoreChip score={it.score} />
              <Pressable
                onClick={() => onApprove?.(it.id)}
                className="press raised-sm w-9 h-9 rounded-[12px] flex items-center justify-center text-[13px] text-sage shrink-0"
                aria-label={`Approve ${it.name}`}
              >
                <Check className="h-4 w-4" />
              </Pressable>
              <Pressable
                onClick={() => onReject?.(it.id)}
                className="press raised-sm w-9 h-9 rounded-[12px] flex items-center justify-center text-[13px] text-terra shrink-0"
                aria-label={`Reject ${it.name}`}
              >
                <X className="h-4 w-4" />
              </Pressable>
            </div>
          </div>
        ))}
      </div>
    )}
    {footer}
  </Card>
)

/* build approval items from real review queue */
export function useApprovalItems(): ApprovalItem[] {
  const { reviewQueue } = useApp()
  return useMemo(
    () =>
      reviewQueue.map((p: Personalization) => {
        const profile = p.profiles
        const contact = Array.isArray(profile?.contacts) ? profile.contacts[0] : profile?.contacts
        const name = profile?.full_name || contact?.name || 'Unnamed contact'
        const org = profile?.organization || contact?.organization || '—'
        return {
          id: p.id,
          name,
          organization: org,
          snippet: p.subject || 'Draft subject',
          score: confidenceOf(p),
          needsHuman: confidenceOf(p) < 0.8,
        }
      }),
    [reviewQueue]
  )
}

export function confidenceOf(p: Personalization): number {
  // evidence-based heuristic: not stored server-side, computed for display
  const evidence = Array.isArray(p.evidence_used) ? p.evidence_used.length : 0
  const base = 0.9
  const adj = Math.min(0.06, evidence * 0.02)
  return Math.max(0.5, Math.min(0.98, base + adj - (p.status === 'pending_review' ? 0 : 0)))
}

/* ------------------------------------------------------------------ */
/* Inbound AI-classified list                                           */
/* ------------------------------------------------------------------ */

export const InboundList: React.FC<{ className?: string; title?: string }> = ({ className, title = 'Inbound' }) => {
  const { replies } = useApp()
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of replies) {
      const cat = r.ai_category || 'Unclassified'
      m.set(cat, (m.get(cat) || 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [replies])

  const max = Math.max(1, ...counts.map(([, n]) => n))

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <SectionTitle>{title}</SectionTitle>
          <MonoLabel className="mt-1">AI-classified</MonoLabel>
        </div>
        <p className="font-display font-light text-[40px] leading-none text-ink">
          <CountUp to={replies.length} duration={1400} delay={250} />
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-3.5">
        {counts.length === 0 ? (
          <EmptyState title="No replies yet" hint="Inbound mail is detected via Gmail and classified here." />
        ) : (
          counts.map(([cat, n], i) => (
            <div key={cat}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-mono text-[10px] text-ink-dim tracking-wider uppercase">{cat.replace(/_/g, ' ')}</span>
                <span className="font-mono text-[12px]" style={{ color: replyClassColors[cat] || '#a89d91' }}>
                  {n}
                </span>
              </div>
              <div className="recessed-sm h-3 rounded-full p-[3px]">
                <GrowingBar width={(n / max) * 100} color={replyClassColors[cat] || '#a89d91'} delay={350 + i * 60} />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Cinematic pipeline chain (from variant C)                           */
/* ------------------------------------------------------------------ */

export const PipelineChain: React.FC<{
  stages: { label: string; icon: React.ReactNode; value: number; color?: string; conversion?: string; pulse?: boolean }[]
  className?: string
}> = ({ stages, className }) => (
  <div className={cn('flex items-start justify-between gap-0 px-2 -mt-2', className)}>
    {stages.map((s, i) => (
      <React.Fragment key={s.label}>
        <div
          className="chain-node pop-in flex flex-col items-center w-[104px] shrink-0"
          style={{ animationDelay: `${120 + i * 70}ms` }}
        >
          <div
            className={cn(
              'node-fill w-24 h-24 rounded-full flex flex-col items-center justify-center gap-0.5',
              s.pulse && 'amber-node'
            )}
            style={
              s.pulse
                ? undefined
                : s.color === '#9fd187'
                  ? { boxShadow: '0 0 0 1px rgba(159,209,135,.8), 0 0 20px -4px rgba(127,176,105,.5)' }
                  : { boxShadow: '0 0 0 1px rgba(255,255,255,.28)' }
            }
          >
            <span style={{ color: s.color || 'rgba(255,255,255,.7)' }}>{s.icon}</span>
            <span className="font-display font-light text-[26px] leading-none text-white">
              <CountUp to={s.value} duration={1100} delay={150 + i * 40} comma />
            </span>
          </div>
          <p
            className="font-mono text-[11px] uppercase tracking-[0.14em] mt-3"
            style={{ color: s.pulse ? '#E8A552' : 'rgba(255,255,255,.6)' }}
          >
            {s.label}
          </p>
        </div>
        {i < stages.length - 1 && (
          <div className="flex-1 relative pt-[30px] min-w-[24px]">
            {s.conversion && (
              <p
                className="absolute -top-1 left-1/2 -translate-x-1/2 font-mono text-[10px]"
                style={{ color: s.color === '#f0be80' || s.color === '#9fd187' ? s.color : 'rgba(255,255,255,.55)' }}
              >
                {s.conversion}
              </p>
            )}
            <div className="relative h-[2px] connector rounded-full bg-gradient-to-r from-white/35 to-white/5">
              <span
                className="trav absolute -top-[2px] w-1.5 h-1.5 rounded-full"
                style={{
                  background: s.color === '#f0be80' || s.color === '#9fd187' ? s.color : 'rgba(255,255,255,.9)',
                  animationDelay: `${i * 0.45}s`,
                }}
              />
            </div>
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
)

/* status row used inside dashboard hero band */
export const HeroStatusRow: React.FC<{ onOpenReview: () => void; onSend: () => void }> = ({ onOpenReview, onSend }) => (
  <div className="flex items-end justify-between gap-8">
    <div>
      <p className="font-display font-light text-[34px] leading-tight text-white max-w-[15ch]">
        <QueueDraftCount /> drafts are waiting on you.
      </p>
      <div className="flex items-center gap-3 mt-5">
        <Pressable onClick={onOpenReview} className="press bg-white text-[#14202a] text-[14px] font-semibold px-6 py-3 rounded-[999px]">
          Open review queue
        </Pressable>
        <Pressable
          onClick={onSend}
          className="press text-white/85 text-[14px] font-semibold px-6 py-3 rounded-[999px]"
          style={{ border: '1px solid rgba(255,255,255,.35)' }}
        >
          Approve & send <SendCount />
        </Pressable>
      </div>
    </div>
  </div>
)

const QueueDraftCount: React.FC = () => {
  const { stats } = useApp()
  const n = stats?.reviewQueue ?? 0
  return <CountUp to={n} duration={1100} delay={200} />
}

const SendCount: React.FC = () => {
  const { reviewQueue } = useApp()
  const n = Math.min(reviewQueue.length, 38)
  return <CountUp to={n} duration={1100} delay={300} />
}

/* service health list (variant C) */
export const ServiceHealth: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('recessed rounded-[16px] p-4 flex flex-col gap-2.5', className)}>
    {[
      { name: 'Supabase', ok: true },
      { name: 'Brevo SMTP', ok: true },
      { name: 'Gmail OAuth', ok: true },
      { name: 'OpenAI', ok: true },
      { name: 'Airtable sync', ok: '4m ago' },
    ].map(s => (
      <div key={s.name} className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-dim flex items-center gap-2">
          <StatusDot color={s.ok === true ? '#7FB069' : '#E8A552'} /> {s.name}
        </span>
        <span className="font-mono text-[11px]" style={{ color: s.ok === true ? '#a89d91' : '#b8763a' }}>
          {s.ok === true ? 'ok' : s.ok}
        </span>
      </div>
    ))}
  </div>
)

/* status breakdown bars (used on outreach page) */
export const StatusBreakdown: React.FC<{ className?: string }> = ({ className }) => {
  const { stats } = useApp()
  const byStatus = Object.entries(stats?.outreach.byStatus || {}).sort((a, b) => b[1] - a[1])
  const total = stats?.outreach.total ?? 0
  return (
    <Card className={className}>
      <SectionTitle>Status breakdown</SectionTitle>
      <p className="text-[13px] text-faint mt-0.5 mb-5">{total} outreach records</p>
      {byStatus.length === 0 ? (
        <EmptyState title="No outreach records" hint="Import leads to see pipeline states." />
      ) : (
        <div className="flex flex-col gap-3">
          {byStatus.map(([status, count], i) => (
            <div key={status} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[12px] font-semibold text-ink-dim">{status}</span>
              <div className="recessed-sm h-4 rounded-full flex-1 p-[3px]">
                <GrowingBar width={total ? (count / total) * 100 : 0} color={statusColor(status)} delay={300 + i * 60} />
              </div>
              <span className="w-10 text-right font-mono text-[12px] text-ink num-tabular">{count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    Sent: '#7FB069',
    Delivered: '#7FB069',
    Ready: '#5B7DB1',
    Claimed: '#5B7DB1',
    Sending: '#E8A552',
    Replied: '#9DB8E0',
    'Follow-up 1': '#E8A552',
    'Follow-up 2': '#E8A552',
    Bounced: '#C4715A',
    Error: '#C4715A',
  }
  return map[status] || '#c2b8ab'
}

/* icon per stage */
export const stageIcon = (key: string, size = 20): React.ReactNode => {
  const common = { width: size, height: size }
  switch (key) {
    case 'import': return <FileUp {...common} />
    case 'enriched': return <SearchCheck {...common} />
    case 'personalized': return <WandSparkles {...common} style={{ color: '#f0be80' }} />
    case 'review': return <ClipboardCheck {...common} style={{ color: '#E8A552' }} />
    case 'sent': return <Send {...common} style={{ color: '#9fd187' }} />
    case 'replied': return <Reply {...common} style={{ color: '#9fd187' }} />
    default: return <CircleCheck {...common} />
  }
}
