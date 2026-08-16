import React from 'react'
import { Target, Send, Reply, Users2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, LoadingState, EmptyState, formatDate } from './shared'
import { useApp } from '@/lib/AppContext'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  Active: 'success',
  Paused: 'warning',
  Completed: 'neutral',
}

export const CampaignsPage: React.FC = () => {
  const { campaigns, loading } = useApp()

  if (loading && campaigns.length === 0) return <LoadingState label="Loading campaigns…" />

  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" description="All outreach campaigns with live enrollment counts from the database." />

      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" hint="The backend creates a default campaign on first use." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              All Campaigns ({campaigns.length})
            </CardTitle>
            <CardDescription>Counts computed from outreach records per campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Replied</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div className="max-w-[260px] truncate text-xs text-muted-foreground" title={c.description || ''}>
                        {c.description || '—'}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status] || 'neutral'}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.senderName} <span className="text-xs">&lt;{c.senderEmail}&gt;</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <Users2 className="h-3.5 w-3.5 text-muted-foreground" />{c.total}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{c.active}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm"><Send className="h-3.5 w-3.5 text-muted-foreground" />{c.sent}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm"><Reply className="h-3.5 w-3.5 text-muted-foreground" />{c.replied}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
