import React from 'react'
import { KeyRound, Mail, Brain, Server, ShieldCheck, Moon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PageHeader, LoadingState } from './shared'
import { useApp } from '@/lib/AppContext'
import { useTheme } from '@/lib/theme'

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 text-sm last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium text-foreground ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
  </div>
)

export const SettingsPage: React.FC = () => {
  const { stats, loading, error } = useApp()
  const { theme, toggleTheme } = useTheme()

  if (loading && !stats) return <LoadingState label="Loading settings…" />

  return (
    <div className="space-y-6">
      <PageHeader title="Settings & Integrations" description="Live configuration reported by the backend. Secrets are never exposed." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Moon className="h-4 w-4 text-primary" />Appearance</CardTitle>
            <CardDescription>Interface preferences for this browser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark mode</Label>
                <p className="text-xs text-muted-foreground">Persisted locally; matches system preference on first visit.</p>
              </div>
              <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-4 w-4 text-primary" />Backend</CardTitle>
            <CardDescription>Connection details for this deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <Row label="Base URL" value={stats?.config.baseUrl || '—'} mono />
            <Row label="API status" value={error ? `error: ${error}` : 'connected'} />
            <Row label="SMTP host" value={stats?.config.smtpHost || '—'} mono />
            <Row label="Sender" value={`${stats?.config.senderName || ''} <${stats?.config.senderEmail || ''}>`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4 text-accent" />AI & Outreach Rules</CardTitle>
            <CardDescription>Runtime tuning values from .env</CardDescription>
          </CardHeader>
          <CardContent>
            <Row label="AI model" value={stats?.config.aiModel || '—'} />
            <Row label="Daily send limit" value={String(stats?.config.dailySendLimit ?? '—')} />
            <Row label="Follow-up 1 after" value={`${stats?.config.followup1Days ?? '—'} days`} />
            <Row label="Follow-up 2 after" value={`${stats?.config.followup2Days ?? '—'} days`} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-warning" />Authentication</CardTitle>
            <CardDescription>How the frontend authenticates to the API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>
                All <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">/api/*</code> routes require the admin API key
                (<code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">x-api-key</code> header) unless the backend runs in development mode
                with the bypass header.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                For a production build, set <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">VITE_ADMIN_API_KEY</code> at build time so the
                bundle sends the key automatically. In development, the Vite proxy forwards <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">/api</code> to
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs"> localhost:5000</code>.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
