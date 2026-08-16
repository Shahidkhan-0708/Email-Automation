import React from 'react'
import { Users, Target, Send, Reply, FileUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader, LoadingState, EmptyState } from './shared'
import { useApp } from '@/lib/AppContext'

const STATUS_TONES: Record<string, string> = {
  Ready: 'neutral',
  Claimed: 'info',
  Sending: 'info',
  Sent: 'success',
  Delivered: 'success',
  Bounced: 'destructive',
  Error: 'destructive',
  Replied: 'ai',
  'Follow-up 1': 'warning',
  'Follow-up 2': 'warning',
  Closed: 'neutral',
} as const

export const DashboardPage: React.FC = () => {
  const { stats, loading } = useApp()

  if (loading && !stats) return <LoadingState label="Loading dashboard…" />
  if (!stats) return <EmptyState title="No stats available" />

  const { outreach, config } = stats
  const byStatus = Object.entries(outreach.byStatus || {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description="Live KPIs from the outreach pipeline (Supabase-backed)."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Contacts" value={stats.contacts} subtext="total in database" />
        <StatCard label="Campaigns" value={stats.campaigns} subtext="active & archived" />
        <StatCard label="Outreach Sent" value={outreach.sent} subtext={`of ${outreach.total} enrolled`} trend={outreach.sent > 0 ? 'positive' : 'neutral'} />
        <StatCard label="Replies" value={outreach.replied} subtext="AI-classified inbound" trend={outreach.replied > 0 ? 'positive' : 'neutral'} />
        <StatCard label="Review Queue" value={stats.reviewQueue} subtext="pending AI personalizations" trend={stats.reviewQueue > 0 ? 'negative' : 'neutral'} />
        <StatCard label="Ready Leads" value={outreach.ready} subtext="awaiting dispatch" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pipeline status breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Pipeline Status Breakdown
            </CardTitle>
            <CardDescription>Outreach records grouped by current state</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatus.length === 0 ? (
              <EmptyState title="No outreach records" hint="Import leads or create one to see pipeline states." />
            ) : (
              <div className="space-y-3">
                {byStatus.map(([status, count]) => {
                  const pct = outreach.total ? Math.round((count / outreach.total) * 100) : 0
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <Badge variant={(STATUS_TONES[status] as 'success' | 'warning' | 'destructive' | 'info' | 'ai' | 'neutral') || 'neutral'}>
                          {status}
                        </Badge>
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold text-foreground">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              System Configuration
            </CardTitle>
            <CardDescription>Live values from the backend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ConfigRow icon={<Send className="h-3.5 w-3.5" />} label="Daily send limit" value={String(config.dailySendLimit)} />
            <ConfigRow icon={<Reply className="h-3.5 w-3.5" />} label="Follow-up cadence" value={`${config.followup1Days}d / ${config.followup2Days}d`} />
            <ConfigRow icon={<FileUp className="h-3.5 w-3.5" />} label="Import jobs" value={Object.entries(stats.importJobs || {}).map(([s, n]) => `${s}: ${n}`).join(', ') || 'none'} />
            <ConfigRow icon={<Users className="h-3.5 w-3.5" />} label="Sender" value={`${config.senderName} <${config.senderEmail}>`} />
            <ConfigRow label="SMTP host" value={config.smtpHost} />
            <ConfigRow label="AI model" value={config.aiModel} />
            <ConfigRow label="Base URL" value={config.baseUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const ConfigRow: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="flex items-center gap-2 text-muted-foreground">
      {icon}
      {label}
    </span>
    <span className="max-w-[55%] truncate font-semibold text-foreground" title={value}>
      {value}
    </span>
  </div>
)
