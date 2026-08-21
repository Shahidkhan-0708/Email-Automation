import { useEffect, useState, useCallback } from 'react'
import { Briefcase, Send, Clock, ArrowRight } from 'lucide-react'
import { RiseIn } from '@/components/motion'
import { Card, LoadingState } from '@/components/ui'
import { getJobTimeline, getJobStats, type TimelineEvent, type JobStats } from '@/lib/api'

const EVENT_ICONS: Record<string, typeof Briefcase> = {
  job: Briefcase,
  job_update: ArrowRight,
  application: Send,
  follow_up: Clock,
}

const EVENT_COLORS: Record<string, string> = {
  job: 'bg-blue-soft/10 text-blue-soft',
  job_update: 'bg-purple-soft/10 text-purple-soft',
  application: 'bg-sage-bright/10 text-sage-bright',
  follow_up: 'bg-amber/10 text-amber',
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-ink-dim uppercase tracking-wider">{label}</span>
        <span className="font-mono text-ink">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function JobTrackingPage() {
  const [stats, setStats] = useState<JobStats | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([getJobStats(), getJobTimeline()])
      setStats(s)
      setEvents(t)
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <LoadingState label="Loading job tracking…" />

  const total = stats?.totalJobs || 1

  return (
    <RiseIn>
      <div className="space-y-7">
        <div>
          <h2 className="font-display text-2xl text-ink">Job Tracking</h2>
          <p className="text-sm text-ink-dim mt-1">Visual timeline and funnel of your job search journey</p>
        </div>

        {/* Funnel */}
        <Card className="p-6">
          <h3 className="font-display text-lg text-ink mb-4">Pipeline Funnel</h3>
          <div className="space-y-3">
            <FunnelBar label="Discovered" value={stats?.byStatus?.discovered || 0} total={total} color="bg-blue-soft" />
            <FunnelBar label="Researching" value={stats?.byStatus?.researching || 0} total={total} color="bg-amber" />
            <FunnelBar label="Applying" value={stats?.byStatus?.applying || 0} total={total} color="bg-purple-soft" />
            <FunnelBar label="Applied" value={stats?.byStatus?.applied || 0} total={total} color="bg-sage-bright" />
            <FunnelBar label="Interviewing" value={stats?.byStatus?.interviewing || 0} total={total} color="bg-amber" />
            <FunnelBar label="Offered" value={stats?.byStatus?.offered || 0} total={total} color="bg-sage-bright" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-ink/5">
            <div className="text-center">
              <p className="font-mono text-xl text-ink">{stats?.totalApplications || 0}</p>
              <p className="text-[10px] text-ink-dim uppercase tracking-wider">Applications</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xl text-ink">{stats?.interviews || 0}</p>
              <p className="text-[10px] text-ink-dim uppercase tracking-wider">Interviews</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xl text-ink">{stats?.offers || 0}</p>
              <p className="text-[10px] text-ink-dim uppercase tracking-wider">Offers</p>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6">
          <h3 className="font-display text-lg text-ink mb-4">Activity Timeline</h3>
          {events.length === 0 ? (
            <p className="text-sm text-ink-dim">No activity yet. Start adding jobs to see your timeline.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 20).map((ev, i) => {
                const Icon = EVENT_ICONS[ev.type] || Briefcase
                const color = EVENT_COLORS[ev.type] || 'bg-ink/5 text-ink-dim'
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{ev.title}</p>
                      <p className="text-xs text-ink-dim">{ev.detail}</p>
                    </div>
                    <span className="text-[10px] text-ink-dim shrink-0">
                      {new Date(ev.date).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </RiseIn>
  )
}

export default JobTrackingPage
