import React, { useState } from 'react'
import { CheckCircle2, XCircle, Pencil, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PageHeader, LoadingState, EmptyState, formatDate } from './shared'
import { useApp } from '@/lib/AppContext'
import type { Personalization } from '@/lib/api'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'ai' | 'neutral'> = {
  pending_review: 'info',
  approved: 'success',
  rejected: 'destructive',
  edited: 'warning',
}

function contactName(p: Personalization): string {
  const prof = p.profiles
  const c = prof && 'contacts' in prof ? (Array.isArray(prof.contacts) ? prof.contacts[0] : prof.contacts) : null
  return prof?.full_name || c?.name || p.profile_id.slice(0, 8)
}

export const ReviewPage: React.FC = () => {
  const { reviewQueue, loading, approve, reject, bulkApproveAndSend } = useApp()
  const [editing, setEditing] = useState<Personalization | null>(null)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  if (loading && reviewQueue.length === 0) return <LoadingState label="Loading review queue…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Review Queue"
        description="Approve, reject or edit AI-generated personalizations before they are dispatched."
        actions={
          reviewQueue.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Approve All & Send ({reviewQueue.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve {reviewQueue.length} personalization{reviewQueue.length > 1 ? 's' : ''} and send?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This approves every item in the queue and dispatches the outreach emails immediately. Sent emails cannot be recalled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => bulkApproveAndSend()}>Approve & Send</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      />

      {reviewQueue.length === 0 ? (
        <EmptyState
          title="Review queue is empty"
          hint="Generate personalizations from the AI Multi-Variant page — profiles need enrichment data first."
        />
      ) : (
        <div className="space-y-4">
          {reviewQueue.map(p => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{contactName(p)}</span>
                    <Badge variant={STATUS_VARIANT[p.status] || 'neutral'}>{p.status.replace('_', ' ')}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">generated {formatDate(p.created_at)}</span>
                </div>

                <div className="mb-2 text-sm font-semibold text-primary">{p.subject || '(no subject)'}</div>
                <p className="mb-3 line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">{p.body}</p>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => { setBusy(p.id); try { await approve(p.id); } finally { setBusy(null) } }}
                    disabled={busy === p.id}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => { setBusy(p.id); try { await reject(p.id, 'Rejected from review queue'); } finally { setBusy(null) } }}
                    disabled={busy === p.id}
                  >
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditing(p); setEditedSubject(p.subject || ''); setEditedBody(p.body || ''); setComment('') }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit & Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit & Approve dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit & Approve Personalization</DialogTitle>
            <DialogDescription>
              Saving sends an approval with your edited copy; the outreach email will use these fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-subject">Subject</Label>
              <Input id="edit-subject" value={editedSubject} onChange={e => setEditedSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-body">Body</Label>
              <Textarea id="edit-body" value={editedBody} onChange={e => setEditedBody(e.target.value)} className="min-h-[220px] font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-comment">Reviewer comment (optional)</Label>
              <Input id="edit-comment" value={comment} onChange={e => setComment(e.target.value)} placeholder="e.g. Tightened the CTA" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!editing) return
                await approve(editing.id, { comments: comment, editedSubject, editedBody })
                setEditing(null)
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve with Edits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
