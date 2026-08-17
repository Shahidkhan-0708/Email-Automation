import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Avatar, Badge, EmptyState, LoadingState, initialsOf } from '@/components/ui'
import { statusColor } from '@/components/widgets'
import { cn } from '@/lib/utils'

export const PeoplePage: React.FC = () => {
  const { contacts, loading, stats, createLead } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.organization ?? '').toLowerCase().includes(q)
    )
  }, [contacts, query])

  if (loading && !stats) return <LoadingState label="Loading people…" />

  const submit = async () => {
    if (!name.trim() || !email.trim()) return
    await createLead({ name: name.trim(), email: email.trim(), organization: org.trim() || undefined })
    setName('')
    setEmail('')
    setOrg('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <SectionTitle className="text-[18px]">People</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5">{contacts.length} contacts in the database</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="recessed-sm rounded-[999px] flex items-center gap-2 px-4 py-2.5 w-72">
              <Search className="h-4 w-4 text-faint shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search name, email, institution…"
                className="bg-transparent text-[13px] text-ink outline-none w-full placeholder:text-faint"
              />
            </div>
            <Pressable
              onClick={() => setAdding(a => !a)}
              className="press raised-sm rounded-[999px] px-4 py-2.5 text-[13px] font-semibold text-amber-ink flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add lead
            </Pressable>
          </div>
        </Card>
      </RiseIn>

      {adding && (
        <RiseIn delay={60}>
          <Card className="p-5 flex items-end gap-3 flex-wrap">
            <Field label="Name" value={name} onChange={setName} />
            <Field label="Email" value={email} onChange={setEmail} />
            <Field label="Institution (optional)" value={org} onChange={setOrg} />
            <Pressable onClick={submit} className="press bg-sage text-white rounded-[999px] px-6 py-3 text-[13px] font-bold">
              Add to pipeline
            </Pressable>
          </Card>
        </RiseIn>
      )}

      <RiseIn delay={120}>
        <Card className="px-6 py-5">
          <div className="flex items-end justify-between mb-4">
            <SectionTitle className="text-[18px]">Contacts</SectionTitle>
            <MonoLabel>{filtered.length} shown</MonoLabel>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No contacts match" hint={contacts.length === 0 ? 'Import a leads file or add a lead manually.' : 'Try a different search.'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                    <th className="pb-3 font-medium">Person</th>
                    <th className="pb-3 font-medium">Institution</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const status = c.outreach?.[0]?.status || (c.personalizationApproved ? 'Ready' : 'Enrolled')
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/people/${c.id}`)}
                        className="cursor-pointer group border-t border-fainter/50 transition-colors hover:bg-surface/60"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar initials={initialsOf(c.name)} size="w-10 h-10 rounded-[13px] text-[10px]" />
                            <div className="min-w-0">
                              <p className="text-[13.5px] font-semibold text-ink truncate">{c.name}</p>
                              <p className="font-mono text-[10.5px] text-faint truncate">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-[13px] text-ink-dim">{c.organization || '—'}</td>
                        <td className="py-3">
                          <Badge tone={statusTone(status)}>{status}</Badge>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-faint">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </RiseIn>

      <p className="font-mono text-[10px] text-faint px-1">
        <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: statusColor('Ready') }} />
        enrolled ·{' '}
        <span className="w-2 h-2 rounded-full inline-block mx-1.5" style={{ background: statusColor('Sent') }} />
        sent ·{' '}
        <span className="w-2 h-2 rounded-full inline-block mx-1.5" style={{ background: statusColor('Replied') }} />
        replied
      </p>
    </div>
  )
}

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</label>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn('recessed-sm rounded-[14px] px-4 py-2.5 text-[13px] text-ink bg-paper outline-none focus:ring-2 focus:ring-amber/40 w-64')}
    />
  </div>
)

function statusTone(s: string): 'amber' | 'sage' | 'blue' | 'terra' | 'neutral' {
  const map: Record<string, 'amber' | 'sage' | 'blue' | 'terra' | 'neutral'> = {
    Sent: 'sage',
    Delivered: 'sage',
    Ready: 'blue',
    Enrolled: 'neutral',
    Sending: 'amber',
    Replied: 'blue',
    Bounced: 'terra',
    Error: 'terra',
  }
  return map[s] || 'neutral'
}
