import React, { useRef, useState, useEffect, useCallback } from 'react'
import { FileUp, FileSpreadsheet, Check, X, Loader2 } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { getImportJobs, type ImportJob } from '@/lib/api'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, Badge, EmptyState, LoadingState } from '@/components/ui'
import { cn } from '@/lib/utils'

const POLL_MS = 2500 // poll import job status while queued/processing

export const ImportPage: React.FC = () => {
  const { importJobs, loading, stats, uploadAndQueueImport, processImportJob, refresh } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [liveJobs, setLiveJobs] = useState<ImportJob[]>(importJobs)

  // Keep the local job list in sync with context (e.g. after refresh).
  useEffect(() => {
    setLiveJobs(importJobs)
  }, [importJobs])

  // Poll while any job is queued/processing; when they all finish, refresh the
  // rest of the app so imported data (contacts, stats, review queue) syncs.
  const anyActive = liveJobs.some(j => j.status === 'queued' || j.status === 'processing')
  const poll = useCallback(async () => {
    try {
      const jobs = await getImportJobs(20)
      setLiveJobs(jobs)
      if (!jobs.some(j => j.status === 'queued' || j.status === 'processing')) {
        await refresh()
      }
    } catch {
      // transient — next tick retries
    }
  }, [refresh])

  useEffect(() => {
    if (!anyActive) return
    const timer = window.setInterval(poll, POLL_MS)
    return () => window.clearInterval(timer)
  }, [anyActive, poll])

  if (loading && !stats) return <LoadingState label="Loading import…" />

  const handleFile = async (file: File) => {
    setBusy(true)
    try {
      setBusyLabel('Uploading…')
      const jobId = await uploadAndQueueImport(file)
      setBusyLabel('Processing…')
      // Kick the import off immediately instead of waiting for the cron, so
      // the user sees progress and the data shows up right away.
      await processImportJob(jobId)
      setBusyLabel('')
      await poll()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      {/* dropzone */}
      <RiseIn>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && !busy && inputRef.current?.click()}
          onDragOver={e => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            if (busy) return
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
          }}
          className={cn(
            'card-n rounded-[24px] p-12 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all duration-200',
            dragging && 'ring-2 ring-amber/60 scale-[1.01]',
            busy && 'pointer-events-none opacity-90'
          )}
        >
          <span className={cn('raised-sm w-16 h-16 rounded-[20px] flex items-center justify-center text-amber', (dragging || busy) && 'amber-node')}>
            {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <FileUp className="h-7 w-7" />}
          </span>
          <div>
            <p className="font-display text-[20px] text-ink">
              {busy ? busyLabel : 'Drop a leads file here'}
            </p>
            <p className="font-mono text-[11px] text-faint mt-1.5">
              {busy
                ? 'OCR + parsing contacts, profiles & outreach — hang tight'
                : 'CSV · XLSX · PDF · Images (OCR) — parsed into contacts, profiles & outreach'}
            </p>
          </div>
          <Pressable
            onClick={e => {
              e.stopPropagation()
              if (!busy) inputRef.current?.click()
            }}
            className="press bg-sage text-white rounded-full px-6 py-3 text-[14px] font-bold mt-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            {busy ? 'Working…' : 'Choose file'}
          </Pressable>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp,.bmp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </RiseIn>

      {/* job history */}
      <RiseIn delay={120}>
        <Card className="px-6 py-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <SectionTitle className="text-[18px]">Import jobs</SectionTitle>
              <p className="text-[13px] text-faint mt-0.5">{liveJobs.length} recent jobs</p>
            </div>
            <Pressable onClick={() => refresh()} className="press raised-sm rounded-full px-4 py-2 text-[12px] font-semibold text-ink-dim">
              Refresh
            </Pressable>
          </div>
          {liveJobs.length === 0 ? (
            <EmptyState title="No imports yet" hint="Upload a file above to start the ingestion pipeline." />
          ) : (
            <div className="flex flex-col">
              {liveJobs.map((job, i) => (
                <div key={job.id}>
                  {i > 0 && <div className="h-px bg-fainter/60 my-3" />}
                  <div className="flex items-center gap-4">
                    <span className="recessed-sm w-11 h-11 rounded-[14px] flex items-center justify-center text-blue shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink truncate">{job.filename}</p>
                      <p className="font-mono text-[10.5px] text-faint mt-0.5">
                        {new Date(job.created_at).toLocaleString()} · {job.total_records || 0} rows · {job.file_type}
                      </p>
                      {job.status === 'queued' && (
                        <div className="mt-2 flex gap-2">
                          <Pressable
                            onClick={() => processImportJob(job.id)}
                            className="press raised-sm rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-amber-ink"
                          >
                            Process now
                          </Pressable>
                        </div>
                      )}
                      {(job.status === 'queued' || job.status === 'processing') && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="h-1.5 w-24 rounded-full bg-fainter overflow-hidden">
                            <span className="block h-full rounded-full bg-amber import-progress" />
                          </span>
                          <span className="font-mono text-[10px] text-amber-ink">working…</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {job.status === 'completed' && (
                        <>
                          <span className="font-mono text-[10px] text-sage-ink">{job.created_records} created</span>
                          <span className="font-mono text-[10px] text-faint">{job.updated_records} updated</span>
                        </>
                      )}
                      {job.status === 'failed' && job.error_message && (
                        <span className="font-mono text-[10px] text-terra-ink max-w-[160px] truncate" title={job.error_message}>
                          {job.error_message}
                        </span>
                      )}
                      <JobStatusBadge status={job.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </RiseIn>
    </div>
  )
}

const JobStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { tone: 'amber' | 'sage' | 'terra' | 'blue'; icon?: React.ReactNode }> = {
    queued: { tone: 'blue' },
    processing: { tone: 'amber', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    completed: { tone: 'sage', icon: <Check className="h-3 w-3" /> },
    failed: { tone: 'terra', icon: <X className="h-3 w-3" /> },
  }
  const cfg = map[status] || { tone: 'neutral' as const }
  return (
    <Badge tone={cfg.tone as 'amber' | 'sage' | 'terra' | 'blue'} className="flex items-center gap-1.5">
      {cfg.icon}
      {status}
    </Badge>
  )
}
