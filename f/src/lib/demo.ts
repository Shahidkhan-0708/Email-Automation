// ---------------------------------------------------------------------------
// Demo data — used ONLY where the backend has no live endpoint yet.
// Replace these arrays with API responses when the corresponding routes exist.
// The primary pages (dashboard, review, people, import, outreach, replies,
// campaigns) are driven by real data from lib/api.ts via AppContext.
//
// TODO(cleanup): these demo arrays back the Research page (enrichment endpoint
// is still a stub), the Settings integrations list, the sidebar activity feed,
// and the Personalization variant picker. Replace with real endpoints as they
// land (roadmap M2 enrichment; M4 settings/activity endpoints).
// ---------------------------------------------------------------------------

export interface EnrichmentSource {
  id: string
  name: string
  kind: 'publication' | 'profile' | 'news' | 'grant'
  snippet: string
  url: string
  confidence: number
  cited: boolean
}

export interface ResearchProfile {
  id: string
  name: string
  organization: string
  role: string
  status: 'queued' | 'researching' | 'enriched' | 'needs_attention'
  sources: EnrichmentSource[]
}

export const demoResearch: ResearchProfile[] = [
  {
    id: 'rp-1',
    name: 'Dr. Elena Vasquez',
    organization: 'Stanford University',
    role: 'Associate Professor, CS',
    status: 'enriched',
    sources: [
      { id: 's-1', name: 'Sparse attention in long-context retrieval', kind: 'publication', snippet: 'NeurIPS 2024 paper introducing SPLADE-v2 retrieval over 1M-token corpora.', url: '#', confidence: 0.94, cited: true },
      { id: 's-2', name: 'Stanford profile · e.vasquez', kind: 'profile', snippet: 'Leads the Language Systems Lab; teaches CS224U (NLP) and CS224N.', url: '#', confidence: 0.91, cited: true },
      { id: 's-3', name: 'NSF CAREER award · retrieval systems', kind: 'grant', snippet: '$650k CAREER award for efficient neural retrieval, awarded 2025.', url: '#', confidence: 0.86, cited: true },
    ],
  },
  {
    id: 'rp-2',
    name: 'Prof. Rajiv Menon',
    organization: 'IIT Bombay',
    role: 'Professor, Machine Learning',
    status: 'enriched',
    sources: [
      { id: 's-4', name: 'Federated tuning of multilingual encoders', kind: 'publication', snippet: 'ACL 2025 paper on privacy-preserving fine-tuning across 23 languages.', url: '#', confidence: 0.89, cited: true },
      { id: 's-5', name: 'IIT Bombay faculty page', kind: 'profile', snippet: 'Co-directs the Centre for AI; runs the annual ML summer school.', url: '#', confidence: 0.88, cited: true },
    ],
  },
  {
    id: 'rp-3',
    name: 'Dr. Amara Okafor',
    organization: 'University of Edinburgh',
    role: 'Senior Lecturer, Informatics',
    status: 'enriched',
    sources: [
      { id: 's-6', name: 'Climate model coupling with ML surrogates', kind: 'publication', snippet: 'Nature Climate Change 2024 — neural surrogates for regional ocean models.', url: '#', confidence: 0.92, cited: true },
      { id: 's-7', name: 'News · Edinburgh informatics', kind: 'news', snippet: 'Featured in university research roundup for AI-for-climate work.', url: '#', confidence: 0.8, cited: false },
    ],
  },
  {
    id: 'rp-4',
    name: 'Prof. Henrik Lund',
    organization: 'ETH Zürich',
    role: 'Professor, Robotics',
    status: 'needs_attention',
    sources: [
      { id: 's-8', name: 'Soft manipulators for delicate assembly', kind: 'publication', snippet: 'IEEE T-RO 2024. Abstract unavailable in index — verify manually.', url: '#', confidence: 0.62, cited: false },
    ],
  },
]

export interface DemoVariant {
  id: string
  label: string
  tone: 'formal' | 'warm' | 'concise'
  confidence: number
  subject: string
  body: string
  winner: boolean
}

export const demoVariants: DemoVariant[] = [
  {
    id: 'v-1',
    label: 'Variant A · research-first',
    tone: 'formal',
    confidence: 0.94,
    subject: 'Your 2024 work on sparse retrieval — a question',
    body: 'Dear Dr. Vasquez,\n\nYour NeurIPS 2024 paper on sparse attention in long-context retrieval shaped how we think about cost-efficient search at scale. I am reaching out because the cohort I advise is building retrieval over a corpus of research profiles, and your SPLADE-v2 approach is directly relevant.\n\nWould you be open to a 20-minute call next week to discuss how your lab thinks about the efficiency/quality trade-off?\n\nBest,\nShahid Khan\nCollege Outreach',
    winner: true,
  },
  {
    id: 'v-2',
    label: 'Variant B · warm',
    tone: 'warm',
    confidence: 0.87,
    subject: 'Admiring your retrieval work',
    body: 'Dear Dr. Vasquez,\n\nI came across your lab\u2019s work on efficient retrieval while preparing our outreach program and honestly could not stop reading. The way SPLADE-v2 handles long contexts is remarkable.\n\nI\u2019d love the chance to ask you a couple of questions about it — even a quick email exchange would be wonderful.\n\nWarmly,\nShahid Khan',
    winner: false,
  },
  {
    id: 'v-3',
    label: 'Variant C · concise',
    tone: 'concise',
    confidence: 0.81,
    subject: 'Question re: sparse retrieval',
    body: 'Hi Dr. Vasquez,\n\nWe run a college outreach program and your sparse-retrieval work is the closest match to our problem. Could I ask you one question about it?\n\nBest,\nShahid Khan',
    winner: false,
  },
]

export interface DemoActivity {
  id: string
  text: string
  tone: 'sage' | 'amber' | 'blue' | 'terra'
  time: string
}

export const demoActivity: DemoActivity[] = [
  { id: 'a-1', text: 'Batch #B-1187 sent — 38 mails', tone: 'sage', time: '2m' },
  { id: 'a-2', text: 'GPT-4o drafted 62 openers', tone: 'amber', time: '11m' },
  { id: 'a-3', text: '11 new replies classified', tone: 'blue', time: '26m' },
  { id: 'a-4', text: 'Airtable sync completed', tone: 'sage', time: '1h' },
]

export interface IntegrationStatus {
  id: string
  name: string
  state: 'connected' | 'attention' | 'off' | 'coming'
  detail: string
  provider: string
}

export const integrationStatus: IntegrationStatus[] = [
  { id: 'supabase', name: 'Supabase', state: 'connected', detail: 'Postgres · source of truth', provider: 'supabase' },
  { id: 'brevo', name: 'Brevo SMTP', state: 'connected', detail: 'Transactional sending', provider: 'brevo' },
  { id: 'gmail', name: 'Gmail OAuth', state: 'connected', detail: 'Inbound reply detection', provider: 'google' },
  { id: 'openai', name: 'OpenAI', state: 'connected', detail: 'Personalization + classification', provider: 'openai' },
  { id: 'airtable', name: 'Airtable sync', state: 'attention', detail: 'Dashboard sync · 4m ago', provider: 'airtable' },
]

export const replyClassColors: Record<string, string> = {
  Interested: '#7FB069',
  Meeting_request: '#7FB069',
  Question: '#5B7DB1',
  Follow_up_later: '#E8A552',
  Out_of_office: '#a89d91',
  Not_interested: '#C4715A',
}
