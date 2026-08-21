import { useEffect, useState, useCallback } from 'react'
import { MessageSquare, Clock } from 'lucide-react'
import { RiseIn } from '@/components/motion'
import { Card, LoadingState } from '@/components/ui'
import { getFollowUps, type JobApplication } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-soft/15 text-blue-soft border-blue-soft/25',
  pending_response: 'bg-amber/15 text-amber border-amber/25',
  interview: 'bg-sage-bright/15 text-sage-bright border-sage-bright/25',
  offered: 'bg-sage-bright/25 text-sage-bright border-sage-bright/35',
  rejected: 'bg-ink-dim/10 text-ink-dim border-ink-dim/20',
}

function formatDue(dateStr: string) {
  const now = new Date()
  const due = new Date(dateStr)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  return `Due in ${diffDays}d`
}

export function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const data = await getFollowUps()
      setFollowUps(data)
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <LoadingState label="Loading follow-ups…" />

  return (
    <RiseIn>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Follow-ups</h2>
          <p className="text-sm text-ink-dim mt-1">Pending follow-ups for your applications and recruiter outreach</p>
        </div>

        {followUps.length === 0 ? (
          <Card className="p-10 text-center">
            <MessageSquare className="w-10 h-10 text-ink-dim/40 mx-auto mb-3" />
            <p className="font-display text-lg text-ink">No pending follow-ups</p>
            <p className="text-sm text-ink-dim mt-1">When you schedule follow-ups on applications, they'll appear here</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {followUps.map(app => (
              <Card key={app.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[12px] bg-amber/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{app.jobs?.title || 'Unknown Job'}</p>
                  <p className="text-sm text-ink-dim">{app.jobs?.company || ''} · Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${STATUS_COLORS[app.status] || 'bg-ink/5 text-ink-dim border-ink/10'}`}>
                  {app.status.replace('_', ' ')}
                </span>
                {app.next_follow_up && (
                  <span className="shrink-0 text-[11px] text-amber font-medium">
                    {formatDue(app.next_follow_up)}
                  </span>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </RiseIn>
  )
}

export default FollowUpsPage
