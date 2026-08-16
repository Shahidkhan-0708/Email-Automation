-- Migration: Modify Outreach Records & Add Import Jobs
-- Purpose:
--   1. Link outreach records to their approved AI personalization
--   2. Track file import jobs (PDF/Excel/CSV) with status & progress

-- 1. Link outreach -> personalization_results
ALTER TABLE outreach
  ADD COLUMN IF NOT EXISTS personalization_id UUID REFERENCES personalization_results(id);

CREATE INDEX IF NOT EXISTS idx_outreach_personalization_id ON outreach(personalization_id);

-- 2. Import Jobs Table (tracks file uploads awaiting processing)
CREATE TABLE IF NOT EXISTS import_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename          TEXT NOT NULL,
  file_type         TEXT NOT NULL CHECK (file_type IN ('pdf', 'xlsx', 'csv')),
  file_data         TEXT NOT NULL, -- base64 encoded file contents
  status            TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  total_records     INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  created_records   INTEGER DEFAULT 0,
  updated_records   INTEGER DEFAULT 0,
  skipped_records   INTEGER DEFAULT 0,
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
