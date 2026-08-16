import React, { useState } from 'react'
import { FileUp, Users, Sparkles, ClipboardCheck, Send, Reply, RefreshCw, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader, LoadingState } from './shared'
import { useApp } from '@/lib/AppContext'

export const PipelinePage: React.FC = () => {
  const { stats, loading, runOutreach, runReplies, runFollowups, refresh } = useApp()
  const [running, setRunning] = useState<string | null>(null)

  if (loading && !stats) return <LoadingState label="Loading pipeline…" />

  const o = stats?.outreach
  const stages = [
    { icon: FileUp, label: '1. Import & Extract', desc: 'CSV / XLSX / PDF upload', value: stats?.contacts ?? 0, tone: 'info' as const, to: '/import' },
    { icon: Users, label: '2. Profiles & Cleaning', desc: 'Normalized profiles', value: stats?.contacts ?? 0, tone: 'neutral' as const, to: '/people' },
    { icon: Sparkles, label: '3+4. AI Personalization', desc: 'LLM-generated variants', value: stats?.reviewQueue ?? 0, tone: 'ai' as const, to: '/personalization' },
    { icon: ClipboardCheck, label: '5. Human Review', desc: 'approve / reject / edit', value: stats?.reviewQueue ?? 0, tone: 'warning' as const, to: '/review' },
    { icon: Send, label: '6. Outreach Dispatch', desc: 'rate-limited send', value: o?.sent ?? 0, tone: 'success' as const, to: '/outreach' },
    { icon: Reply, label: '7. Replies & Drips', desc: 'AI-classified inbound', value: o?.replied ?? 0, tone: 'ai' as const, to: '/replies' },
  ]

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setRunning(key)
    try { await fn() } finally { setRunning(null) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Pipeline Map"
        description="End-to-end flow from file import to reply classification. Counts are live from the backend."
        actions={
          <>
            <Button variant="secondary" onClick={() => run('followups', runFollowups)} disabled={running !== null}>
              <RefreshCw className={`h-4 w-4 ${running === 'followups' ? 'animate-spin' : ''}`} />
              Follow-ups
            </Button>
            <Button variant="secondary" onClick={() => run('replies', runReplies)} disabled={running !== null}>
              <Reply className={`h-4 w-4 ${running === 'replies' ? 'animate-spin' : ''}`} />
              Check Replies
            </Button>
            <Button onClick={() => run('outreach', runOutreach)} disabled={running !== null}>
              <Send className={`h-4 w-4 ${running === 'outreach' ? 'animate-spin' : ''}`} />
              Run Outreach
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {stages.map((s, i) => (
          <React.Fragment key={s.label}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    s.tone === 'ai' ? 'bg-ai-bg text-accent' : s.tone === 'success' ? 'bg-success-bg text-success' : s.tone === 'warning' ? 'bg-warning-bg text-warning' : s.tone === 'info' ? 'bg-info-bg text-info' : 'bg-secondary text-muted-foreground'
                  }`}>
                    <s.icon className="h-4 w-4" />
                  </span>
                  <Badge variant={s.tone === 'ai' ? 'ai' : s.tone === 'success' ? 'success' : s.tone === 'warning' ? 'warning' : s.tone === 'info' ? 'info' : 'neutral'}>
                    {s.value}
                  </Badge>
                </div>
                <div className="text-sm font-semibold leading-tight text-foreground">{s.label}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{s.desc}</div>
              </CardContent>
            </Card>
            {i < stages.length - 1 && (
              <div className="hidden items-center justify-center xl:flex">
                <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Pipeline health</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {o?.total ?? 0} outreach records · {o?.sent ?? 0} sent · {o?.replied ?? 0} replied · {stats?.reviewQueue ?? 0} awaiting review · {stats?.contacts ?? 0} contacts
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refresh()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh counts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
