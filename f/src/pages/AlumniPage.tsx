import React, { useState } from 'react'
import { Search, Download, Check, ExternalLink, MapPin, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/lib/AppContext'
import { discoverAlumni, importAlumni, type AlumniCandidate } from '@/lib/api'
import { Pressable, RiseIn } from '@/components/motion'
import { Card, SectionTitle, MonoLabel, Badge, EmptyState, Avatar, initialsOf } from '@/components/ui'

export const AlumniPage: React.FC = () => {
  const { refresh } = useApp()

  const [school, setSchool] = useState('')
  const [location, setLocation] = useState('')
  const [maxResults, setMaxResults] = useState(10)
  const [searching, setSearching] = useState(false)
  const [candidates, setCandidates] = useState<AlumniCandidate[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: number
    skipped: number
    errors: { candidate: string; error: string }[]
    research: { queued: number } | null
  } | null>(null)

  const handleDiscover = async () => {
    if (!school.trim()) {
      toast.error('Please enter a school or college name')
      return
    }
    setSearching(true)
    setCandidates([])
    setSelected(new Set())
    setImportResult(null)
    try {
      const result = await discoverAlumni(school.trim(), maxResults, location.trim() || undefined)
      setCandidates(result.candidates)
      if (result.candidates.length === 0) {
        toast.info(`No alumni found for "${school.trim()}". Try a different name or check your Apify token.`)
      } else {
        toast.success(`Found ${result.count} alumni for "${school.trim()}"`)
      }
    } catch (err) {
      toast.error(`Discovery failed: ${(err as Error).message}`)
    } finally {
      setSearching(false)
    }
  }

  const toggleSelect = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === candidates.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(candidates.map((_, i) => i)))
    }
  }

  const handleImport = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one candidate to import')
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const selectedCandidates = [...selected].map(i => candidates[i])
      const result = await importAlumni(school.trim(), selectedCandidates, true)
      setImportResult(result)
      toast.success(`Imported ${result.created} alumni${result.research ? ` — research queued for ${result.research.queued}` : ''}`)
      await refresh()
    } catch (err) {
      toast.error(`Import failed: ${(err as Error).message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5">
          <SectionTitle className="text-[18px]">Alumni Discovery</SectionTitle>
          <p className="text-[13px] text-faint mt-0.5 mb-4">
            Search for college alumni via LinkedIn. Discovered profiles can be imported into the outreach pipeline with automatic research.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <MonoLabel className="mb-1.5">School / College</MonoLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
                <input
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                  placeholder="e.g. MIT, Stanford, Madanapalle Institute of Technology"
                  className="w-full recessed-sm rounded-[14px] pl-10 pr-4 py-3 text-[14px] text-ink bg-paper outline-none focus:ring-2 focus:ring-amber/40"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <MonoLabel className="mb-1.5">Location (optional)</MonoLabel>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full recessed-sm rounded-[14px] px-4 py-3 text-[14px] text-ink bg-paper outline-none focus:ring-2 focus:ring-amber/40"
              />
            </div>
            <div className="w-full sm:w-32">
              <MonoLabel className="mb-1.5">Max results</MonoLabel>
              <input
                type="number"
                min={1}
                max={50}
                value={maxResults}
                onChange={e => setMaxResults(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 10)))}
                className="w-full recessed-sm rounded-[14px] px-4 py-3 text-[14px] text-ink bg-paper outline-none focus:ring-2 focus:ring-amber/40"
              />
            </div>
            <div className="flex items-end">
              <Pressable
                onClick={handleDiscover}
                disabled={searching || !school.trim()}
                className="press bg-amber text-white rounded-[14px] px-6 py-3 text-[14px] font-bold flex items-center gap-2 hover:brightness-105 transition-[filter] disabled:opacity-50 disabled:transform-none whitespace-nowrap"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {searching ? 'Searching…' : 'Discover'}
              </Pressable>
            </div>
          </div>
        </Card>
      </RiseIn>

      {/* Results */}
      {candidates.length > 0 && (
        <RiseIn delay={80}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SectionTitle className="text-[16px]">{candidates.length} candidates found</SectionTitle>
                <Badge tone="blue">{selected.size} selected</Badge>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="font-mono text-[11px] text-faint hover:text-ink-dim transition-colors"
                >
                  {selected.size === candidates.length ? 'Deselect all' : 'Select all'}
                </button>
                <Pressable
                  onClick={handleImport}
                  disabled={importing || selected.size === 0}
                  className="press bg-sage text-white rounded-full px-5 py-2.5 text-[13px] font-bold flex items-center gap-2 hover:brightness-105 transition-[filter] disabled:opacity-50 disabled:transform-none"
                >
                  {importing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {importing ? 'Importing…' : `Import ${selected.size || ''}`}
                </Pressable>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {candidates.map((c, i) => (
                <CandidateRow
                  key={c.linkedinUrl || i}
                  candidate={c}
                  index={i}
                  selected={selected.has(i)}
                  onToggle={() => toggleSelect(i)}
                />
              ))}
            </div>
          </Card>
        </RiseIn>
      )}

      {/* Import result */}
      {importResult && (
        <RiseIn delay={120}>
          <Card className="p-5">
            <SectionTitle className="text-[16px]">Import complete</SectionTitle>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="recessed-sm rounded-[12px] px-4 py-3">
                <p className="font-mono text-[20px] text-sage font-bold">{importResult.created}</p>
                <p className="font-mono text-[10px] text-faint mt-0.5">imported</p>
              </div>
              <div className="recessed-sm rounded-[12px] px-4 py-3">
                <p className="font-mono text-[20px] text-ink-dim font-bold">{importResult.skipped}</p>
                <p className="font-mono text-[10px] text-faint mt-0.5">skipped</p>
              </div>
              <div className="recessed-sm rounded-[12px] px-4 py-3">
                <p className="font-mono text-[20px] text-terra font-bold">{importResult.errors.length}</p>
                <p className="font-mono text-[10px] text-faint mt-0.5">errors</p>
              </div>
              {importResult.research && (
                <div className="recessed-sm rounded-[12px] px-4 py-3">
                  <p className="font-mono text-[20px] text-amber font-bold">{importResult.research.queued}</p>
                  <p className="font-mono text-[10px] text-faint mt-0.5">research queued</p>
                </div>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-[12px] text-terra font-semibold mb-1">Errors:</p>
                {importResult.errors.map((e, i) => (
                  <p key={i} className="font-mono text-[10px] text-faint">{e.candidate}: {e.error}</p>
                ))}
              </div>
            )}
          </Card>
        </RiseIn>
      )}

      {/* Empty state */}
      {candidates.length === 0 && !searching && (
        <Card>
          <EmptyState
            title="Search for alumni"
            hint="Enter a school or college name to discover LinkedIn profiles of alumni. Start with 10–50 results, verify the data, then scale up."
          />
        </Card>
      )}
    </div>
  )
}

function CandidateRow({
  candidate,
  index: _index,
  selected,
  onToggle,
}: {
  candidate: AlumniCandidate
  index: number
  selected: boolean
  onToggle: () => void
}) {
  const name = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || 'Unknown'
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-4 px-4 py-3 rounded-[14px] text-left transition-colors duration-150 ${
        selected ? 'recessed-sm ring-1 ring-amber/40' : 'hover:bg-surface'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors ${
          selected ? 'bg-sage border-sage' : 'border-fainter'
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>
      <Avatar initials={initialsOf(name)} size="w-10 h-10 rounded-[12px] text-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-ink truncate">{name}</p>
          {candidate.linkedinUrl && (
            <a
              href={candidate.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-faint hover:text-ink-dim transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <p className="text-[11.5px] text-ink-dim truncate mt-0.5">{candidate.headline || '—'}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {candidate.currentCompany && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-faint">
              <Building2 className="h-2.5 w-2.5" /> {candidate.currentCompany}
            </span>
          )}
          {candidate.location && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-faint">
              <MapPin className="h-2.5 w-2.5" /> {candidate.location}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
