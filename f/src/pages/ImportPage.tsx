import React, { useRef, useState } from 'react'
import { FileUp, FileSpreadsheet, Check, X, Loader2 } from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, Badge, EmptyState, LoadingState } from '@/components/ui'
import { cn } from '@/lib/utils'

export const ImportPage: React.FC = () => {
  const { importJobs, loading, stats, uploadAndQueueImport, processImportJob, refresh } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading && !stats) return <LoadingState label="Loading import…" />

  const handleFile = async (file: File) => {
    setBusy(true)
    try {
      await uploadAndQueueImport(file)
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
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={e => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
          }}
          className={cn(
            'card-n rounded-[24px] p-12 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all duration-200',
            dragging && 'ring-2 ring-amber/60 scale-[1.01]'
          )}
        >
          <span className={cn('raised-sm w-16 h-16 rounded-[20px] flex items-center justify-center text-amber', dragging && 'amber-node')}>
            <FileUp className="h-7 w-7" />
          </span>
          <div>
            <p className="font-display text-[20px] text-ink">{busy ? 'Queuing file…' : 'Drop a leads file here'}</p>
            <p className="font-mono text-[11px] text-faint mt-1.5">CSV · XLSX · PDF — parsed into contacts, profiles & outreach</p>
          </div>
          <Pressable
            onClick={e => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
            className="press bg-sage text-white rounded-full px-6 py-3 text-[14px] font-bold mt-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            Choose file
          </Pressable>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
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
              <p className="text-[13px] text-faint mt-0.5">{importJobs.length} recent jobs</p>
            </div>
            <Pressable onClick={() => refresh()} className="press raised-sm rounded-full px-4 py-2 text-[12px] font-semibold text-ink-dim">
              Refresh
            </Pressable>
          </div>
          {importJobs.length === 0 ? (
            <EmptyState title="No imports yet" hint="Upload a file above to start the ingestion pipeline." />
          ) : (
            <div className="flex flex-col">
              {importJobs.map((job, i) => (
                <div key={job.id}>
                  {i > 0 && <div className="h-px bg-fainter/60 my-3" />}
                  <div className="flex items-center gap-4">
                    <span className="recessed-sm w-11 h-11 rounded-[14px] flex items-center justify-center text-blue shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink truncate">{job.filename}</p>
                      <p className="font-mono text-[10.5px] text-faint mt-0.5">
                        {new Date(job.created_at).toLocaleString()} · {job.total_records} rows · {job.file_type}
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
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {job.status === 'completed' && (
                        <>
                          <span className="font-mono text-[10px] text-sage-ink">{job.created_records} created</span>
                          <span className="font-mono text-[10px] text-faint">{job.updated_records} updated</span>
                        </>
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
    processing: { tone: 'amber' },
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
