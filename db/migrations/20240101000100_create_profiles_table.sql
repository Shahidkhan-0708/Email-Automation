-- Migration: Create Profiles Table
-- Purpose: Store normalized person attributes separate from contact identity

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  full_name TEXT,
  organization TEXT,
  role TEXT,
  college TEXT,
  degree TEXT,
  graduation_year INTEGER,
  skills TEXT[],
  projects JSONB,
  experience JSONB,
  public_profile_urls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_contact_id ON profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles USING gin(to_tsvector('english', organization));

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at_column();