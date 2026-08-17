import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, WandSparkles } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Avatar, Badge, EmptyState, LoadingState, initialsOf, ScoreChip } from '@/components/ui'
import { confidenceOf } from '@/components/widgets'

export const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { contacts, profiles, outreach, reviewQueue, loading, stats, generateForProfile } = useApp()

  const contact = useMemo(() => contacts.find(c => c.id === id), [contacts, id])
  const profile = useMemo(() => profiles.find(p => p.contactId === id), [profiles, id])
  const history = useMemo(() => outreach.filter(o => o.contact_id === id), [outreach, id])
  const pending = useMemo(
    () => reviewQueue.find(p => (Array.isArray(p.profiles?.contacts) ? p.profiles.contacts[0]?.id === id : p.profiles?.contacts?.id === id)),
    [reviewQueue, id]
  )

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

      <div className="grid grid-cols-[1fr_360px] gap-7 items-start">
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
                <Badge tone={contact.personalizationApproved ? 'sage' : 'amber'}>
                  {contact.personalizationApproved ? 'ready to send' : 'draft ready'}
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
            {pending ? (
              <div className="recessed rounded-[16px] p-4">
                <p className="font-display italic text-[14px] text-ink mb-2">“{pending.subject}”</p>
                <p className="text-[12.5px] text-ink-soft leading-relaxed line-clamp-6 whitespace-pre-line">{pending.body}</p>
                <div className="flex items-center justify-between mt-3">
                  <ScoreChip score={confidenceOf(pending)} />
                  <Badge tone="amber">pending review</Badge>
                </div>
              </div>
            ) : contact.personalization ? (
              <div className="recessed rounded-[16px] p-4">
                <p className="font-display italic text-[14px] text-ink mb-2">“{contact.personalization}”</p>
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
