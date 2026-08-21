-- Migration: Add linkedin_url to profiles
-- Purpose: Store the LinkedIn profile URL for alumni-discovered contacts.
-- The column is nullable; existing rows are unaffected.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Useful for dedup: find profiles by LinkedIn URL
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_url
  ON profiles (linkedin_url)
  WHERE linkedin_url IS NOT NULL;
