-- Migration: Add linkedin_url to profiles
-- Purpose: Store the discovered LinkedIn profile URL so the research engine
-- doesn't re-search for it on every run.  The backend feature-detects this
-- column, so the app works before AND after this migration is applied.
--
-- Apply in the Supabase SQL editor (project rules: no direct psql access).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
