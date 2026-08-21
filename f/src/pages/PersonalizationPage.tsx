import React from 'react'
import { useNavigate } from 'react-router-dom'
import { WandSparkles } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, EmptyState, LoadingState } from '@/components/ui'

export const PersonalizationPage: React.FC = () => {
  const { reviewQueue, loading, stats } = useApp()
  const navigate = useNavigate()

  if (loading && !stats) return <LoadingState label="Loading personalization…" />

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <SectionTitle className="text-[18px]">AI personalization engine</SectionTitle>
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

      <RiseIn delay={80}>
        <Card className="p-6">
          <SectionTitle className="text-[18px]">Draft generation</SectionTitle>
          <p className="text-[13px] text-faint mt-0.5 mb-5">
            Each profile gets a single evidence-cited draft, generated from its enrichment facts. Drafts land in the
            review queue — approve, reject, or edit before anything is sent.
          </p>
          <MonoLabel>model · {stats?.config.aiModel || '—'}</MonoLabel>
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
