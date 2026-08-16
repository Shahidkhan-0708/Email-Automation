import React, { useState } from 'react'
import { Search, UserPlus, Dna } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader, LoadingState, EmptyState, formatDate } from './shared'
import { useApp } from '@/lib/AppContext'

export const ContactsPage: React.FC<{ variant?: 'research' }> = ({ variant }) => {
  const { contacts, profiles, loading, createLead } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', organization: '', role: '' })
  const [saving, setSaving] = useState(false)

  if (variant === 'research') {
    return (
      <div className="space-y-6">
        <PageHeader title="Context & Vision" description="Enriched profiles: one profile per contact, ready for AI personalization." />
        {loading && profiles.length === 0 ? <LoadingState label="Loading profiles…" /> : profiles.length === 0 ? (
          <EmptyState title="No profiles yet" hint="Profiles are created automatically when leads are imported." />
        ) : (
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Organization / Role</TableHead>
                    <TableHead>Facts</TableHead>
                    <TableHead>Personalization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Dna className="h-4 w-4 text-accent" />
                          {p.fullName || p.id.slice(0, 8)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.contactEmail || p.contactName || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.organization || '—'}{p.role ? ` · ${p.role}` : ''}</TableCell>
                      <TableCell><Badge variant={p.enrichmentCount > 0 ? 'success' : 'neutral'}>{p.enrichmentCount} facts</Badge></TableCell>
                      <TableCell>
                        {p.personalizationStatus ? (
                          <StatusBadge status={p.personalizationStatus === 'pending_review' ? 'Pending Review' : p.personalizationStatus === 'approved' ? 'Approved' : p.personalizationStatus === 'edited' ? 'Edited' : 'Rejected'} />
                        ) : (
                          <span className="text-xs text-muted-foreground">not generated</span>
                        )}
                      </TableCell>
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

  const filtered = contacts.filter(c =>
    !search || `${c.name} ${c.email} ${c.organization || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const onSubmit = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      await createLead({ name: form.name, email: form.email, organization: form.organization || undefined, role: form.role || undefined })
      setForm({ name: '', email: '', organization: '', role: '' })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts & Profiles"
        description="Everyone in the database, with their outreach enrollment state."
        actions={
          <Button onClick={() => setShowForm(s => !s)}>
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
            <Input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Organization" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} />
            <Input placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            <Button onClick={onSubmit} disabled={!form.name || !form.email || saving}>
              {saving ? 'Saving…' : 'Create'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-3 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, email, org…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading && contacts.length === 0 ? <LoadingState label="Loading contacts…" /> : filtered.length === 0 ? (
            <EmptyState title="No contacts match" hint="Try a different search, or import leads first." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Outreach</TableHead>
                  <TableHead>Personalization</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.organization || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.role || '—'}</TableCell>
                    <TableCell>
                      {c.outreach.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.outreach.map((o, i) => <StatusBadge key={i} status={o.status} />)}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">not enrolled</span>}
                    </TableCell>
                    <TableCell>
                      {c.personalizationApproved
                        ? <Badge variant="success">approved</Badge>
                        : c.personalization
                          ? <Badge variant="warning">pending</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
