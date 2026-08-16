import React, { useRef, useState } from 'react'
import { UploadCloud, Play, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PageHeader, LoadingState, EmptyState, formatDate } from './shared'
import { useApp } from '@/lib/AppContext'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'neutral'> = {
  completed: 'success',
  processing: 'info',
  queued: 'neutral',
  failed: 'destructive',
}

export const ImportPage: React.FC = () => {
  const { importJobs, loading, uploadAndQueueImport, processImportJob, refresh } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('auto')
  const [uploading, setUploading] = useState(false)
  const [busyJob, setBusyJob] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls' || ext === 'pdf') setFileType(ext === 'xls' ? 'xlsx' : ext)
  }

  const onSubmit = async () => {
    if (!file) return
    setUploading(true)
    try {
      await uploadAndQueueImport(file, fileType === 'auto' ? undefined : fileType)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch {
      // toast handled in context
    } finally {
      setUploading(false)
    }
  }

  const onProcess = async (jobId: string) => {
    setBusyJob(jobId)
    try {
      await processImportJob(jobId)
    } finally {
      setBusyJob(null)
    }
  }

  if (loading && importJobs.length === 0) return <LoadingState label="Loading import jobs…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Input & Extraction"
        description="Upload CSV, XLSX or PDF lead files. Rows are normalized and upserted into contacts + profiles + outreach."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-primary" />
              Upload Lead File
            </CardTitle>
            <CardDescription>Supported: .csv, .xlsx, .xls, .pdf (max 10 MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={onFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground hover:file:bg-secondary/80"
            />
            {file && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{file.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{fileType === 'auto' ? 'AUTO' : fileType.toUpperCase()}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="file-type">Parser</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger id="file-type" className="w-full">
                  <SelectValue placeholder="Auto-detect from extension" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={onSubmit} disabled={!file || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Queue Import'}
            </Button>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => refresh()}>
              Refresh Jobs
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-accent" />
              Import Jobs
            </CardTitle>
            <CardDescription>Recent uploads and their processing state</CardDescription>
          </CardHeader>
          <CardContent>
            {importJobs.length === 0 ? (
              <EmptyState title="No import jobs yet" hint="Upload a CSV/XLSX/PDF to start the pipeline." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{job.filename}</div>
                        <div className="text-xs text-muted-foreground">{job.file_type.toUpperCase()} · {job.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[job.status] || 'neutral'}>{job.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        total {job.total_records} · created {job.created_records} · updated {job.updated_records} · skipped {job.skipped_records}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(job.created_at)}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs text-red-600" title={job.error_message || ''}>
                        {job.error_message || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {job.status === 'queued' && (
                          <Button size="sm" variant="secondary" onClick={() => onProcess(job.id)} disabled={busyJob === job.id}>
                            {busyJob === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            Process
                          </Button>
                        )}
                        {job.status === 'processing' && <Loader2 className="ml-auto h-4 w-4 animate-spin text-info" />}
                        {job.status === 'completed' && <CheckCircle2 className="ml-auto h-4 w-4 text-success" />}
                        {job.status === 'failed' && <XCircle className="ml-auto h-4 w-4 text-destructive" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
