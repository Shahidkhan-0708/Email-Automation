import React, { useMemo, useState } from 'react'
import { Send, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader, LoadingState, EmptyState, formatDate } from './shared'
import { useApp } from '@/lib/AppContext'

export const OutreachPage: React.FC = () => {
  const { outreach, loading, runOutreach, runFollowups } = useApp()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [running, setRunning] = useState<'outreach' | 'followups' | null>(null)

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return outreach
    return outreach.filter(o => o.status === statusFilter)
  }, [outreach, statusFilter])

  if (loading && outreach.length === 0) return <LoadingState label="Loading outreach log…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach Delivery"
        description="Dispatched emails and their delivery state. Triggers run the same jobs the cron scheduler uses."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={async () => { setRunning('followups'); try { await runFollowups(); } finally { setRunning(null) } }}
              disabled={running !== null}
            >
              <RefreshCw className={`h-4 w-4 ${running === 'followups' ? 'animate-spin' : ''}`} />
              Run Follow-ups
            </Button>
            <Button
              onClick={async () => { setRunning('outreach'); try { await runOutreach(); } finally { setRunning(null) } }}
              disabled={running !== null}
            >
              <Send className={`h-4 w-4 ${running === 'outreach' ? 'animate-spin' : ''}`} />
              {running === 'outreach' ? 'Sending…' : 'Run Outreach Batch'}
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All ({outreach.length})</TabsTrigger>
              {Array.from(new Set(outreach.map(o => o.status))).map(s => (
                <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState title="No outreach records" hint="Import leads or create one — they enroll into the default campaign automatically." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>AI Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(o => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{o.contacts?.name || o.contact_id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">{o.contacts?.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.campaigns?.name || '—'}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm" title={o.subject || ''}>
                        {o.subject || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(o.sent_at || o.created_at)}</TableCell>
                      <TableCell>
                        {o.ai_category ? (
                          <Badge variant="ai">{o.ai_category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
