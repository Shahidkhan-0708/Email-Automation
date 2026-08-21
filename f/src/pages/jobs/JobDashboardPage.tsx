import { useEffect, useState, useCallback } from 'react'
import { Briefcase, Send, CalendarCheck, TrendingUp, UserSearch } from 'lucide-react'
import { RiseIn, useCountUp } from '@/components/motion'
import { Card, MonoLabel, LoadingState } from '@/components/ui'
import { getJobStats, type JobStats } from '@/lib/api'

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.FC<any> }) {
  const display = useCountUp(value, { duration: 1200, delay: 200 })
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-[12px] bg-ink/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-ink-dim" />
        </div>
        <MonoLabel className="text-[11px]">{label}</MonoLabel>
      </div>
      <p className="font-display text-[32px] text-ink leading-none">{display}</p>
    </Card>
  )
}

export function JobDashboardPage() {
  const [stats, setStats] = useState<JobStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const data = await getJobStats()
      setStats(data)
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) return <LoadingState label="Loading job stats…" />

  const byStatus = stats?.byStatus || {}

  return (
    <RiseIn>
      <div className="space-y-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat label="Jobs Discovered" value={stats?.totalJobs || 0} icon={Briefcase} />
          <Stat label="Applications" value={stats?.totalApplications || 0} icon={Send} />
          <Stat label="Interviews" value={stats?.interviews || 0} icon={CalendarCheck} />
          <Stat label="Offers" value={stats?.offers || 0} icon={TrendingUp} />
          <Stat label="Recruiter Outreach" value={stats?.recruiterOutreach || 0} icon={UserSearch} />
        </div>

        <Card className="p-6">
          <h3 className="font-display text-lg text-ink mb-4">Pipeline Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['discovered', 'researching', 'applying', 'applied', 'interviewing', 'offered', 'rejected'].map(s => (
              <div key={s} className="text-center p-3 rounded-[12px] bg-ink/3">
                <p className="font-mono text-[20px] text-ink">{byStatus[s] || 0}</p>
                <p className="font-mono text-[10px] text-ink-dim uppercase tracking-wider mt-1">{s}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </RiseIn>
  )
}

export default JobDashboardPage
