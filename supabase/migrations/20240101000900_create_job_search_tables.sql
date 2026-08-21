-- ===================================================
-- Job Search Module Tables
-- Scoped to individual users (user_id = auth.uid()).
-- ===================================================

-- Jobs: discovered/applied/tracked positions
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  company       TEXT NOT NULL,
  location      TEXT,
  url           TEXT,
  description   TEXT,
  salary_range  TEXT,
  source        TEXT,
  status        TEXT DEFAULT 'discovered'
                  CHECK (status IN (
                    'discovered','researching','applying','applied',
                    'interviewing','offered','rejected','withdrawn'
                  )),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

CREATE OR REPLACE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Applications: tracks each job application
CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  resume_version  TEXT,
  cover_letter    TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'applied'
                    CHECK (status IN (
                      'applied','pending_response','interview',
                      'technical_round','final_round','offered',
                      'rejected','withdrawn'
                    )),
  applied_at      TIMESTAMPTZ DEFAULT NOW(),
  next_follow_up  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);

CREATE OR REPLACE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recruiter Outreach: track emails/messages to recruiters
CREATE TABLE IF NOT EXISTS recruiter_outreach (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
  recruiter_name  TEXT NOT NULL,
  recruiter_email TEXT NOT NULL,
  company         TEXT,
  linkedin_url    TEXT,
  message         TEXT,
  status          TEXT DEFAULT 'draft'
                    CHECK (status IN (
                      'draft','sent','replied','meeting_scheduled','closed'
                    )),
  sent_at         TIMESTAMPTZ,
  reply_received_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_outreach_user_id ON recruiter_outreach(user_id);

CREATE OR REPLACE TRIGGER update_recruiter_outreach_updated_at
  BEFORE UPDATE ON recruiter_outreach
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: users can only see their own job search data
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own jobs"
  ON jobs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own applications"
  ON applications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recruiter outreach"
  ON recruiter_outreach FOR ALL USING (auth.uid() = user_id);
