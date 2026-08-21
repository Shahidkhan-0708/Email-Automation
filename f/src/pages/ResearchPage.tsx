import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { SearchCheck, Globe, FileText, Landmark, Newspaper, Loader2, RefreshCw, PlayCircle, Check, Link, Briefcase, GraduationCap, Users, MessageSquare } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import {
  getEnrichmentResults,
  runResearch,
  runResearchBatch,
  getResearchStatus,
  type EnrichmentResult,
  type ResearchJob,
  type ResearchStatus,
} from '@/lib/api'
import { RiseIn } from '@/components/motion'
import { Card, SectionTitle, Avatar, Badge, initialsOf, LoadingState, MonoLabel } from '@/components/ui'
import { cn } from '@/lib/utils'

const RELATIONSHIP_ICONS: Record<string, React.ReactNode> = {
  headline: <Link className="h-3.5 w-3.5" />,
  bio: <Globe className="h-3.5 w-3.5" />,
  profile: <Globe className="h-3.5 w-3.5" />,
  experience: <Briefcase className="h-3.5 w-3.5" />,
  education: <GraduationCap className="h-3.5 w-3.5" />,
  skills: <FileText className="h-3.5 w-3.5" />,
  followers: <Users className="h-3.5 w-3.5" />,
  location: <Globe className="h-3.5 w-3.5" />,
  post: <MessageSquare className="h-3.5 w-3.5" />,
  publication: <FileText className="h-3.5 w-3.5" />,
  grant: <Landmark className="h-3.5 w-3.5" />,
  news: <Newspaper className="h-3.5 w-3.5" />,
  affiliation: <Landmark className="h-3.5 w-3.5" />,
}

const relationshipIcon = (relationship: string) =>
  RELATIONSHIP_ICONS[relationship.toLowerCase()] || <Globe className="h-3.5 w-3.5" />

// The live research pipeline, as shown while a job is running.
const PIPELINE_STAGES = [
  { key: 'discovering', label: 'Discovery' },
  { key: 'matching', label: 'Identity match' },
  { key: 'extracting', label: 'Profile extraction' },
  { key: 'validating', label: 'Evidence' },
]

function stageState(job: ResearchJob | undefined, key: string): 'done' | 'active' | 'pending' {
  if (job?.steps[key]) return 'done'
  const order = PIPELINE_STAGES.map(s => s.key)
  const idx = order.indexOf(key)
  const curIdx = order.indexOf(job?.stage || '')
  if (job?.status === 'completed') return 'done'
  if (job?.status === 'failed') return 'pending'
  if (curIdx === -1) return 'pending'
  return idx < curIdx ? 'done' : idx === curIdx ? 'active' : 'pending'
}

function statusTone(status: ResearchStatus, hasFacts: boolean): 'amber' | 'sage' | 'blue' | 'terra' | 'neutral' {
  if (status === 'queued') return 'blue'
  if (status === 'running') return 'amber'
  if (status === 'failed') return 'terra'
  if (status === 'completed') return hasFacts ? 'sage' : 'neutral'
  return 'neutral'
}

function statusLabel(status: ResearchStatus): string {
  return status.replace(/_/g, ' ')
}

export const ResearchPage: React.FC = () => {
  const { profiles, loading, refresh } = useApp()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, EnrichmentResult[]>>({})
  const [loadingResults, setLoadingResults] = useState<Record<string, boolean>>({})
  const [jobs, setJobs] = useState<Record<string, ResearchJob>>({})
  const [batchRunning, setBatchRunning] = useState(false)
  const pollRef = useRef<number | null>(null)

  if (loading && !profiles.length) return <LoadingState label="Loading research…" />

  const enrichedCount = profiles.filter(p => p.enrichmentCount > 0).length
  const activeCount = Object.values(jobs).filter(j => j.status === 'queued' || j.status === 'running').length
  const queuedCount = Object.values(jobs).filter(j => j.status === 'queued').length
  const runningCount = Object.values(jobs).filter(j => j.status === 'running').length
  const completedCount = Object.values(jobs).filter(j => j.status === 'completed').length

  // Poll live research status while anything is queued/running; when the last
  // job finishes, refresh the profile list so counts/states reconcile.
  useEffect(() => {
    if (activeCount > 0 && pollRef.current == null) {
      const tick = async () => {
        try {
          const res = await getResearchStatus()
          setJobs(prev => {
            const next = { ...prev }
            for (const j of res.jobs) next[j.profileId] = j
            return next
          })
        } catch {
          // transient — next tick retries
        }
      }
      void tick()
      pollRef.current = window.setInterval(tick, 1200)
    } else if (activeCount === 0 && pollRef.current != null) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
      void refresh()
    }
    return () => {
      if (pollRef.current != null) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCount])

  const toggle = async (profileId: string) => {
    if (expanded === profileId) {
      setExpanded(null)
      return
    }
    setExpanded(profileId)
    if (!results[profileId]) {
      setLoadingResults(prev => ({ ...prev, [profileId]: true }))
      try {
        const data = await getEnrichmentResults(profileId)
        setResults(prev => ({ ...prev, [profileId]: data }))
      } catch {
        setResults(prev => ({ ...prev, [profileId]: [] }))
      } finally {
        setLoadingResults(prev => ({ ...prev, [profileId]: false }))
      }
    }
  }

  const handleRun = async (profileId: string) => {
    try {
      const { job } = await runResearch(profileId)
      setJobs(prev => ({ ...prev, [profileId]: job }))
      toast.info('Research queued — watch the pipeline stages below')
    } catch (err) {
      toast.error(`Could not queue research: ${(err as Error).message}`)
    }
  }

  const handleRunAll = async () => {
    setBatchRunning(true)
    try {
      const res = await runResearchBatch()
      toast.success(`Research queued for ${res.queued} profile${res.queued === 1 ? '' : 's'}`)
      const st = await getResearchStatus()
      setJobs(prev => {
        const next = { ...prev }
        for (const j of st.jobs) next[j.profileId] = j
        return next
      })
    } catch (err) {
      toast.error(`Could not queue research: ${(err as Error).message}`)
    } finally {
      setBatchRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <SectionTitle className="text-[18px]">Research engine</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5">
              Imported identity → public web discovery → identity matching → sourced evidence for the AI email
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="recessed-sm rounded-[999px] px-4 py-2 font-mono text-[11px] text-sage-ink flex items-center gap-2">
              <SearchCheck className="h-3.5 w-3.5" /> {enrichedCount} enriched · {profiles.length} profiles
            </span>
            <button
              onClick={handleRunAll}
              disabled={batchRunning || profiles.length === 0}
              className="press raised-sm rounded-full px-4 py-2 text-[12.5px] font-semibold text-blue flex items-center gap-1.5 disabled:opacity-60"
            >
              {batchRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              {batchRunning ? 'Queueing…' : 'Research all'}
            </button>
          </div>
        </Card>
      </RiseIn>

      {/* live batch progress while jobs are active */}
      {(activeCount > 0 || batchRunning) && (
        <RiseIn>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <MonoLabel>RESEARCH IN PROGRESS</MonoLabel>
              <span className="font-mono text-[11px] text-faint">
                {queuedCount} queued · {runningCount} researching · {completedCount} completed
              </span>
            </div>
            <div className="recessed-sm h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber transition-all duration-500"
                style={{
                  width: `${profiles.length > 0 ? Math.min(100, Math.round(((queuedCount + runningCount + completedCount) / profiles.length) * 100)) : 0}%`,
                }}
              />
            </div>
            <p className="font-mono text-[10px] text-faint mt-2">Discovery → identity match → extraction → validation → completion</p>
          </Card>
        </RiseIn>
      )}

      <div className="flex flex-col gap-5">
        {profiles.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="font-display text-[17px] text-ink">No profiles yet</p>
            <p className="text-[13px] text-faint mt-1">
              Import leads first — their profiles appear here for research.
            </p>
          </Card>
        ) : (
          profiles.map((p, i) => {
            const open = expanded === p.id
            const facts = results[p.id]
            const busy = loadingResults[p.id]
            const job = jobs[p.id]
            const status: ResearchStatus = job?.status || p.researchStatus || 'not_started'
            const hasFacts = p.enrichmentCount > 0 || (facts?.length ?? 0) > 0
            const identityConf = job?.identityConfidence ?? p.identityConfidence
            const candidates = job?.candidates?.length ?? p.candidatesCount ?? 0
            const bestMatch = job?.bestMatch || p.bestMatch
            const lastRun = job?.finishedAt || p.researchLastRunAt
            return (
              <RiseIn key={p.id} delay={80 + i * 40}>
                <Card className="p-6">
                  <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => toggle(p.id)}
                  >
                    <Avatar initials={initialsOf(p.fullName || p.contactName || '?')} size="w-12 h-12 rounded-[16px] text-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[17px] text-ink leading-tight">{p.fullName || p.contactName || 'Unnamed'}</p>
                      <p className="text-[12.5px] text-faint mt-0.5">
                        {[p.role, p.organization].filter(Boolean).join(' · ') || p.contactEmail || '—'}
                      </p>
                      {/* identity + candidates line */}
                      <p className="font-mono text-[10.5px] text-ink-dim mt-1.5 flex items-center gap-3 flex-wrap">
                        <span>
                          identity {identityConf != null ? <b className="text-sage-ink">{Math.round(identityConf * 100)}%</b> : '—'}
                        </span>
                        <span>· {candidates} candidate{candidates === 1 ? '' : 's'}</span>
                        {bestMatch && <span className="text-faint truncate max-w-[280px]">· best: {bestMatch}</span>}
                        {lastRun && (
                          <span className="text-faint">
                            · last run {timeAgo(lastRun)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5">
                      {PIPELINE_STAGES.map(s => {
                        const st = stageState(job, s.key)
                        return (
                          <span
                            key={s.key}
                            title={`${s.label}: ${st === 'done' ? 'done' : st === 'active' ? 'in progress' : 'pending'}`}
                            className={cn(
                              'w-[18px] h-[18px] rounded-full flex items-center justify-center',
                              st === 'done' ? 'bg-sage/15 text-sage-ink' : st === 'active' ? 'bg-amber/20 text-amber-ink' : 'bg-fainter/30 text-faint'
                            )}
                          >
                            {st === 'done' ? <Check className="h-3 w-3" /> : st === 'active' ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="w-1 h-1 rounded-full bg-current" />}
                          </span>
                        )
                      })}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); void handleRun(p.id) }}
                      disabled={status === 'queued' || status === 'running'}
                      className="press raised-sm rounded-full px-3.5 py-2 text-[12px] font-semibold text-blue flex items-center gap-1.5 disabled:opacity-60"
                      title="Run the full research pipeline for this profile"
                    >
                      {status === 'queued' || status === 'running' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      {status === 'queued' ? 'Queued…' : status === 'running' ? 'Researching…' : hasFacts ? 'Research again' : 'Run research'}
                    </button>
                    <Badge tone={statusTone(status, hasFacts)}>{statusLabel(status)}</Badge>
                    <span className="font-mono text-[11px] text-faint shrink-0">{p.enrichmentCount} sources</span>
                  </div>

                  {/* live stage list while running */}
                  {status === 'running' && (
                    <div className="mt-5 pt-5 border-t border-fainter/60 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {PIPELINE_STAGES.map(s => {
                        const st = stageState(job, s.key)
                        return (
                          <div key={s.key} className={cn('rounded-[14px] px-3 py-2.5 text-[12px] font-semibold flex items-center gap-2', st === 'done' ? 'recessed-sm text-sage-ink' : st === 'active' ? 'raised-sm text-amber-ink' : 'text-faint')}>
                            {st === 'done' ? <Check className="h-3.5 w-3.5" /> : st === 'active' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                            {s.label}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* failed reason */}
                  {status === 'failed' && job?.error && (
                    <p className="mt-4 text-[12px] text-terra-ink font-mono">{job.error}</p>
                  )}

                  {open && (
                    <div className="mt-5 pt-5 border-t border-fainter/60 flex flex-col gap-3">
                      {busy ? (
                        <p className="font-mono text-[11px] text-faint py-2">Loading sources…</p>
                      ) : facts && facts.length > 0 ? (
                        facts.map(f => (
                          <div
                            key={f.id}
                            className={cn('rounded-[16px] p-4 flex items-start gap-3', f.verified ? 'recessed-sm' : 'raised-sm')}
                          >
                            <span className="recessed-sm w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 text-blue">
                              {relationshipIcon(f.relationship)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13.5px] font-semibold text-ink capitalize">{f.relationship}</p>
                                {f.sourceUrl && (
                                  <a
                                    href={f.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono text-[10.5px] text-blue underline decoration-blue/30"
                                  >
                                    source
                                  </a>
                                )}
                                {f.verified && <Badge tone="sage">verified</Badge>}
                              </div>
                              <p className="text-[12.5px] text-ink-dim mt-1 leading-relaxed">{f.factValue}</p>
                            </div>
                            <span className="font-mono text-[11px] text-amber-ink shrink-0">
                              {f.confidence != null ? `${Math.round(f.confidence * 100)}%` : '—'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12.5px] text-faint py-2">
                          No research sources yet — click <span className="text-blue font-semibold">Run research</span> to discover public profiles and evidence.
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              </RiseIn>
            )
          })
        )}
      </div>

      <p className="font-mono text-[10px] text-faint px-1">
        Research is LinkedIn-first: finds the person's profile via Apify, then scrapes their full profile (headline, experience, education, skills) and recent posts for AI personalization. Falls back to OpenAlex (publications), Wikipedia (bio) and DuckDuckGo (news) when LinkedIn is unavailable. Every fact stays unverified until a human confirms it.
      </p>
    </div>
  )
}

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (secs < 60) return `${secs}s ago`
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
