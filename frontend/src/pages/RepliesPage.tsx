import React, { useState } from 'react'
import { Reply, RefreshCw, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, LoadingState, EmptyState, formatDate } from './shared'
import { useApp } from '@/lib/AppContext'

export const RepliesPage: React.FC = () => {
  const { replies, loading, runReplies } = useApp()
  const [running, setRunning] = useState(false)

  if (loading && replies.length === 0) return <LoadingState label="Loading replies…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbound Replies & Drips"
        description="Replies detected from Gmail, classified by the AI reply classifier."
        actions={
          <Button
            variant="secondary"
            onClick={async () => { setRunning(true); try { await runReplies(); } finally { setRunning(false) } }}
            disabled={running}
          >
            <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Checking inbox…' : 'Check for Replies'}
          </Button>
        }
      />

      {replies.length === 0 ? (
        <EmptyState title="No replies yet" hint="Run 'Check for Replies' or wait for the 15-minute cron job." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {replies.map(r => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-foreground">{r.contacts?.name || r.contact_id.slice(0, 8)}</span>
                    <div className="text-xs text-muted-foreground">{r.contacts?.email} · {formatDate(r.reply_received_at)}</div>
                  </div>
                  {r.ai_category && <Badge variant="ai"><Sparkles className="h-3 w-3" />{r.ai_category}</Badge>}
                </div>

                {r.ai_summary && (
                  <div className="mb-3 rounded-lg bg-ai-bg px-3 py-2 text-xs text-foreground">
                    <span className="font-semibold text-accent">AI summary: </span>
                    {r.ai_summary}
                  </div>
                )}

                <blockquote className="mb-3 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                  {r.reply_body || '(reply body not extracted)'}
                </blockquote>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Reply className="h-3.5 w-3.5" />
                  {r.ai_next_action || 'No next action recorded'}
                  {r.ai_confidence != null && <span className="ml-auto">confidence {Math.round(r.ai_confidence * 100)}%</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
