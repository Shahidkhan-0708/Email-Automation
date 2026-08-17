import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WandSparkles, Check } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
// TODO(cleanup): variant picker shows demoVariants until the backend returns multi-variant drafts.
import { demoVariants } from '@/lib/demo'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Badge, EmptyState, LoadingState } from '@/components/ui'
import { cn } from '@/lib/utils'

export const PersonalizationPage: React.FC = () => {
  const { reviewQueue, loading, stats } = useApp()
  const navigate = useNavigate()
  const [picked, setPicked] = useState<string | null>(demoVariants[0]?.id ?? null)

  if (loading && !stats) return <LoadingState label="Loading personalization…" />

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <SectionTitle className="text-[18px]">AI multi-variant engine</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5">
              <span className="font-mono text-amber-ink">{reviewQueue.length}</span> drafts in the review queue
            </p>
          </div>
          <Pressable
            onClick={() => navigate('/review')}
            className="press raised-sm rounded-full px-5 py-2.5 text-[13px] font-semibold text-amber-ink flex items-center gap-2"
          >
            <WandSparkles className="h-4 w-4" /> Open review queue
          </Pressable>
        </Card>
      </RiseIn>

      <div className="grid grid-cols-3 gap-7 items-start">
        {demoVariants.map((v, i) => {
          const active = picked === v.id
          return (
            <RiseIn key={v.id} delay={80 + i * 80}>
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 flex flex-col h-full',
                  active ? 'ring-2 ring-amber/60' : 'hover:-translate-y-0.5'
                )}
                onClick={() => setPicked(v.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <MonoLabel>{v.label}</MonoLabel>
                  <span className="flex items-center gap-2">
                    {v.winner && <Badge tone="sage">winner</Badge>}
                    <Badge tone="neutral">{v.tone}</Badge>
                  </span>
                </div>
                <p className="font-mono text-[11px] text-amber-ink mb-3">{v.confidence.toFixed(2)} confidence</p>
                <p className="font-display italic text-[15px] text-ink leading-snug mb-3">“{v.subject}”</p>
                <p className="text-[12.5px] text-ink-soft leading-relaxed line-clamp-5 whitespace-pre-line mb-5">{v.body}</p>
                <div className="mt-auto">
                  {active ? (
                    <span className="recessed rounded-full py-2.5 w-full flex items-center justify-center text-[13px] font-bold text-sage-ink gap-2">
                      <Check className="h-4 w-4" /> Selected
                    </span>
                  ) : (
                    <span className="raised-sm rounded-full py-2.5 w-full flex items-center justify-center text-[13px] font-semibold text-ink-dim">
                      Select variant
                    </span>
                  )}
                </div>
              </Card>
            </RiseIn>
          )
        })}
      </div>

      <RiseIn delay={320}>
        <Card className="p-6">
          <SectionTitle className="text-[18px]">Queue summary</SectionTitle>
          {reviewQueue.length === 0 ? (
            <EmptyState title="Nothing pending" hint="Generated drafts land in the review queue with evidence & confidence." />
          ) : (
            <div className="flex items-center gap-3 mt-4">
              <span className="font-display font-light text-[44px] leading-none text-ink">
                {reviewQueue.length}
              </span>
              <p className="text-[13px] text-ink-dim">
                drafts awaiting your decision — approve, reject, or edit before anything is sent.
              </p>
            </div>
          )}
        </Card>
      </RiseIn>
    </div>
  )
}
