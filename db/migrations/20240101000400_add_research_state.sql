-- Migration: Add research state columns to profiles
-- Purpose: Persist the per-person research pipeline (identity matching,
-- candidate profiles, job state) so the UI can show research status across
-- restarts, and evidence can always be traced back to identity confidence.
--
-- Apply in the Supabase SQL editor (project rules: no direct psql access).
-- The backend feature-detects these columns, so the app keeps working before
-- and after this migration is applied; applying it just turns on persistence.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_stage TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_identity_confidence REAL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_best_match TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_candidates JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_last_run_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_error TEXT;
