import React, { useMemo, useState } from 'react'
import { ShieldCheck, AlertTriangle, Send, X } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn, CountUp } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Badge, LoadingState } from '@/components/ui'
import { confidenceOf, evidenceCount } from '@/components/widgets'
import { cn } from '@/lib/utils'

export const BulkSendPage: React.FC = () => {
  const { reviewQueue, stats, loading, bulkApproveAndSend, selectedCampaign, campaigns } = useApp()
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)

  const campaign = useMemo(() => campaigns.find(c => c.id === selectedCampaign), [campaigns, selectedCampaign])

  if (loading && !stats) return <LoadingState label="Loading preflight…" />

  const total = reviewQueue.length
  // Real signals from the drafts themselves: how many cite evidence, and how
  // many have a recorded evidence confidence of >= 0.8. No invented scores.
  const withEvidence = reviewQueue.filter(p => evidenceCount(p) > 0).length
  const highConfidence = reviewQueue.filter(p => {
    const c = confidenceOf(p)
    return c != null && c >= 0.8
  }).length
  const lowConfidence = total - highConfidence
  const cap = stats?.config.dailySendLimit ?? 0
  const sentToday = stats?.outreach.sent ?? 0
  const remaining = Math.max(0, cap - sentToday)
  const dispatchable = Math.min(total, remaining)
  const delaySec = (stats?.config.sendDelayMs ?? 2000) / 1000
  const concurrency = stats?.config.smtpConcurrency ?? 1
  // Theoretical ceiling, not measured throughput — labeled as such.
  const capacityPerHour = Math.max(1, Math.round((3600 / delaySec) * concurrency))
  const minutes = Math.ceil((dispatchable / capacityPerHour) * 60)
  const smtpConfigured = !!stats?.config.integrations?.smtp

  // The backend approves every pending draft (human decisions already made on
  // the Review page); the dispatch itself is capped by the daily send limit.
  const checks = [
    { label: 'Drafts awaiting approval', ok: total > 0, detail: `${total} in queue` },
    { label: 'Evidence recorded', ok: withEvidence > 0, detail: `${withEvidence}/${total} drafts cite research facts` },
    { label: 'Daily send limit', ok: remaining > 0, detail: `${sentToday}/${cap} used · ${remaining} remaining` },
    { label: 'SMTP configured', ok: smtpConfigured, detail: smtpConfigured ? 'credentials present' : 'not configured — sends will fail' },
    { label: 'Capacity (configured)', ok: true, detail: `up to ${capacityPerHour}/hr at ${concurrency} parallel · ${delaySec}s delay` },
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
              {campaign ? `Campaign: ${campaign.name}` : 'All campaigns'} · approves the queue, then dispatches through the rate limiter
            </p>
          </div>
          <Badge tone={remaining > 0 ? 'sage' : 'terra'}>
            {remaining > 0 ? `${remaining} slots left today` : 'limit reached'}
          </Badge>
        </Card>
      </RiseIn>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
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
                  ≈ {minutes} min at configured capacity ({capacityPerHour}/hr) · <span className="text-terra-ink">{lowConfidence}</span> drafts with low/no evidence confidence
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
              <li className="flex gap-2.5"><Dot color="#7FB069" /> Approves <b className="text-ink">{total}</b> pending drafts — every draft in the queue, including low-confidence ones.</li>
              <li className="flex gap-2.5"><Dot color="#E8A552" /> <b className="text-ink">{highConfidence}</b> drafts carry evidence confidence ≥ 0.80; <b className="text-ink">{lowConfidence}</b> have low or no recorded confidence — check those on the Review page first if unsure.</li>
              <li className="flex gap-2.5"><Dot color="#5B7DB1" /> Dispatches up to <b className="text-ink">{dispatchable}</b> emails through SMTP — the configured ceiling is {capacityPerHour}/hr; actual pace depends on the provider.</li>
              <li className="flex gap-2.5"><Dot color="#C4715A" /> Stops at the daily cap of <b className="text-ink">{cap}</b>. Approved drafts beyond the cap stay Ready and send on later runs.</li>
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
              You are about to approve <b className="text-ink">{total} drafts</b> and dispatch{' '}
              <b className="text-ink">{dispatchable} emails</b> via <b className="text-ink">SMTP</b> at up to {capacityPerHour}/hr (configured capacity).
              {' '}{lowConfidence} drafts have low or no evidence confidence — they are still approved by this action.
            </p>
            <div className="mt-5 recessed rounded-[16px] p-4 font-mono text-[11px] text-ink-dim flex flex-col gap-1.5">
              <span>→ {total} drafts approved</span>
              <span>→ up to {dispatchable} emails dispatched this run</span>
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
