import React, { useState } from 'react'
import { Gauge, Zap, ClipboardCheck, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader, LoadingState } from './shared'
import { useApp } from '@/lib/AppContext'

export const RateLimiterPage: React.FC = () => {
  const { stats, bulkProgress, loading, bulkApproveAndSend, runOutreach } = useApp()
  const [busy, setBusy] = useState<'approve' | 'send' | null>(null)

  if (loading && !stats) return <LoadingState label="Loading…" />

  const config = stats?.config
  const progress = bulkProgress || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Limiting & Safety Dispatcher"
        description="Control how many emails go out per day and trigger the approved batch."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Daily Send Limit" value={config?.dailySendLimit ?? '—'} subtext="from backend config" />
        <StatCard label="Pending Review" value={stats?.reviewQueue ?? 0} subtext="awaiting approval" trend={(stats?.reviewQueue ?? 0) > 0 ? 'negative' : 'neutral'} />
        <StatCard label="Approved" value={progress.approved ?? 0} subtext="ready to dispatch" />
        <StatCard label="Rejected" value={progress.rejected ?? 0} subtext="across campaign" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-warning" />Bulk Approve & Send</CardTitle>
            <CardDescription>Approves all pending personalizations, then runs the outreach batch (respects the daily limit).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              <Gauge className="h-4 w-4" />
              Pipeline state: total {progress.total ?? 0} · pending {progress.pending_review ?? 0} · approved {progress.approved ?? 0} · edited {progress.edited ?? 0} · sent {progress.sent ?? 0}
            </div>
            <Button
              className="w-full"
              onClick={async () => { setBusy('approve'); try { await bulkApproveAndSend(); } finally { setBusy(null) } }}
              disabled={busy !== null || (stats?.reviewQueue ?? 0) === 0}
            >
              <Zap className={`h-4 w-4 ${busy === 'approve' ? 'animate-pulse' : ''}`} />
              {busy === 'approve' ? 'Approving & sending…' : `Approve ${stats?.reviewQueue ?? 0} pending & Send`}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => { setBusy('send'); try { await runOutreach(); } finally { setBusy(null) } }}
              disabled={busy !== null}
            >
              <Send className={`h-4 w-4 ${busy === 'send' ? 'animate-pulse' : ''}`} />
              {busy === 'send' ? 'Sending…' : 'Run Outreach Batch Only'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" />Safety Rules</CardTitle>
            <CardDescription>Hard limits enforced by the backend outreach job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• A maximum of <strong className="text-foreground">{config?.dailySendLimit ?? '—'}</strong> emails are sent per day.</p>
            <p>• Follow-up 1 fires after <strong className="text-foreground">{config?.followup1Days ?? '—'}</strong> days, follow-up 2 after <strong className="text-foreground">{config?.followup2Days ?? '—'}</strong>.</p>
            <p>• Sends stop immediately if the SMTP provider rejects credentials (auth halts the batch).</p>
            <p>• Bounced contacts are auto-suppressed and removed from future runs.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
