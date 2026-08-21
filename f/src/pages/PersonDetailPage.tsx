import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, WandSparkles, Check, X, Pencil, CornerDownLeft, Send } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Avatar, Badge, EmptyState, LoadingState, initialsOf, ScoreChip } from '@/components/ui'
import { confidenceOf } from '@/components/widgets'

export const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    contacts, profiles, outreach, reviewQueue, loading, stats,
    generateForProfile, approve, reject, runOutreach,
  } = useApp()

  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [actionBusy, setActionBusy] = useState<'approve' | 'reject' | 'edit-approve' | 'send' | null>(null)

  const contact = useMemo(() => contacts.find(c => c.id === id), [contacts, id])
  const profile = useMemo(() => profiles.find(p => p.contactId === id), [profiles, id])
  const history = useMemo(() => outreach.filter(o => o.contact_id === id), [outreach, id])
  // Pending draft from the live review queue, matched by profile id
  const pending = useMemo(
    () => reviewQueue.find(p => p.profile_id === profile?.id),
    [reviewQueue, profile]
  )
  // Latest AI draft for this profile from the backend (any status). A pending
  // review draft always wins so the freshest version is shown.
  const draft = pending ?? profile?.latestDraft ?? null

  // Enter edit mode with the current draft content
  const startEditing = () => {
    if (!draft) return
    setSubject(draft.subject)
    setBody(draft.body)
    setEditing(true)
  }

  const handleApprove = async () => {
    if (!draft || actionBusy) return
    setActionBusy('approve')
    try {
      await approve(draft.id)
    } finally {
      setActionBusy(null)
    }
  }

  const handleReject = async () => {
    if (!draft || actionBusy) return
    setActionBusy('reject')
    try {
      await reject(draft.id)
    } finally {
      setActionBusy(null)
    }
  }

  const handleApproveWithEdits = async () => {
    if (!draft || actionBusy) return
    setActionBusy('edit-approve')
    try {
      await approve(draft.id, { editedSubject: subject, editedBody: body })
      setEditing(false)
    } finally {
      setActionBusy(null)
    }
  }

  const handleSendNow = async () => {
    if (actionBusy) return
    setActionBusy('send')
    try {
      await runOutreach()
    } finally {
      setActionBusy(null)
    }
  }

  if (loading && !stats) return <LoadingState label="Loading profile…" />
  if (!contact) {
    return (
      <Card>
        <EmptyState title="Contact not found" hint="This contact may have been removed." />
        <div className="flex justify-center pb-4">
          <button onClick={() => navigate('/people')} className="press raised-sm rounded-full px-5 py-2 text-[13px] font-semibold text-ink-dim">
            Back to people
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => navigate('/people')}
            className="press raised-sm w-10 h-10 rounded-[14px] flex items-center justify-center text-ink-dim"
            aria-label="Back to people"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <MonoLabel>PROFILE · {contact.email}</MonoLabel>
        </div>
      </RiseIn>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
        <div className="flex flex-col gap-7">
          {/* identity */}
          <RiseIn delay={60}>
            <Card className="flex items-center gap-5">
              <Avatar initials={initialsOf(contact.name)} size="w-16 h-16 rounded-[20px] text-[16px]" />
              <div className="min-w-0">
                <h1 className="font-display text-[26px] text-ink leading-tight">{contact.name}</h1>
                <p className="text-[14px] text-ink-dim mt-0.5">{contact.organization || '—'}</p>
                <p className="font-mono text-[11px] text-faint mt-1">{contact.role || contact.email}</p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-2">
                <Badge tone={badgeToneFor(history[0]?.status, pending, contact, draft)}>
                  {badgeTextFor(history[0]?.status, pending, contact, draft)}
                </Badge>
              </div>
            </Card>
          </RiseIn>

          {/* outreach history */}
          <RiseIn delay={140}>
            <Card>
              <SectionTitle className="text-[18px]">Outreach history</SectionTitle>
              <p className="text-[13px] text-faint mt-0.5 mb-4">{history.length} records</p>
              {history.length === 0 ? (
                <EmptyState title="No outreach yet" hint="Enroll this contact in a campaign to begin." />
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((row, i) => (
                    <div key={row.id}>
                      {i > 0 && <div className="h-px bg-fainter/60 my-3" />}
                      <div className="flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold text-ink truncate">{row.subject || row.status}</p>
                          <p className="font-mono text-[10.5px] text-faint mt-0.5">
                            {row.campaigns?.name || 'campaign'} · {row.sent_at ? new Date(row.sent_at).toLocaleString() : 'not sent'}
                          </p>
                        </div>
                        <Badge tone={toneFor(row.status)}>{row.status}</Badge>
                        {row.ai_category && <Badge tone="blue">{row.ai_category.replace(/_/g, ' ')}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </RiseIn>
        </div>

        {/* side: personalization */}
        <RiseIn delay={200}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle className="text-[18px]">Personalization</SectionTitle>
              {profile && (
                <Pressable
                  onClick={() => generateForProfile(profile.id)}
                  className="press raised-sm rounded-[999px] px-3.5 py-2 text-[12px] font-semibold text-amber-ink flex items-center gap-1.5"
                >
                  <WandSparkles className="h-3.5 w-3.5" /> Regenerate
                </Pressable>
              )}
            </div>
            {draft ? (
              <>
                <div className="recessed rounded-[16px] p-4">
                  {editing ? (
                    <div className="flex flex-col gap-3">
                      <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="rounded-[10px] px-3 py-2 text-[14px] font-semibold text-ink bg-paper outline-none focus:ring-2 focus:ring-amber/40 recessed-sm"
                        placeholder="Subject"
                      />
                      <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={8}
                        className="rounded-[10px] px-3 py-2 text-[12.5px] text-ink-soft leading-relaxed bg-paper outline-none focus:ring-2 focus:ring-amber/40 resize-y recessed-sm"
                        placeholder="Email body"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-display italic text-[14px] text-ink mb-2">"{draft.subject}"</p>
                      <p className="text-[12.5px] text-ink-soft leading-relaxed line-clamp-6 whitespace-pre-line">{draft.body}</p>
                    </>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <ScoreChip score={confidenceOf(draft)} />
                    <Badge tone={draft.status === 'pending_review' ? 'amber' : 'sage'}>
                      {draft.status === 'pending_review' ? 'pending review' : draft.status}
                    </Badge>
                  </div>
                </div>

                {/* action buttons */}
                {draft.status === 'pending_review' && (
                  <div className="flex flex-col gap-2.5 mt-4">
                    <div className="flex items-center gap-2.5">
                      <Pressable
                        onClick={handleApprove}
                        disabled={actionBusy !== null}
                        className="press flex-1 bg-sage text-white rounded-[14px] px-4 py-3 text-[13px] font-bold flex items-center justify-center gap-2 hover:brightness-105 transition-[filter] disabled:opacity-50 disabled:transform-none"
                      >
                        {actionBusy === 'approve' ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve & send
                      </Pressable>
                      <Pressable
                        onClick={handleReject}
                        disabled={actionBusy !== null}
                        className="press raised-sm rounded-[14px] px-4 py-3 text-[13px] font-semibold text-terra-ink flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
                      >
                        {actionBusy === 'reject' ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-terra/30 border-t-terra rounded-full" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                        Reject
                      </Pressable>
                    </div>
                    {editing ? (
                      <div className="flex items-center gap-2.5">
                        <Pressable
                          onClick={handleApproveWithEdits}
                          disabled={actionBusy !== null}
                          className="press flex-1 raised-sm rounded-[14px] px-4 py-2.5 text-[12px] font-semibold text-amber-ink flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
                        >
                          {actionBusy === 'edit-approve' ? (
                            <span className="animate-spin h-3 w-3 border-2 border-amber/30 border-t-amber rounded-full" />
                          ) : (
                            <CornerDownLeft className="h-3 w-3" />
                          )}
                          Approve with edits
                        </Pressable>
                        <Pressable
                          onClick={() => setEditing(false)}
                          disabled={actionBusy !== null}
                          className="press raised-sm rounded-[14px] px-4 py-2.5 text-[12px] font-semibold text-ink-dim disabled:opacity-50 disabled:transform-none"
                        >
                          Cancel
                        </Pressable>
                      </div>
                    ) : (
                      <Pressable
                        onClick={startEditing}
                        disabled={actionBusy !== null}
                        className="press raised-sm rounded-[14px] px-4 py-2.5 text-[12px] font-semibold text-ink-dim flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
                      >
                        <Pencil className="h-3 w-3" /> Edit draft
                      </Pressable>
                    )}
                  </div>
                )}

                {draft.status === 'approved' && (
                  <div className="flex items-center gap-2.5 mt-4">
                    <Pressable
                      onClick={handleSendNow}
                      disabled={actionBusy !== null}
                      className="press flex-1 bg-amber text-white rounded-[14px] px-4 py-3 text-[13px] font-bold flex items-center justify-center gap-2 hover:brightness-105 transition-[filter] disabled:opacity-50 disabled:transform-none"
                    >
                      {actionBusy === 'send' ? (
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Send now
                    </Pressable>
                    <Pressable
                      onClick={() => setEditing(true)}
                      disabled={actionBusy !== null}
                      className="press raised-sm rounded-[14px] px-4 py-3 text-[13px] font-semibold text-ink-dim flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Pressable>
                  </div>
                )}
              </>
            ) : contact.personalization ? (
              <div className="recessed rounded-[16px] p-4">
                <p className="font-display italic text-[14px] text-ink mb-2">"{contact.personalization}"</p>
                <Badge tone="sage" className="mt-2">{contact.personalizationApproved ? 'approved' : 'generated'}</Badge>
              </div>
            ) : (
              <EmptyState
                title="No draft yet"
                hint={profile ? 'Generate a personalization for this profile.' : 'No research profile linked — enrichment is a prerequisite.'}
              />
            )}
          </Card>
        </RiseIn>
      </div>
    </div>
  )
}

function toneFor(s: string): 'amber' | 'sage' | 'blue' | 'terra' | 'neutral' {
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
  return map[s] || 'neutral'
}

function badgeToneFor(
  status: string | undefined,
  pending: { status: string } | null | undefined,
  contact: { personalizationApproved: boolean | null } | null,
  draft: { status: string } | null
): 'amber' | 'sage' | 'blue' | 'neutral' {
  if (status && ['Sent', 'Delivered', 'Follow-up 1', 'Follow-up 2', 'Replied', 'Closed'].includes(status)) return 'sage'
  if (pending?.status === 'pending_review') return 'amber'
  if (contact?.personalizationApproved) return 'sage'
  if (draft) return 'amber'
  return 'neutral'
}

function badgeTextFor(
  status: string | undefined,
  pending: { status: string } | null | undefined,
  contact: { personalizationApproved: boolean | null } | null,
  draft: { status: string } | null
): string {
  if (status && ['Sent', 'Delivered', 'Follow-up 1', 'Follow-up 2', 'Replied', 'Closed'].includes(status)) {
    return status === 'Replied' ? 'replied' : 'sent'
  }
  if (pending?.status === 'pending_review') return 'pending review'
  if (contact?.personalizationApproved) return 'ready to send'
  if (draft) return 'draft ready'
  return 'no draft'
}
