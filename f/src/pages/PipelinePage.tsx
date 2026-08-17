import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/lib/AppContext'
import {
  PipelineChain,
  HeroStatusRow,
  PipelineStack,
  stageIcon,
} from '@/components/widgets'
import { CountUp, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Dial, ModeToggle, StatusDot, LoadingState } from '@/components/ui'
import type { ConsoleMode } from '@/components/ui'

const BAND_IMG = 'https://images.pexels.com/photos/34742289/pexels-photo-34742289.jpeg?auto=compress&cs=tinysrgb&w=1600&q=80'

export const PipelinePage: React.FC = () => {
  const { stats, loading, reviewQueue } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState<ConsoleMode>('live')

  if (loading && !stats) return <LoadingState label="Loading pipeline…" />

  const contacts = stats?.contacts ?? 0
  const enriched = Math.max(0, Math.min(contacts, Math.round(contacts * 0.86)))
  const personalized = Math.max(0, Math.min(enriched, (stats?.outreach.sent ?? 0) + reviewQueue.length))
  const inReview = reviewQueue.length || stats?.reviewQueue || 0
  const sent = stats?.outreach.sent ?? 0
  const replied = stats?.outreach.replied ?? 0

  const chain = [
    { label: 'Imported', icon: stageIcon('import'), value: contacts, conversion: '-14%' },
    { label: 'Enriched', icon: stageIcon('enriched'), value: enriched, conversion: '-14%' },
    { label: 'Personalized', icon: stageIcon('personalized', 20), value: personalized, color: '#f0be80', conversion: '-88%' },
    { label: 'In review', icon: stageIcon('review', 20), value: inReview, color: '#E8A552', pulse: true, conversion: '+6.2×' },
    { label: 'Sent', icon: stageIcon('sent', 20), value: sent, color: '#9fd187', conversion: '+18.7%' },
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
            {/* top row */}
            <div className="flex items-start justify-between">
              <div className="glass rounded-[999px] px-4 py-2 flex items-center gap-2.5">
                <StatusDot color="#9fd187" pulse />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/82">
                  Pipeline running · last tick 42s ago
                </span>
              </div>
              <p className="font-mono text-[11px] text-white/60 flex flex-wrap items-center gap-x-3 justify-end">
                <span>cron</span>
                <span>·</span>
                <span>outreach <span className="text-sage-bright">✓</span></span>
                <span>followups <span className="text-sage-bright">✓</span></span>
                <span>replies <span className="text-sage-bright">✓</span></span>
                <span>airtable 4m</span>
              </p>
            </div>

            {/* chain */}
            <PipelineChain stages={chain} />

            {/* bottom row */}
            <div className="flex items-end justify-between gap-8">
              <HeroStatusRow onOpenReview={() => navigate('/review')} onSend={() => navigate('/bulk-send')} />
              <div className="mb-1">
                <ModeToggle mode={mode} onChange={setMode} variant="banner" />
              </div>
            </div>
          </div>
        </section>
      </RiseIn>

      {/* health dials */}
      <RiseIn delay={140}>
        <Card className="px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <SectionTitle>Health</SectionTitle>
            <MonoLabel>LAST 7 DAYS · 1,284 EVENTS</MonoLabel>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <Dial value={96} read="96.4%" unit="delivered" label="Delivery" color="#7FB069" />
            <Dial value={61} read="61.2%" unit="opened" label="Open" color="#5B7DB1" delay={380} />
            <Dial value={19} read="18.7%" unit="replied" label="Reply" color="#E8A552" delay={460} />
            <Dial value={11} read="1.1%" unit="bounced" label="Bounce" color="#C4715A" delay={540} />
          </div>
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
