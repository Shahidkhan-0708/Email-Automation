import { useEffect, useState, useCallback } from 'react'
import { UserSearch, Plus, Mail, ExternalLink, Trash2 } from 'lucide-react'
import { RiseIn } from '@/components/motion'
import { Card, LoadingState } from '@/components/ui'
import { getRecruiterOutreach, createRecruiterOutreach, updateRecruiterOutreach, deleteRecruiterOutreach, getJobs, type RecruiterOutreach, type Job } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-ink/5 text-ink-dim border-ink/10',
  sent: 'bg-blue-soft/15 text-blue-soft border-blue-soft/25',
  replied: 'bg-sage-bright/15 text-sage-bright border-sage-bright/25',
  meeting_scheduled: 'bg-amber/15 text-amber border-amber/25',
  closed: 'bg-ink-dim/10 text-ink-dim border-ink-dim/20',
}

function CreateModal({ onClose, onAdd, jobs }: { onClose: () => void; onAdd: (r: RecruiterOutreach) => void; jobs: Job[] }) {
  const [form, setForm] = useState({ recruiter_name: '', recruiter_email: '', company: '', linkedin_url: '', message: '', job_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.recruiter_name || !form.recruiter_email) { setError('Name and email required.'); return }
    setSaving(true); setError('')
    try {
      const data: any = { ...form }
      if (!data.job_id) delete data.job_id
      const result = await createRecruiterOutreach(data)
      onAdd(result)
      onClose()
    } catch (err: any) { setError(err.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-display text-xl text-ink">New Recruiter Outreach</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Recruiter name *" value={form.recruiter_name} onChange={e => setForm(f => ({ ...f, recruiter_name: e.target.value }))} className="input-field" />
            <input placeholder="Recruiter email *" value={form.recruiter_email} onChange={e => setForm(f => ({ ...f, recruiter_email: e.target.value }))} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="input-field" />
            <input placeholder="LinkedIn URL" value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} className="input-field" />
          </div>
          <select value={form.job_id} onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))} className="input-field">
            <option value="">Link to a job (optional)</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} @ {j.company}</option>)}
          </select>
          <textarea placeholder="Message draft" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="input-field min-h-[80px] resize-y" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="press px-4 py-2 rounded-[10px] text-[13px] text-ink-dim hover:bg-ink/5">Cancel</button>
            <button type="submit" disabled={saving} className="press raised-sm px-4 py-2 rounded-[10px] text-[13px] font-semibold">{saving ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function RecruiterOutreachPage() {
  const [outreach, setOutreach] = useState<RecruiterOutreach[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [out, jbs] = await Promise.all([getRecruiterOutreach(), getJobs()])
      setOutreach(out)
      setJobs(jbs)
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusChange = async (item: RecruiterOutreach, status: string) => {
    try {
      const updated = await updateRecruiterOutreach(item.id, { status } as any)
      setOutreach(prev => prev.map(o => o.id === item.id ? { ...o, ...updated } : o))
    } catch { /* empty */ }
  }

  const handleDelete = async (item: RecruiterOutreach) => {
    if (!confirm(`Delete outreach to ${item.recruiter_name}?`)) return
    try {
      await deleteRecruiterOutreach(item.id)
      setOutreach(prev => prev.filter(o => o.id !== item.id))
    } catch { /* empty */ }
  }

  if (loading) return <LoadingState label="Loading recruiter outreach…" />

  return (
    <RiseIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-ink">Recruiter Outreach</h2>
            <p className="text-sm text-ink-dim mt-1">Track and manage outreach to recruiters and hiring managers</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="press raised-sm flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold">
            <Plus className="w-4 h-4" /> New Outreach
          </button>
        </div>

        {outreach.length === 0 ? (
          <Card className="p-10 text-center">
            <UserSearch className="w-10 h-10 text-ink-dim/40 mx-auto mb-3" />
            <p className="font-display text-lg text-ink">No recruiter outreach yet</p>
            <p className="text-sm text-ink-dim mt-1">Create your first outreach record to start tracking recruiter conversations</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {outreach.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-ink-dim" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{item.recruiter_name}</p>
                    <p className="text-sm text-ink-dim">
                      {item.company || 'Unknown company'}
                      {item.jobs ? ` · ${item.jobs.title}` : ''}
                      {' · '}{item.recruiter_email}
                    </p>
                  </div>
                  <select
                    value={item.status}
                    onChange={e => handleStatusChange(item, e.target.value)}
                    className={`appearance-none px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border cursor-pointer bg-transparent ${STATUS_COLORS[item.status] || 'bg-ink/5 text-ink-dim border-ink/10'}`}
                  >
                    {['draft', 'sent', 'replied', 'meeting_scheduled', 'closed'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  {item.linkedin_url && (
                    <a href={item.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-ink-dim hover:text-ink">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(item)} className="text-ink-dim hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {item.message && (
                  <div className="mt-3 pt-3 border-t border-ink/5">
                    <p className="text-xs text-ink-dim whitespace-pre-wrap line-clamp-3">{item.message}</p>
                  </div>
                )}
                <p className="text-[10px] text-ink-dim mt-2">Created {new Date(item.created_at).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onAdd={r => setOutreach(prev => [r, ...prev])} jobs={jobs} />}
    </RiseIn>
  )
}

export default RecruiterOutreachPage
