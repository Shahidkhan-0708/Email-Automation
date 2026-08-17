import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/shell'
import { DashboardPage } from '@/pages/DashboardPage'
import { PipelinePage } from '@/pages/PipelinePage'
import { ImportPage } from '@/pages/ImportPage'
import { PeoplePage } from '@/pages/PeoplePage'
import { PersonDetailPage } from '@/pages/PersonDetailPage'
import { ResearchPage } from '@/pages/ResearchPage'
import { PersonalizationPage } from '@/pages/PersonalizationPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { OutreachPage } from '@/pages/OutreachPage'
import { RepliesPage } from '@/pages/RepliesPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { CampaignDetailPage } from '@/pages/CampaignDetailPage'
import { BulkSendPage } from '@/pages/BulkSendPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/:id" element={<PersonDetailPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/personalization" element={<PersonalizationPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/outreach" element={<OutreachPage />} />
        <Route path="/replies" element={<RepliesPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/bulk-send" element={<BulkSendPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
