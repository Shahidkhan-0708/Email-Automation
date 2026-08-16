import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { RefreshCw, Radio, Moon, Sun } from 'lucide-react'
import { AppSidebar } from './components/layout/AppSidebar'
import { Button } from './components/ui/button'
import { useApp } from './lib/AppContext'
import { useTheme } from './lib/theme'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './components/ui/tooltip'
import { DashboardPage } from './pages/DashboardPage'
import { ImportPage } from './pages/ImportPage'
import { ReviewPage } from './pages/ReviewPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { OutreachPage } from './pages/OutreachPage'
import { RepliesPage } from './pages/RepliesPage'
import { ContactsPage } from './pages/ContactsPage'
import { PersonalizationPage } from './pages/PersonalizationPage'
import { PipelinePage } from './pages/PipelinePage'
import { SettingsPage } from './pages/SettingsPage'
import { RateLimiterPage } from './pages/RateLimiterPage'
import { DesignSystemPage } from './pages/DesignSystemPage'

const TITLES: Record<string, string> = {
  pipeline: 'Visual Pipeline Architecture',
  dashboard: 'Executive Dashboard & Metrics',
  import: '1. Input Ingestion & Column Extraction',
  people: '2. Profiles & Contacts',
  research: '3. Context & Vision',
  personalization: '4. AI Multi-Variant Engine',
  review: '5. Human Review & Approval Queue',
  outreach: '6. Outreach Delivery & Activity Log',
  replies: '7. Inbound Replies & Follow-up Drips',
  campaigns: 'Outreach Campaigns & Sequences',
  'bulk-send': 'Rate Limiting & Safety Dispatcher',
  settings: 'Settings, Integrations & API Keys',
  'design-system': 'Design Tokens & Component Catalog',
}

function Header() {
  const { refresh, loading, error } = useApp()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const route = location.pathname.split('/')[1] || 'pipeline'
  const title = TITLES[route] || 'College Outreach Automation'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="flex flex-col">
        <h1 className="text-base font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-[11px] text-muted-foreground">
          College Outreach Automation System V2
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
          <Radio className="h-3 w-3" />
          {error ? 'API Error' : 'Backend Connected'}
        </span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={toggleTheme} aria-label="Toggle dark mode">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button size="sm" variant="secondary" onClick={() => { refresh(); }} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </header>
  )
}

function App() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={`flex min-h-screen flex-col transition-all duration-200 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        <Header />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/people" element={<ContactsPage />} />
            <Route path="/research" element={<ContactsPage variant="research" />} />
            <Route path="/personalization" element={<PersonalizationPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/outreach" element={<OutreachPage />} />
            <Route path="/replies" element={<RepliesPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/bulk-send" element={<RateLimiterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
