import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/lib/AppContext'
import {
  PipelineChain,
  HeroStatusRow,
  PipelineStack,
  stageIcon,
} from '@/components/widgets'
import { CountUp, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Dial, StatusDot, LoadingState } from '@/components/ui'

const BAND_IMG = 'https://images.pexels.com/photos/34742289/pexels-photo-34742289.jpeg?auto=compress&cs=tinysrgb&w=1600&q=80'

const HealthDial: React.FC<{ label: string; value: number; read: string; unit: string; color: string; delay?: number }> = ({
  label, value, read, unit, color, delay,
}) => (
  <Dial value={value} read={read} unit={unit} label={label} color={color} delay={delay} />
)

export const PipelinePage: React.FC = () => {
  const { stats, loading, reviewQueue, profiles } = useApp()
  const navigate = useNavigate()

  if (loading && !stats) return <LoadingState label="Loading pipeline…" />

  const contacts = stats?.contacts ?? 0
  // Real counts: profiles with enrichment facts / any personalization draft.
  const enriched = profiles.filter(p => p.enrichmentCount > 0).length
  const personalized = profiles.filter(p => p.personalizationStatus != null).length
  const inReview = reviewQueue.length || stats?.reviewQueue || 0
  const sent = stats?.outreach.sent ?? 0
  const replied = stats?.outreach.replied ?? 0
  // Delivery/bounce rates come from the backend's canonical computation
  // (single query, delivered <= sent enforced) — never re-derived here.
  const deliveryPct = stats?.outreach.delivery?.deliveryRate ?? 0
  const bouncePct = stats?.outreach.delivery?.bounceRate ?? 0
  const replyPct = stats?.outreach.delivery?.replyRate ?? (sent > 0 ? Math.round((replied / sent) * 100) : 0)

  const chain = [
    { label: 'Imported', icon: stageIcon('import'), value: contacts },
    { label: 'Enriched', icon: stageIcon('enriched'), value: enriched },
    { label: 'Personalized', icon: stageIcon('personalized', 20), value: personalized, color: '#f0be80' },
    { label: 'In review', icon: stageIcon('review', 20), value: inReview, color: '#E8A552', pulse: true },
    { label: 'Sent', icon: stageIcon('sent', 20), value: sent, color: '#9fd187' },
    { label: 'Replied', icon: stageIcon('replied', 20), value: replied, color: '#9fd187' },
  ]

  const stack = [
    { key: 'import', label: 'Imported', icon: stageIcon('import', 14), color: '#5B7DB1', value: contacts },
    { key: 'enriched', label: 'Enriched', icon: stageIcon('enriched', 14), color: '#5B7DB1', value: enriched },
    { key: 'personalized', label: 'Personalized', icon: stageIcon('personalized', 14), color: '#E8A552', value: personalized },
    { key: 'review', label: 'In review', icon: stageIcon('review', 14), color: '#E8A552', value: inReview },
    { key: 'sent', label: 'Sent', icon: stageIcon('sent', 14), color: '#7FB069', value: sent },
    { key: 'replied', label: 'Replied', icon: stageIcon('replied', 14), color: '#7FB069', value: replied },
  ]

  return (
    <div className="flex flex-col gap-7">
      {/* cinematic band */}
      <RiseIn>
        <section className="relative rounded-[28px] overflow-hidden h-[400px]">
          <img alt="Layered dusk mountain ridges" src={BAND_IMG} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 scrim" />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(120% 90% at 50% 45%, rgba(8,12,17,0) 35%, rgba(8,12,17,.45) 100%)' }}
          />
          <div className="relative h-full flex flex-col justify-between px-8 py-7">
            {/* top row */}              <div className="flex items-start justify-between">
              <div className="glass rounded-[999px] px-4 py-2 flex items-center gap-2.5">
                <StatusDot color="#9fd187" pulse />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/82">
                  Pipeline running · live API data
                </span>
              </div>
              <p className="font-mono text-[11px] text-white/60 flex flex-wrap items-center gap-x-3 justify-end">
                <span>jobs</span>
                <span>·</span>
                <span>outreach daily</span>
                <span>follow-ups daily</span>
                <span>replies 15m</span>
                <span>import 2m</span>
              </p>
            </div>

            {/* chain */}
            <PipelineChain stages={chain} />

            {/* bottom row */}
            <div className="flex items-end justify-between gap-8">
              <HeroStatusRow onOpenReview={() => navigate('/review')} onSend={() => navigate('/bulk-send')} />
            </div>
          </div>
        </section>
      </RiseIn>

      {/* health dials — real rates from outreach delivery_status / reply counts */}
      <RiseIn delay={140}>
        <Card className="px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <SectionTitle>Health</SectionTitle>
            <MonoLabel>LIVE · {stats?.outreach.total ?? 0} OUTREACH RECORDS</MonoLabel>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <HealthDial label="Delivery" value={deliveryPct} read={sent > 0 ? `${deliveryPct}%` : '—'} unit="confirmed" color="#7FB069" />
            <HealthDial label="Reply" value={replyPct} read={sent > 0 ? `${replyPct}%` : '—'} unit="replied" color="#E8A552" delay={380} />
            <HealthDial label="Bounce" value={bouncePct} read={sent > 0 ? `${bouncePct}%` : '—'} unit="bounced" color="#C4715A" delay={460} />
          </div>
          <p className="font-mono text-[10px] text-faint mt-4">
            Open rate is not tracked — SMTP has no read receipts.
          </p>
        </Card>
      </RiseIn>

      {/* pipeline stack */}
      <RiseIn delay={220}>
        <PipelineStack stages={stack} />
      </RiseIn>

      <p className="font-mono text-[10px] text-faint px-1">
        <CountUp to={contacts} delay={400} /> contacts · <CountUp to={inReview} delay={500} /> awaiting review ·{' '}
        <CountUp to={replied} delay={600} /> replies classified
      </p>
    </div>
  )
}
