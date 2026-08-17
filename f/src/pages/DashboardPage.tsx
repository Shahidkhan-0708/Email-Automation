import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/lib/AppContext'
import {
  SendWindowCard,
  DialCards,
  PipelineStack,
  ApprovalList,
  useApprovalItems,
  InboundList,
  stageIcon,
} from '@/components/widgets'
import { RiseIn } from '@/components/motion'
import { LoadingState } from '@/components/ui'

export const DashboardPage: React.FC = () => {
  const { stats, loading, reviewQueue, approve, reject } = useApp()
  const navigate = useNavigate()
  const approvalItems = useApprovalItems()

  if (loading && !stats) return <LoadingState label="Loading overview…" />

  const contacts = stats?.contacts ?? 0
  const enriched = Math.max(0, Math.min(contacts, Math.round(contacts * 0.86)))
  const personalized = Math.max(0, Math.min(enriched, (stats?.outreach.sent ?? 0) + reviewQueue.length))
  const inReview = reviewQueue.length || stats?.reviewQueue || 0
  const sent = stats?.outreach.sent ?? 0
  const replied = stats?.outreach.replied ?? 0

  const stages = [
    { key: 'import', label: 'Imported', icon: stageIcon('import'), color: '#5B7DB1', value: contacts },
    { key: 'enriched', label: 'Enriched', icon: stageIcon('enriched'), color: '#5B7DB1', value: enriched },
    { key: 'personalized', label: 'Personalized', icon: stageIcon('personalized'), color: '#E8A552', value: personalized },
    { key: 'review', label: 'In review', icon: stageIcon('review'), color: '#E8A552', value: inReview },
    { key: 'sent', label: 'Sent', icon: stageIcon('sent'), color: '#7FB069', value: sent },
    { key: 'replied', label: 'Replied', icon: stageIcon('replied'), color: '#7FB069', value: replied },
  ]

  return (
    <div className="flex flex-col gap-7">
      {/* hero + dials */}
      <div className="grid grid-cols-[1fr_296px] gap-7">
        <RiseIn>
          <SendWindowCard />
        </RiseIn>
        <DialCards />
      </div>

      {/* pipeline stack */}
      <RiseIn delay={120}>
        <PipelineStack stages={stages} />
      </RiseIn>

      {/* bottom row */}
      <div className="grid grid-cols-[1fr_360px] gap-7">
        <RiseIn delay={200}>
          <ApprovalList
            items={approvalItems}
            sub={`${reviewQueue.length} drafts in review queue`}
            onApprove={id => approve(id)}
            onReject={id => reject(id)}
            footer={
              reviewQueue.length > 0 ? (
                <button
                  onClick={() => navigate('/review')}
                  className="press raised-sm rounded-full px-4 py-2 text-[12.5px] font-semibold text-ink-dim bg-paper mt-6"
                >
                  Open queue →
                </button>
              ) : undefined
            }
          />
        </RiseIn>
        <RiseIn delay={280}>
          <InboundList />
        </RiseIn>
      </div>
    </div>
  )
}
