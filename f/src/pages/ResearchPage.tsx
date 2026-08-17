import React, { useState } from 'react'
import { SearchCheck, Globe, FileText, Landmark, Newspaper } from 'lucide-react'
// TODO(cleanup): page runs on demoResearch until the enrichment endpoint exists (roadmap M2).
import { demoResearch, type EnrichmentSource } from '@/lib/demo'
import { RiseIn } from '@/components/motion'
import { Card, SectionTitle, Avatar, Badge, initialsOf } from '@/components/ui'
import { cn } from '@/lib/utils'

const kindIcon: Record<EnrichmentSource['kind'], React.ReactNode> = {
  publication: <FileText className="h-3.5 w-3.5" />,
  profile: <Globe className="h-3.5 w-3.5" />,
  grant: <Landmark className="h-3.5 w-3.5" />,
  news: <Newspaper className="h-3.5 w-3.5" />,
}

export const ResearchPage: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(demoResearch[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-7">
      <RiseIn>
        <Card className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <SectionTitle className="text-[18px]">Research & enrichment</SectionTitle>
            <p className="text-[13px] text-faint mt-0.5">
              Sources gathered per contact — evidence drives personalization confidence
            </p>
          </div>
          <span className="recessed-sm rounded-[999px] px-4 py-2 font-mono text-[11px] text-sage-ink flex items-center gap-2">
            <SearchCheck className="h-3.5 w-3.5" /> 3 enriched · 1 needs attention
          </span>
        </Card>
      </RiseIn>

      <div className="flex flex-col gap-5">
        {demoResearch.map((rp, i) => {
          const open = expanded === rp.id
          return (
            <RiseIn key={rp.id} delay={80 + i * 60}>
              <Card className="p-6">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpanded(open ? null : rp.id)}
                >
                  <Avatar initials={initialsOf(rp.name)} size="w-12 h-12 rounded-[16px] text-[12px]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[17px] text-ink leading-tight">{rp.name}</p>
                    <p className="text-[12.5px] text-faint mt-0.5">
                      {rp.role} · {rp.organization}
                    </p>
                  </div>
                  <Badge tone={statusTone(rp.status)}>{rp.status.replace(/_/g, ' ')}</Badge>
                  <span className="font-mono text-[11px] text-faint shrink-0">{rp.sources.length} sources</span>
                </div>

                {open && (
                  <div className="mt-5 pt-5 border-t border-fainter/60 flex flex-col gap-3">
                    {rp.sources.map(s => (
                      <div
                        key={s.id}
                        className={cn(
                          'rounded-[16px] p-4 flex items-start gap-3',
                          s.cited ? 'recessed-sm' : 'raised-sm'
                        )}
                      >
                        <span className="recessed-sm w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 text-blue">
                          {kindIcon[s.kind]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13.5px] font-semibold text-ink">{s.name}</p>
                            {s.cited && <Badge tone="sage">cited</Badge>}
                          </div>
                          <p className="text-[12.5px] text-ink-dim mt-1 leading-relaxed">{s.snippet}</p>
                        </div>
                        <span className="font-mono text-[11px] text-amber-ink shrink-0">{s.confidence.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </RiseIn>
          )
        })}
      </div>

      <p className="font-mono text-[10px] text-faint px-1">
        Note: the enrichment stage is a stub on the backend — this page renders preview data until a real source or
        manual-entry endpoint lands.
      </p>
    </div>
  )
}

function statusTone(s: string): 'amber' | 'sage' | 'blue' | 'terra' | 'neutral' {
  const map: Record<string, 'amber' | 'sage' | 'blue' | 'terra' | 'neutral'> = {
    enriched: 'sage',
    researching: 'amber',
    queued: 'blue',
    needs_attention: 'terra',
  }
  return map[s] || 'neutral'
}
