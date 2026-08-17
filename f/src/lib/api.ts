// ---------------------------------------------------------------------------
// API client for the College Outreach Automation backend.
// In dev, Vite proxies /api to localhost:5000 (see vite.config.ts).
// ---------------------------------------------------------------------------

const ADMIN_API_KEY = (import.meta.env.VITE_ADMIN_API_KEY as string | undefined) || ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }

  if (ADMIN_API_KEY) {
    headers['x-api-key'] = ADMIN_API_KEY
  } else if (import.meta.env.DEV) {
    headers['x-bypass-auth'] = 'true'
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(`/api${path}`, { ...options, headers })
  } catch (err) {
    throw new ApiError(`Network error reaching the backend: ${(err as Error).message}`, 0)
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body.error || body.message || message
    } catch {
      // non-JSON error body
    }
    throw new ApiError(message, res.status)
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Types (mirror backend responses)
// ---------------------------------------------------------------------------

export interface Campaign {
  id: string
  name: string
  description: string | null
  status: string
  senderEmail: string | null
  senderName: string | null
  createdAt: string
  total: number
  sent: number
  replied: number
  active: number
}

export interface ContactOutreachLite {
  status: string
  campaign_id: string
  sent_at: string | null
  reply_received_at: string | null
}

export interface Contact {
  id: string
  email: string
  name: string
  organization: string | null
  role: string | null
  personalization: string | null
  personalizationApproved: boolean | null
  suppressed: boolean | null
  createdAt: string
  outreach: ContactOutreachLite[]
}

export interface OutreachRow {
  id: string
  contact_id: string
  campaign_id: string
  status: string
  subject: string | null
  email_body: string | null
  sent_at: string | null
  last_inbound_at: string | null
  reply_received_at: string | null
  reply_body: string | null
  ai_category: string | null
  ai_confidence: number | null
  ai_summary: string | null
  ai_next_action: string | null
  delivery_status: string | null
  created_at: string
  contacts?: ContactInfo
  campaigns?: CampaignInfo
}

export interface ContactInfo {
  id: string
  email: string
  name: string
  organization: string | null
  role: string | null
}

export interface CampaignInfo {
  id: string
  name: string
}

export interface ReplyRow extends OutreachRow {}

export interface Profile {
  id: string
  contactId: string
  fullName: string | null
  organization: string | null
  role: string | null
  college: string | null
  createdAt: string
  contactEmail: string | null
  contactName: string | null
  enrichmentCount: number
  personalizationStatus: string | null
}

export interface Personalization {
  id: string
  profile_id: string
  campaign_id: string
  subject: string
  body: string
  status: 'pending_review' | 'approved' | 'rejected' | 'edited'
  evidence_used: unknown[]
  edited_subject: string | null
  edited_body: string | null
  created_at: string
  profiles?: {
    id: string
    full_name: string | null
    organization: string | null
    role: string | null
    contact_id: string | null
    contacts?: ContactInfo | ContactInfo[] | null
  } | null
}

export interface ImportJob {
  id: string
  filename: string
  file_type: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  total_records: number
  processed_records: number
  created_records: number
  updated_records: number
  skipped_records: number
  error_message: string | null
  created_at: string
}

export interface DashboardStats {
  contacts: number
  campaigns: number
  outreach: {
    total: number
    sent: number
    replied: number
    ready: number
    byStatus: Record<string, number>
  }
  reviewQueue: number
  importJobs: Record<string, number>
  config: {
    dailySendLimit: number
    followup1Days: number
    followup2Days: number
    smtpHost: string
    senderEmail: string
    senderName: string
    aiModel: string
    baseUrl: string
  }
}

// ---------------------------------------------------------------------------
// Endpoint functions
// ---------------------------------------------------------------------------

export const getCampaigns = () =>
  request<{ success: boolean; campaigns: Campaign[] }>('/campaigns').then(r => r.campaigns)

export const getContacts = (params: { limit?: number; search?: string } = {}) => {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.search) qs.set('search', params.search)
  return request<{ success: boolean; contacts: Contact[] }>(`/contacts?${qs}`).then(r => r.contacts)
}

export const getOutreach = (params: { limit?: number; status?: string; campaignId?: string } = {}) => {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.status) qs.set('status', params.status)
  if (params.campaignId) qs.set('campaignId', params.campaignId)
  return request<{ success: boolean; outreach: OutreachRow[] }>(`/outreach?${qs}`).then(r => r.outreach)
}

export const getReplies = (limit = 100) =>
  request<{ success: boolean; replies: ReplyRow[] }>(`/replies?limit=${limit}`).then(r => r.replies)

export const getStats = () =>
  request<{ success: boolean; stats: DashboardStats }>('/dashboard/stats').then(r => r.stats)

export const getProfiles = (limit = 100) =>
  request<{ success: boolean; profiles: Profile[] }>(`/profiles?limit=${limit}`).then(r => r.profiles)

export const getImportJobs = (limit = 20) =>
  request<{ success: boolean; jobs: ImportJob[] }>(`/import/jobs?limit=${limit}`).then(r => r.jobs)

export const getImportStatus = (jobId: string) =>
  request<{ success: boolean; job: ImportJob }>(`/import/status/${jobId}`).then(r => r.job)

export const uploadImport = (file: File, fileType?: string) => {
  const form = new FormData()
  form.append('file', file)
  if (fileType) form.append('fileType', fileType)
  return request<{ success: boolean; jobId: string; status: string }>('/import', { method: 'POST', body: form }).then(r => r.jobId)
}

export const processImport = (jobId: string) =>
  request<{ success: boolean; job: ImportJob }>('/import/process', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  }).then(r => r.job)

export const getReviewQueue = (campaignId?: string, limit = 50) => {
  const qs = new URLSearchParams()
  if (campaignId) qs.set('campaignId', campaignId)
  qs.set('limit', String(limit))
  return request<{ success: boolean; queue: Personalization[] }>(`/review/queue?${qs}`).then(r => r.queue)
}

export const submitReview = (
  id: string,
  decision: 'approved' | 'rejected' | 'edited',
  opts: { comments?: string; editedSubject?: string; editedBody?: string; decidedBy?: string } = {}
) =>
  request<{ success: boolean; personalization: Personalization }>(`/review/${id}`, {
    method: 'POST',
    body: JSON.stringify({ decision, ...opts }),
  }).then(r => r.personalization)

export const generatePersonalization = (profileId: string, campaignId?: string) =>
  request<{ success: boolean; personalization: Personalization }>(`/personalization/generate/${profileId}`, {
    method: 'POST',
    body: JSON.stringify(campaignId ? { campaignId } : {}),
  }).then(r => r.personalization)

export const getBulkProgress = (campaignId?: string) => {
  const qs = new URLSearchParams()
  if (campaignId) qs.set('campaignId', campaignId)
  return request<{ success: boolean; progress: Record<string, number> }>(`/bulk/progress?${qs}`).then(r => r.progress)
}

export const approveAndSendBulk = (campaignId?: string, limit = 50) =>
  request<{ success: boolean; approval: unknown; sendResult: unknown }>('/bulk/approve-and-send', {
    method: 'POST',
    body: JSON.stringify(campaignId ? { campaignId, limit } : { limit }),
  })

export const triggerOutreach = () =>
  request<{ success: boolean; result: { claimed: number; sent: number; failed: number; authStopped?: boolean } }>(
    '/trigger/outreach',
    { method: 'POST' }
  ).then(r => r.result)

export const triggerFollowups = () =>
  request<{ success: boolean; result: unknown }>('/trigger/followups', { method: 'POST' }).then(r => r.result)

export const triggerReplies = () =>
  request<{ success: boolean; result: { fetched: number; processed: number; skipped: number } }>('/trigger/replies', {
    method: 'POST',
  }).then(r => r.result)

export const addLead = (data: { name: string; email: string; organization?: string; role?: string; personalization?: string }) =>
  request<{ success: boolean; contact: Contact; outreach: unknown }>('/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  })
