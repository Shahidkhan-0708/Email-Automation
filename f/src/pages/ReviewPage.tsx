import React, { useEffect, useMemo, useState } from 'react'
import { Check, X, Pencil, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/AppContext'
import type { Personalization } from '@/lib/api'
import { confidenceOf } from '@/components/widgets'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Avatar, ScoreChip, Badge, EmptyState, LoadingState, initialsOf } from '@/components/ui'

interface EvidenceChip {
  label: string
  confidence: number | null
}

function evidenceOf(p: Personalization): EvidenceChip[] {
  const raw = Array.isArray(p.evidence_used) ? p.evidence_used : []
  if (raw.length === 0) {
    return []
  }
  return raw.slice(0, 4).map((e, i) => {
    if (typeof e === 'string') return { label: e, confidence: null }
    const o = e as Record<string, unknown>
    return {
      // relationship (publication/bio/news) reads better than raw source ids.
      label: String(o.relationship ?? o.label ?? o.title ?? o.source ?? `Evidence ${i + 1}`),
      // null when no confidence recorded for this fact — shown as "—".
      confidence: typeof o.confidence === 'number' ? o.confidence : null,
    }
  })
}

const KBD_HINT: [string, string][] = [
  ['J', 'next'],
  ['K', 'previous'],
  ['A', 'approve'],
  ['R', 'reject'],
]

export const ReviewPage: React.FC = () => {
  const { reviewQueue, loading, stats, approve, reject, refreshReviewQueue } = useApp()
  const [index, setIndex] = useState(0)
  const [compact, setCompact] = useState(false)
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const current = reviewQueue[index] ?? null
  const confidence = current ? confidenceOf(current) : null
  const needsHuman = confidence != null && confidence < 0.8

  useEffect(() => setIndex(i => Math.min(i, Math.max(0, reviewQueue.length - 1))), [reviewQueue.length])
  useEffect(() => {
    if (current) {
      setSubject(current.edited_subject ?? current.subject)
      setBody(current.edited_body ?? current.body)
      setEditing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  const contactName = useMemo(() => {
    if (!current) return ''
    const profile = current.profiles
    const contact = Array.isArray(profile?.contacts) ? profile.contacts[0] : profile?.contacts
    return profile?.full_name || contact?.name || 'Unnamed contact'
  }, [current])

  const org = useMemo(() => {
    if (!current) return ''
    const profile = current.profiles
    const contact = Array.isArray(profile?.contacts) ? profile.contacts[0] : profile?.contacts
    return profile?.organization || contact?.organization || '—'
  }, [current])

  const go = (delta: number) => setIndex(i => Math.max(0, Math.min(reviewQueue.length - 1, i + delta)))

  // keyboard shortcuts — scoped to this page only
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing) return
      switch (e.key.toLowerCase()) {
        case 'j':
          e.preventDefault()
          go(1)
          break
        case 'k':
          e.preventDefault()
          go(-1)
          break
        case 'a':
          if (current) approve(current.id)
          break
        case 'r':
          if (current) reject(current.id)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, editing, reviewQueue.length])

  if (loading && !stats) return <LoadingState label="Loading review queue…" />

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <SectionTitle className="text-[18px]">Review queue</SectionTitle>
              <p className="text-[13px] text-faint mt-0.5">{reviewQueue.length} drafts · human in the loop</p>
            </div>
            <Badge tone="amber">{reviewQueue.length} pending</Badge>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 font-mono text-[10px] text-faint">
              {KBD_HINT.map(([k, label]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <kbd className="recessed-sm rounded-[6px] px-1.5 py-0.5 text-[9px] text-ink-dim font-semibold">{k}</kbd>
                  {label}
                </span>
              ))}
            </div>
            <Pressable
              onClick={() => setCompact(c => !c)}
              className={cn('press raised-sm rounded-full px-4 py-2 text-[12px] font-semibold', compact ? 'recessed text-amber' : 'text-ink-dim')}
            >
              {compact ? 'Compact on' : 'Compact off'}
            </Pressable>
          </div>
        </Card>
      </RiseIn>

      {reviewQueue.length === 0 ? (
        <Card>
          <EmptyState title="Queue is clear" hint="Approve or reject drafts as they land. Keyboard: J next · K previous · A approve · R reject." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-7 items-start">
          {/* queue rail */}
          <RiseIn delay={80}>
            <Card className="p-4 flex flex-col gap-1 max-h-[600px] overflow-y-auto">
              {reviewQueue.map((p, i) => {
                const c = confidenceOf(p)
                return (
                <button
                  key={p.id}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-colors duration-150',
                    i === index ? 'recessed-sm' : 'hover:bg-surface'
                  )}
                >
                  <Avatar
                    initials={initialsOf(contactNameOf(p))}
                    size="w-9 h-9 rounded-[12px] text-[10px]"
                    tone={c != null && c < 0.8 ? 'terra' : 'default'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink truncate">{contactNameOf(p)}</p>
                    <p className="font-mono text-[10px] text-faint truncate">{p.subject}</p>
                  </div>
                  <span className="font-mono text-[10px] text-faint">{i + 1}</span>
                </button>
                )
              })}
            </Card>
          </RiseIn>

          {/* detail pane */}
          <RiseIn delay={160}>
            <Card className="flex flex-col gap-6">
              {current && (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar initials={initialsOf(contactName)} size="w-14 h-14 rounded-[18px] text-[14px]" tone={needsHuman ? 'terra' : 'default'} />
                      <div>
                        <p className="font-display text-[20px] text-ink leading-tight">{contactName}</p>
                        <p className="text-[13px] text-faint">{org}</p>
                        <p className="font-mono text-[10px] text-faint mt-1">
                          queue position {index + 1} of {reviewQueue.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ScoreChip score={confidence} className="text-[13px] px-3 py-1.5" />
                      {needsHuman && <Badge tone="terra">needs human</Badge>}
                    </div>
                  </div>

                  {/* evidence */}
                  <div>
                    <MonoLabel className="mb-2">Evidence</MonoLabel>
                    {evidenceOf(current).length === 0 ? (
                      <p className="font-mono text-[11px] text-faint">No evidence recorded for this draft.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {evidenceOf(current).map((e, i) => (
                          <span
                            key={i}
                            className="recessed-sm rounded-[999px] px-3 py-1.5 font-mono text-[10.5px] text-ink-dim flex items-center gap-2"
                          >
                            {e.label}
                            <span className="text-amber-ink">{e.confidence != null ? e.confidence.toFixed(2) : '—'}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* draft */}
                  <div>
                    <MonoLabel className="mb-2">AI draft</MonoLabel>
                    {editing ? (
                      <div className="flex flex-col gap-3">
                        <input
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          className="recessed-sm rounded-[14px] px-4 py-3 text-[14px] font-semibold text-ink bg-paper outline-none focus:ring-2 focus:ring-amber/40"
                        />
                        <textarea
                          value={body}
                          onChange={e => setBody(e.target.value)}
                          rows={12}
                          className="recessed-sm rounded-[14px] px-4 py-3 text-[13.5px] leading-relaxed text-ink bg-paper outline-none focus:ring-2 focus:ring-amber/40 resize-y"
                        />
                      </div>
                    ) : (
                      <div className="recessed rounded-[16px] p-5">
                        <p className="font-display italic text-[16px] text-ink mb-3">“{subject}”</p>
                        <p className="text-[13.5px] text-ink-soft leading-relaxed whitespace-pre-line">{body}</p>
                      </div>
                    )}
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-3 pt-2 border-t border-fainter/60">
                    <Pressable
                      onClick={() => approve(current.id)}
                      className="press bg-sage text-white rounded-full px-6 py-3 text-[14px] font-bold flex items-center gap-2 hover:brightness-105 transition-[filter]"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Pressable>
                    <Pressable
                      onClick={() => reject(current.id)}
                      className="press raised-sm rounded-full px-6 py-3 text-[14px] font-semibold text-terra-ink flex items-center gap-2"
                    >
                      <X className="h-4 w-4" /> Reject
                    </Pressable>
                    {editing ? (
                      <Pressable
                        onClick={() => approve(current.id, { editedSubject: subject, editedBody: body })}
                        className="press raised-sm rounded-full px-5 py-3 text-[14px] font-semibold text-amber-ink flex items-center gap-2 ml-auto"
                      >
                        <CornerDownLeft className="h-4 w-4" /> Approve with edits
                      </Pressable>
                    ) : (
                      <Pressable
                        onClick={() => setEditing(true)}
                        className="press raised-sm rounded-full px-5 py-3 text-[14px] font-semibold text-ink-dim flex items-center gap-2 ml-auto"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Pressable>
                    )}
                  </div>
                </>
              )}
            </Card>
          </RiseIn>
        </div>
      )}

      <button className="self-end font-mono text-[10px] text-faint hover:text-ink-dim transition-colors" onClick={() => refreshReviewQueue()}>
        refresh queue
      </button>
    </div>
  )
}

function contactNameOf(p: Personalization): string {
  const profile = p.profiles
  const contact = Array.isArray(profile?.contacts) ? profile.contacts[0] : profile?.contacts
  return profile?.full_name || contact?.name || 'Unnamed'
}
