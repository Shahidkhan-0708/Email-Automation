-- ===================================================
-- Resumes: stores uploaded resume files for the
-- job search module (resume matching, cover letter gen).
-- ===================================================

CREATE TABLE IF NOT EXISTS resumes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  content       TEXT,          -- extracted text content (from PDF/DOCX/TXT)
  file_type     TEXT,          -- pdf, docx, txt, etc.
  file_size     INTEGER,       -- bytes
  raw_bytes     BYTEA,         -- original file bytes (optional, for re-processing)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

CREATE OR REPLACE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: users can only see their own resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resumes"
  ON resumes FOR ALL USING (auth.uid() = user_id);
