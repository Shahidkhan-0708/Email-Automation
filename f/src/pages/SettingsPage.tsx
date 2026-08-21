import React from 'react'
import { useApp } from '@/lib/AppContext'
import { RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel } from '@/components/ui'
import { ServiceHealth } from '@/components/widgets'

export const SettingsPage: React.FC = () => {
  const { stats } = useApp()
  const model = stats?.config.aiModel || '—'

  return (
    <div className="flex flex-col gap-7">
      <RiseIn delay={80}>
        <Card className="p-6">
          <SectionTitle className="text-[18px]">Integrations</SectionTitle>
          <p className="text-[13px] text-faint mt-0.5 mb-4">
            Live health checks run every 60s. Green means the service actually authenticated;
            amber means credentials are configured but not verified; red means the check failed.
          </p>
          <ServiceHealth />
        </Card>
      </RiseIn>

      <div className="grid grid-cols-2 gap-7 items-start">
        <RiseIn delay={120}>
          <Card>
            <SectionTitle className="text-[18px]">AI model</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-4">Used for personalization & reply classification</p>
            <div className="recessed rounded-[16px] p-5 flex items-center justify-between">
              <span className="font-mono text-[13px] text-ink">{model}</span>
              <span className="font-mono text-[10px] text-faint">live from backend</span>
            </div>
            <p className="font-mono text-[10px] text-faint mt-4">
              Set the model with <span className="text-ink-dim">OPENAI_MODEL</span> in the backend .env — this console reflects it read-only.
            </p>
          </Card>
        </RiseIn>

        <RiseIn delay={200}>
          <Card>
            <SectionTitle className="text-[18px]">Dispatch</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5 mb-4">Current limits from the backend</p>
            <div className="recessed rounded-[16px] p-5 flex flex-col gap-3">
              <ConfigRow label="Daily send limit" value={String(stats?.config.dailySendLimit ?? 0)} />
              <ConfigRow label="Follow-up 1" value={`${stats?.config.followup1Days ?? 0} days`} />
              <ConfigRow label="Follow-up 2" value={`${stats?.config.followup2Days ?? 0} days`} />
              <ConfigRow label="Send delay" value={`${((stats?.config.sendDelayMs ?? 0) / 1000).toFixed(0)}s`} />
              <ConfigRow label="SMTP concurrency" value={String(stats?.config.smtpConcurrency ?? 0)} />
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

