import React, { useState } from 'react'
import { Sparkles, Loader2, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, LoadingState, EmptyState } from './shared'
import { useApp } from '@/lib/AppContext'

export const PersonalizationPage: React.FC = () => {
  const { profiles, loading, generateForProfile } = useApp()
  const [busy, setBusy] = useState<string | null>(null)

  if (loading && profiles.length === 0) return <LoadingState label="Loading profiles…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Multi-Variant Engine"
        description="Generate a personalized outreach email for an enriched profile. The result lands in the Review Queue."
      />

      {profiles.length === 0 ? (
        <EmptyState
          title="No profiles to personalize"
          hint="Import leads first — profiles are created automatically. Enrichment facts make the AI output more specific."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {profiles.map(p => {
            const canGenerate = p.enrichmentCount > 0
            return (
              <Card key={p.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-accent" />
                    {p.fullName || p.contactName || p.id.slice(0, 8)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {p.organization || '—'}
                    {p.role ? ` · ${p.role}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Database className="h-3.5 w-3.5" />
                    {p.enrichmentCount} enrichment {p.enrichmentCount === 1 ? 'fact' : 'facts'}
                    {p.contactEmail && <span className="ml-auto truncate" title={p.contactEmail}>{p.contactEmail}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {p.personalizationStatus && (
                      <Badge variant={p.personalizationStatus === 'approved' || p.personalizationStatus === 'edited' ? 'success' : p.personalizationStatus === 'rejected' ? 'destructive' : 'info'}>
                        {p.personalizationStatus.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto">
                    {canGenerate ? (
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={async () => { setBusy(p.id); try { await generateForProfile(p.id); } finally { setBusy(null) } }}
                        disabled={busy === p.id}
                      >
                        {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {busy === p.id ? 'Generating…' : 'Generate Personalization'}
                      </Button>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
                        Needs enrichment facts first
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
