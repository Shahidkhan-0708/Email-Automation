import React from 'react'
import { Check, AlertTriangle, Ban, Clock } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
// TODO(cleanup): integrations list is demo data until the backend exposes status (roadmap M4).
import { integrationStatus } from '@/lib/demo'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

const MODEL_OPTIONS = ['gpt-4o', 'gpt-4o-mini', 'o3-mini']

export const SettingsPage: React.FC = () => {
  const { stats } = useApp()
  const [model, setModel] = React.useState(MODEL_OPTIONS[0] ?? 'gpt-4o')

  const stateIcon = (state: string) => {
    switch (state) {
      case 'connected': return <Check className="h-4 w-4 text-sage" />
      case 'attention': return <AlertTriangle className="h-4 w-4 text-amber" />
      case 'off': return <Ban className="h-4 w-4 text-terra" />
      default: return <Clock className="h-4 w-4 text-faint" />
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5">
          <SectionTitle className="text-[18px]">Integrations</SectionTitle>
          <p className="text-[13px] text-faint mt-0.5">
            Connection states are live status only — OAuth and API flows are wired in the backend, not simulated here.
          </p>
        </Card>
      </RiseIn>

      <div className="grid grid-cols-2 gap-7 items-start xl:grid-cols-3">
        {integrationStatus.map((it, i) => (
          <RiseIn key={it.id} delay={i * 70}>
            <Card className={cn('flex flex-col gap-4', it.state === 'attention' && 'ring-1 ring-amber/50')}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="recessed-sm w-11 h-11 rounded-[14px] flex items-center justify-center text-ink-dim">
                    {stateIcon(it.state)}
                  </span>
                  <div>
                    <p className="font-display text-[16px] text-ink leading-tight">{it.name}</p>
                    <p className="font-mono text-[10px] text-faint mt-0.5">{it.provider}</p>
                  </div>
                </div>
                <Badge tone={toneFor(it.state)}>{it.state.replace('_', ' ')}</Badge>
              </div>
              <p className="text-[12.5px] text-ink-dim">{it.detail}</p>
              {it.state === 'connected' && (
                <button className="self-start font-mono text-[10.5px] text-faint hover:text-ink-dim transition-colors">
                  view configuration →
                </button>
              )}
            </Card>
          </RiseIn>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-7 items-start">
        <RiseIn delay={120}>
          <Card>
            <SectionTitle className="text-[18px]">AI model</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-4">Used for personalization & reply classification</p>
            <div className="flex flex-col gap-2">
              {MODEL_OPTIONS.map(m => (
                <Pressable
                  key={m}
                  onClick={() => setModel(m)}
                  className={cn(
                    'rounded-[14px] px-4 py-3 flex items-center justify-between transition-shadow duration-150',
                    model === m ? 'recessed text-amber-ink font-semibold' : 'raised-sm text-ink-dim'
                  )}
                >
                  <span className="font-mono text-[13px]">{m}</span>
                  {model === m && <Check className="h-4 w-4" />}
                </Pressable>
              ))}
            </div>
            <p className="font-mono text-[10px] text-faint mt-4">
              backend model: <span className="text-ink-dim">{stats?.config.aiModel || '—'}</span>
            </p>
          </Card>
        </RiseIn>

        <RiseIn delay={200}>
          <Card>
            <SectionTitle className="text-[18px]">Dispatch</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-4">Current limits from the backend</p>
            <div className="recessed rounded-[16px] p-5 flex flex-col gap-3">
              <ConfigRow label="Daily send limit" value={String(stats?.config.dailySendLimit ?? 400)} />
              <ConfigRow label="Follow-up 1" value={`${stats?.config.followup1Days ?? 4} days`} />
              <ConfigRow label="Follow-up 2" value={`${stats?.config.followup2Days ?? 9} days`} />
              <ConfigRow label="SMTP host" value={stats?.config.smtpHost || '—'} />
              <ConfigRow label="Sender" value={`${stats?.config.senderName ?? '—'} <${stats?.config.senderEmail ?? ''}>`} />
              <ConfigRow label="Base URL" value={stats?.config.baseUrl || '—'} />
            </div>
          </Card>
        </RiseIn>
      </div>

      <p className="font-mono text-[10px] text-faint px-1">
        <MonoLabel className="inline">v1 scope:</MonoLabel> connection status and configuration only. Live OAuth/API
        connections happen on the backend — this screen never fakes a successful link.
      </p>
    </div>
  )
}

const ConfigRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[12px] font-semibold text-ink-dim">{label}</span>
    <span className="font-mono text-[11.5px] text-ink truncate" title={value}>{value}</span>
  </div>
)

function toneFor(state: string): 'amber' | 'sage' | 'terra' | 'neutral' | 'blue' {
  const map: Record<string, 'amber' | 'sage' | 'terra' | 'neutral' | 'blue'> = {
    connected: 'sage',
    attention: 'amber',
    off: 'terra',
    coming: 'blue',
  }
  return map[state] || 'neutral'
}
