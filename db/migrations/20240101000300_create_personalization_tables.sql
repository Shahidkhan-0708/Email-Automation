-- Migration: Create Personalization Tables
-- Purpose: Store AI-generated personalized emails with evidence attribution

-- Personalization Results Table
CREATE TABLE IF NOT EXISTS personalization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  campaign_id UUID REFERENCES campaigns(id),
  subject TEXT,
  body TEXT,
  evidence_used JSONB NOT NULL DEFAULT '[]', -- [{ fact_id, reason, source, confidence }]
  ai_model TEXT,
  generation_prompt TEXT,
  status TEXT DEFAULT 'pending_review'
              CHECK (status IN ('pending_review', 'approved', 'rejected', 'edited')),
  edited_subject TEXT,
  edited_body TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES contacts(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES contacts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review Decisions Table
CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personalization_id UUID REFERENCES personalization_results(id),
  decision TEXT NOT NULL
              CHECK (decision IN ('approved', 'rejected', 'edited')),
  comments TEXT,
  edited_subject TEXT,
  edited_body TEXT,
  decided_by UUID REFERENCES contacts(id),
  decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for personalization
CREATE INDEX IF NOT EXISTS idx_personalization_profile_id ON personalization_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_personalization_campaign_id ON personalization_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_personalization_status ON personalization_results(status);
CREATE INDEX IF NOT EXISTS idx_personalization_approved_by ON personalization_results(approved_by);
CREATE INDEX IF NOT EXISTS idx_review_decisions_personalization_id ON review_decisions(personalization_id);
CREATE INDEX IF NOT EXISTS idx_review_decisions_decided_by ON review_decisions(decided_by);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_personalization_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_personalization_results_updated_at
BEFORE UPDATE ON personalization_results
FOR EACH ROW EXECUTE FUNCTION update_personalization_results_updated_at();