import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, ArrowRight } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, Badge, EmptyState, LoadingState } from '@/components/ui'
import { GrowingBar } from '@/components/motion'

// Campaign statuses come from the DB as 'Active'/'Paused'/'Completed'.
const isActive = (status: string) => ['active', 'running'].includes(status.toLowerCase())

export const CampaignsPage: React.FC = () => {
  const { campaigns, loading, stats } = useApp()
  const navigate = useNavigate()

  if (loading && !stats) return <LoadingState label="Loading campaigns…" />

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <SectionTitle className="text-[18px]">Campaigns</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5">{campaigns.length} sequences configured</p>
          </div>
          <Pressable
            onClick={() => navigate('/bulk-send')}
            className="press bg-sage text-white rounded-full px-6 py-3 text-[14px] font-bold flex items-center gap-2"
          >
            <Megaphone className="h-4 w-4" /> Bulk send
          </Pressable>
        </Card>
      </RiseIn>

      {campaigns.length === 0 ? (
        <Card>
          <EmptyState title="No campaigns yet" hint="A default campaign is created on first import." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
          {campaigns.map((c, i) => {
            const pct = c.total ? Math.round((c.sent / c.total) * 100) : 0
            return (
              <RiseIn key={c.id} delay={i * 80}>
                <Card className="cursor-pointer hover:-translate-y-0.5 transition-transform duration-200" onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <SectionTitle className="text-[18px] leading-snug">{c.name}</SectionTitle>
                      {c.description && <p className="text-[12.5px] text-faint mt-1 line-clamp-2">{c.description}</p>}
                    </div>
                    <Badge tone={isActive(c.status) ? 'sage' : 'neutral'}>{c.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-faint mb-2">
                    <span>
                      <span className="text-ink font-semibold num-tabular">{c.sent}</span> / {c.total} sent
                    </span>
                    <span className="text-amber-ink">{pct}%</span>
                  </div>
                  <div className="recessed-sm h-2.5 rounded-full p-[3px]">
                    <GrowingBar width={pct} color={isActive(c.status) ? '#7FB069' : '#a89d91'} delay={300 + i * 100} />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-mono text-[10px] text-faint">{c.replied} replies · created {new Date(c.createdAt).toLocaleDateString()}</p>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-amber-ink">
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Card>
              </RiseIn>
            )
          })}
        </div>
      )}
    </div>
  )
}
