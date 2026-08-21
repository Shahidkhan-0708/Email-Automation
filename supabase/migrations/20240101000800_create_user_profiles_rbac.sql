-- ===================================================
-- RBAC: user_profiles table
-- Stores role, enabled modules, and active workspace
-- per authenticated user. Linked to Supabase auth.users.
-- ===================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'college_operator'
                    CHECK (role IN ('owner', 'admin', 'college_operator')),
  enabled_modules TEXT[] NOT NULL DEFAULT '{outreach}'
                    CHECK (enabled_modules <@ '{outreach,job_search}'),
  active_workspace TEXT NOT NULL DEFAULT 'outreach'
                    CHECK (active_workspace IN ('outreach', 'job_search')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can only read their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role (backend) bypasses RLS, so no policy needed for INSERT/DELETE.

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookup by user_id (the auth middleware's hot path)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
