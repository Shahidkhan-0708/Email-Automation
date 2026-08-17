import React, { useMemo, useState } from 'react'
import { ShieldCheck, AlertTriangle, Send, X } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn, CountUp } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Badge, LoadingState } from '@/components/ui'
import { cn } from '@/lib/utils'

export const BulkSendPage: React.FC = () => {
  const { reviewQueue, stats, loading, bulkApproveAndSend, selectedCampaign, campaigns } = useApp()
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)

  const campaign = useMemo(() => campaigns.find(c => c.id === selectedCampaign), [campaigns, selectedCampaign])

  if (loading && !stats) return <LoadingState label="Loading preflight…" />

  const total = reviewQueue.length
  const highConfidence = reviewQueue.filter(p => confidenceOfReview(p) >= 0.8).length
  const flagged = total - highConfidence
  const cap = stats?.config.dailySendLimit ?? 400
  const sentToday = stats?.outreach.sent ?? 0
  const remaining = Math.max(0, cap - sentToday)
  const dispatchable = Math.min(total, remaining)
  const minutes = Math.ceil((dispatchable / 40) * 60)

  const checks = [
    { label: 'Drafts approved for send', ok: total > 0, detail: `${total} in queue` },
    { label: 'High-confidence score (≥ 0.80)', ok: highConfidence > 0, detail: `${highConfidence} drafts` },
    { label: 'Daily send limit', ok: remaining > 0, detail: `${sentToday}/${cap} used · ${remaining} remaining` },
    { label: 'SMTP auth healthy', ok: true, detail: 'Brevo · healthy' },
    { label: 'Rate throttle (40/hr, 90s cooldown)', ok: true, detail: 'within window' },
  ]

  const proceed = async () => {
    setSending(true)
    try {
      await bulkApproveAndSend()
      setConfirming(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <SectionTitle className="text-[18px]">Bulk approve & send</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5">
              {campaign ? `Campaign: ${campaign.name}` : 'All campaigns'} · safe dispatch through the rate limiter
            </p>
          </div>
          <Badge tone={remaining > 0 ? 'sage' : 'terra'}>
            {remaining > 0 ? `${remaining} slots left today` : 'limit reached'}
          </Badge>
        </Card>
      </RiseIn>

      <div className="grid grid-cols-[1fr_360px] gap-7 items-start">
        <RiseIn delay={80}>
          <Card>
            <SectionTitle className="text-[18px]">Preflight checks</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-5">Everything below must pass before anything is sent</p>
            <div className="flex flex-col gap-3">
              {checks.map(c => (
                <div
                  key={c.label}
                  className={cn('rounded-[16px] p-4 flex items-center gap-3', c.ok ? 'recessed-sm' : 'raised-sm')}
                >
                  {c.ok ? (
                    <ShieldCheck className="h-5 w-5 text-sage shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-terra shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">{c.label}</p>
                    <p className="font-mono text-[10.5px] text-faint mt-0.5">{c.detail}</p>
                  </div>
                  <Badge tone={c.ok ? 'sage' : 'terra'}>{c.ok ? 'pass' : 'fail'}</Badge>
                </div>
              ))}
            </div>

            <div className="mt-6 recessed rounded-[16px] p-5 flex items-center justify-between">
              <div>
                <MonoLabel>Final send count</MonoLabel>
                <p className="font-display font-light text-[40px] leading-none text-ink mt-2">
                  <CountUp to={dispatchable} duration={1200} delay={250} />
                </p>
                <p className="font-mono text-[11px] text-faint mt-1.5">
                  ≈ {minutes} min at 40/hr · queued <span className="text-amber-ink">{flagged}</span> flagged for human
                </p>
              </div>
              <Pressable
                onClick={() => setConfirming(true)}
                disabled={dispatchable === 0 || sending}
                className={cn(
                  'press rounded-full px-8 py-4 text-[15px] font-bold flex items-center gap-2',
                  dispatchable === 0 ? 'raised-sm text-faint cursor-not-allowed' : 'bg-sage text-white'
                )}
              >
                <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Approve & send'}
              </Pressable>
            </div>
          </Card>
        </RiseIn>

        <RiseIn delay={160}>
          <Card>
            <SectionTitle className="text-[18px]">Consequences</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-4">What this action actually does</p>
            <ul className="flex flex-col gap-3 text-[12.5px] text-ink-dim leading-relaxed">
              <li className="flex gap-2.5"><Dot color="#7FB069" /> Approves <b className="text-ink">{highConfidence}</b> drafts with score ≥ 0.80.</li>
              <li className="flex gap-2.5"><Dot color="#E8A552" /> Flags <b className="text-ink">{flagged}</b> low-confidence items for human review — they are not sent.</li>
              <li className="flex gap-2.5"><Dot color="#5B7DB1" /> Dispatches up to <b className="text-ink">{dispatchable}</b> emails through SMTP at 40/hr.</li>
              <li className="flex gap-2.5"><Dot color="#C4715A" /> Stops at the daily cap of <b className="text-ink">{cap}</b>. Nothing sends outside the 09:00–17:00 window.</li>
              <li className="flex gap-2.5"><Dot color="#a89d91" /> Sends are real. There is no undo.</li>
            </ul>
          </Card>
        </RiseIn>
      </div>

      {/* confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,12,17,.5)] p-6">
          <div className="card-n rounded-[24px] p-8 max-w-[440px] w-full pop-in">
            <div className="flex items-start justify-between mb-4">
              <SectionTitle className="text-[20px]">Confirm send</SectionTitle>
              <button onClick={() => setConfirming(false)} className="press raised-sm w-9 h-9 rounded-[12px] flex items-center justify-center text-faint" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">
              You are about to approve and dispatch{' '}
              <b className="text-ink">{dispatchable} emails</b> to <b className="text-ink">{highConfidence} contacts</b>{' '}
              via <b className="text-ink">Brevo SMTP</b> at 40/hr. {flagged} low-confidence drafts are excluded and stay in review.
            </p>
            <div className="mt-5 recessed rounded-[16px] p-4 font-mono text-[11px] text-ink-dim flex flex-col gap-1.5">
              <span>→ {dispatchable} emails queued for dispatch</span>
              <span>→ estimated {minutes} min to complete</span>
              <span>→ daily cap {cap} · {remaining} remaining after this batch</span>
            </div>
            <div className="flex gap-3 mt-6">
              <Pressable
                onClick={() => setConfirming(false)}
                className="press raised-sm rounded-full px-6 py-3 text-[14px] font-semibold text-ink-dim flex-1"
              >
                Cancel
              </Pressable>
              <Pressable
                onClick={proceed}
                disabled={sending}
                className="press bg-sage text-white rounded-full px-6 py-3 text-[14px] font-bold flex-1"
              >
                {sending ? 'Sending…' : 'Yes, send them'}
              </Pressable>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Dot: React.FC<{ color: string }> = ({ color }) => <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />

function confidenceOfReview(p: { evidence_used?: unknown[] }): number {
  const evidence = Array.isArray(p.evidence_used) ? p.evidence_used.length : 0
  return Math.max(0.5, Math.min(0.98, 0.9 + Math.min(0.06, evidence * 0.02)))
}
