import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
)

export const LoadingState: React.FC<{ label?: string }> = ({ label }) => (
  <div className="space-y-4" aria-busy="true" aria-label={label || 'Loading data'}>
    {/* Page header skeleton */}
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
    {/* Stat cards skeleton */}
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="mb-2 h-7 w-14" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
    {/* Table/card skeleton */}
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-44" />
        </CardTitle>
        <Skeleton className="h-3.5 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
)

export const EmptyState: React.FC<{ title?: string; hint?: string }> = ({
  title = 'Nothing here yet',
  hint = 'Data will appear here once the pipeline produces it.',
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
    <Inbox className="h-8 w-8 text-muted-foreground/50" />
    <span className="text-sm font-semibold text-muted-foreground">{title}</span>
    <span className="max-w-sm text-xs text-muted-foreground/70">{hint}</span>
  </div>
)

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
    <span className="text-sm text-red-700">{message}</span>
    {onRetry && (
      <Button size="sm" variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
)

export const formatDate = (iso?: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
