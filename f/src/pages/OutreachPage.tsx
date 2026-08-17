import React from 'react'
import { useApp } from '@/lib/AppContext'
import { SendWindowCard, DialCards, StatusBreakdown, ServiceHealth } from '@/components/widgets'
import { RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Badge, EmptyState, Avatar, initialsOf, LoadingState } from '@/components/ui'

export const OutreachPage: React.FC = () => {
  const { outreach, loading, stats } = useApp()

  if (loading && !stats) return <LoadingState label="Loading outreach…" />

  return (
    <div className="flex flex-col gap-7">
      <div className="grid grid-cols-[1fr_296px] gap-7">
        <RiseIn>
          <SendWindowCard />
        </RiseIn>
        <DialCards />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-7">
        <RiseIn delay={100}>
          <StatusBreakdown />
        </RiseIn>
        <RiseIn delay={180}>
          <Card>
            <SectionTitle>System health</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-4">Integrations & sync state</p>
            <ServiceHealth />
            <div className="mt-6 recessed rounded-[16px] p-4">
              <MonoLabel className="mb-2.5">Throttle</MonoLabel>
              <p className="text-[12px] text-ink-dim leading-relaxed">
                Daily cap <span className="font-mono text-amber-ink">{stats?.config.dailySendLimit ?? 400}</span> · per-hour cap{' '}
                <span className="font-mono text-amber-ink">40</span> · cooldown <span className="font-mono text-blue">90s</span>
              </p>
            </div>
          </Card>
        </RiseIn>
      </div>

      {/* activity log */}
      <RiseIn delay={240}>
        <Card>
          <div className="flex items-end justify-between mb-5">
            <div>
              <SectionTitle>Dispatch log</SectionTitle>
              <p className="text-[13px] text-faint mt-0.5">{outreach.length} outreach records</p>
            </div>
            <MonoLabel>SMTP · Brevo · healthy</MonoLabel>
          </div>
          {outreach.length === 0 ? (
            <EmptyState title="No dispatches yet" hint="Approved drafts are sent through the rate-limited SMTP pipeline." />
          ) : (
            <div className="flex flex-col">
              {outreach.slice(0, 12).map((row, i) => (
                <div key={row.id}>
                  {i > 0 && <div className="h-px bg-fainter/60 my-3" />}
                  <div className="flex items-center gap-4">
                    <Avatar initials={initialsOf(row.contacts?.name)} size="w-10 h-10 rounded-[14px]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink truncate">
                        {row.contacts?.name || 'Unknown contact'}
                        {row.contacts?.organization && <span className="text-faint font-normal"> · {row.contacts.organization}</span>}
                      </p>
                      <p className="font-display italic text-[13px] text-ink-dim truncate">{row.subject || '—'}</p>
                    </div>
                    <Badge tone={toneFor(row.status)}>{row.status}</Badge>
                    <span className="font-mono text-[11px] text-faint w-24 text-right shrink-0">
                      {row.sent_at ? new Date(row.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </RiseIn>
    </div>
  )
}

function toneFor(status: string): 'amber' | 'sage' | 'blue' | 'terra' | 'neutral' {
  const map: Record<string, 'amber' | 'sage' | 'blue' | 'terra' | 'neutral'> = {
    Sent: 'sage',
    Delivered: 'sage',
    Ready: 'blue',
    Claimed: 'blue',
    Sending: 'amber',
    Replied: 'blue',
    Bounced: 'terra',
    Error: 'terra',
    'Follow-up 1': 'amber',
    'Follow-up 2': 'amber',
  }
  return map[status] || 'neutral'
}
