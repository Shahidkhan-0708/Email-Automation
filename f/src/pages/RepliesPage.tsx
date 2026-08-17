import React from 'react'
import { Inbox, RefreshCw } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { InboundList } from '@/components/widgets'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, Avatar, Badge, EmptyState, LoadingState, initialsOf } from '@/components/ui'
import { replyClassColors } from '@/lib/demo'
import { cn } from '@/lib/utils'

export const RepliesPage: React.FC = () => {
  const { replies, loading, stats, runReplies } = useApp()
  const [busy, setBusy] = React.useState(false)

  if (loading && !stats) return <LoadingState label="Loading replies…" />

  const check = async () => {
    setBusy(true)
    try {
      await runReplies()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="grid grid-cols-[360px_1fr] gap-7 items-start">
        <RiseIn>
          <InboundList title="Inbound" />
        </RiseIn>

        <RiseIn delay={100}>
          <Card>
            <div className="flex items-end justify-between mb-5">
              <div>
                <SectionTitle className="text-[18px]">Classified replies</SectionTitle>
                <p className="text-[13px] text-faint mt-0.5">
                  Detected via Gmail OAuth · AI-classified · read-only inbox
                </p>
              </div>
              <Pressable onClick={check} className="press raised-sm rounded-full px-4 py-2 text-[12px] font-semibold text-amber-ink flex items-center gap-2">
                <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} /> Check inbox
              </Pressable>
            </div>
            {replies.length === 0 ? (
              <EmptyState title="No replies yet" hint="Run a check — inbound mail is matched to outreach and classified." />
            ) : (
              <div className="flex flex-col">
                {replies.slice(0, 15).map((r, i) => (
                  <div key={r.id}>
                    {i > 0 && <div className="h-px bg-fainter/60 my-3" />}
                    <div className="flex items-start gap-4">
                      <Avatar initials={initialsOf(r.contacts?.name)} size="w-11 h-11 rounded-[14px] text-[11px]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13.5px] font-semibold text-ink">
                            {r.contacts?.name || 'Unknown'}
                            {r.contacts?.organization && <span className="text-faint font-normal"> · {r.contacts.organization}</span>}
                          </p>
                          <span className="font-mono text-[10px] text-faint">
                            {r.last_inbound_at || r.reply_received_at ? new Date(r.last_inbound_at || r.reply_received_at!).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="font-display italic text-[14px] text-ink-dim mt-1 line-clamp-2">
                          “{r.reply_body || r.ai_summary || 'No body captured'}”
                        </p>
                        {r.ai_next_action && (
                          <p className="font-mono text-[10.5px] text-blue mt-1.5">→ {r.ai_next_action}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {r.ai_category && (
                          <Badge tone="neutral" className="normal-case tracking-normal" >
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ background: replyClassColors[r.ai_category] || '#a89d91' }} />
                            {r.ai_category.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {r.ai_confidence != null && (
                          <span className="font-mono text-[10px] text-faint">{Math.round(r.ai_confidence * 100)}% confidence</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </RiseIn>
      </div>

      <p className="font-mono text-[10px] text-faint px-1 flex items-center gap-1.5">
        <Inbox className="h-3 w-3" /> v1 shows replies read-only — a full inbox UI is a non-goal for this release.
      </p>
    </div>
  )
}
