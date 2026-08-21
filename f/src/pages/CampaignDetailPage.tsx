import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Reply } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { RiseIn, CountUp } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Badge, EmptyState, Avatar, LoadingState, initialsOf } from '@/components/ui'

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { campaigns, outreach, loading, stats } = useApp()

  // Follow-up cadence from real backend config (FOLLOWUP_1_DAYS / FOLLOWUP_2_DAYS).
  const f1 = stats?.config.followup1Days ?? 7
  const f2 = stats?.config.followup2Days ?? 14
  // Backend cadence (followup.service.js): Email 1 → FU1 at +f1 → FU2 at
  // +f1+f2 (interval f2 after FU1) → auto-close.
  const SEQUENCE = [
    { step: 'Email 1', label: 'Personalized intro', wait: 'Day 0', tone: 'sage' as const },
    { step: 'Follow-up 1', label: 'Gentle nudge', wait: `Day +${f1}`, tone: 'amber' as const },
    { step: 'Follow-up 2', label: 'Last attempt', wait: `Day +${f1 + f2}`, tone: 'amber' as const },
    { step: 'Close', label: 'Auto-close if no reply', wait: `After +${f1 + f2}`, tone: 'terra' as const },
  ]

  const campaign = useMemo(() => campaigns.find(c => c.id === id), [campaigns, id])
  const rows = useMemo(() => outreach.filter(o => o.campaign_id === id).slice(0, 10), [outreach, id])

  if (loading && !stats) return <LoadingState label="Loading campaign…" />
  if (!campaign) {
    return (
      <Card>
        <EmptyState title="Campaign not found" />
        <div className="flex justify-center pb-4">
          <button onClick={() => navigate('/campaigns')} className="press raised-sm rounded-full px-5 py-2 text-[13px] font-semibold text-ink-dim">
            Back to campaigns
          </button>
        </div>
      </Card>
    )
  }

  const pct = campaign.total ? Math.round((campaign.sent / campaign.total) * 100) : 0

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => navigate('/campaigns')}
            className="press raised-sm w-10 h-10 rounded-[14px] flex items-center justify-center text-ink-dim"
            aria-label="Back to campaigns"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <MonoLabel>CAMPAIGN · {campaign.status}</MonoLabel>
        </div>
      </RiseIn>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
        <div className="flex flex-col gap-7">
          <RiseIn delay={60}>
            <Card>
              <SectionTitle>{campaign.name}</SectionTitle>
              <p className="text-[13px] text-faint mt-1 mb-6">{campaign.description || 'No description'}</p>
              <div className="grid grid-cols-3 gap-6">
                <Metric label="enrolled" value={campaign.total} color="#5B7DB1" />
                <Metric label="sent" value={campaign.sent} color="#7FB069" />
                <Metric label="replies" value={campaign.replied} color="#E8A552" />
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between font-mono text-[11px] text-faint mb-2">
                  <span>progress</span>
                  <span className="text-amber-ink">{pct}%</span>
                </div>
                <div className="recessed-sm h-3 rounded-full p-[3px]">
                  <BarFill pct={pct} />
                </div>
              </div>
            </Card>
          </RiseIn>

          <RiseIn delay={140}>
            <Card>
              <SectionTitle className="text-[18px]">Sequence</SectionTitle>
              <p className="text-[13px] text-faint mt-0.5 mb-4">Follow-up cadence for this campaign</p>
              <div className="flex flex-col gap-3">
                {SEQUENCE.map((s, i) => (
                  <div key={s.step} className="flex items-center gap-4">
                    <span className="font-mono text-[10px] text-faint w-8 shrink-0">{i + 1}</span>
                    <div className="recessed-sm rounded-[14px] px-4 py-3 flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-[13.5px] font-semibold text-ink">{s.step}</p>
                        <p className="text-[12px] text-faint mt-0.5">{s.label}</p>
                      </div>
                      <Badge tone={s.tone}>{s.wait}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </RiseIn>
        </div>

        <RiseIn delay={200}>
          <Card>
            <SectionTitle className="text-[18px]">Recent dispatch</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-4">{rows.length} records</p>
            {rows.length === 0 ? (
              <EmptyState title="Nothing sent yet" hint="Approved drafts dispatch through the rate-limited SMTP pipeline." />
            ) : (
              <div className="flex flex-col gap-3">
                {rows.map((row, i) => (
                  <div key={row.id}>
                    {i > 0 && <div className="h-px bg-fainter/60 my-3" />}
                    <div className="flex items-center gap-3">
                      <Avatar initials={initialsOf(row.contacts?.name)} size="w-9 h-9 rounded-[12px] text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold text-ink truncate">{row.contacts?.name || 'Unknown'}</p>
                        <p className="font-mono text-[10px] text-faint truncate">{row.status}</p>
                      </div>
                      {row.reply_received_at ? (
                        <Reply className="h-3.5 w-3.5 text-amber shrink-0" />
                      ) : (
                        <Send className="h-3.5 w-3.5 text-sage shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </RiseIn>
      </div>
    </div>
  )
}

const Metric: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <p className="font-display font-light text-[40px] leading-none" style={{ color }}>
      <CountUp to={value} duration={1200} delay={250} comma />
    </p>
    <MonoLabel className="mt-2">{label}</MonoLabel>
  </div>
)

const BarFill: React.FC<{ pct: number }> = ({ pct }) => {
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    const t = window.setTimeout(() => setW(pct), 400)
    return () => window.clearTimeout(t)
  }, [pct])
  return <div className="h-full rounded-full bg-sage bar-grow" style={{ width: `${w}%` }} />
}
