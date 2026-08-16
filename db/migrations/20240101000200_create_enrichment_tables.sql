-- Migration: Create Enrichment Tables
-- Purpose: Store research/enrichment data with provenance tracking

-- Enrichment Sources Table
CREATE TABLE IF NOT EXISTS enrichment_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'linkedin', 'academic', 'company', 'news', 'manual'
  is_enabled BOOLEAN DEFAULT TRUE,
  api_key_required BOOLEAN DEFAULT FALSE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default sources
INSERT INTO enrichment_sources (id, name, type, is_enabled) VALUES
  ('manual', 'Manual Entry', 'manual', TRUE),
  ('company_site', 'Company Website', 'company', TRUE),
  ('academic_db', 'Academic Database', 'academic', TRUE),
  ('news_api', 'News API', 'news', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Enrichment Results Table
CREATE TABLE IF NOT EXISTS enrichment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_id TEXT REFERENCES enrichment_sources(id),
  source_url TEXT,
  relationship TEXT NOT NULL, -- 'degree', 'project', 'achievement', 'skill', 'award', 'publication', etc.
  fact_value JSONB NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE
);

-- Link table: profiles to enrichment results (many-to-many if needed)
CREATE TABLE IF NOT EXISTS profile_enrichment_links (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrichment_id UUID REFERENCES enrichment_results(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, enrichment_id)
);

-- Indexes for enrichment
CREATE INDEX IF NOT EXISTS idx_enrichment_profile_id ON enrichment_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_source_id ON enrichment_results(source_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_relationship ON enrichment_results(relationship);
CREATE INDEX IF NOT EXISTS idx_enrichment_confidence ON enrichment_results(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_extracted_at ON enrichment_results(extracted_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_enrichment_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_enrichment_sources_updated_at
BEFORE UPDATE ON enrichment_sources
FOR EACH ROW EXECUTE FUNCTION update_enrichment_sources_updated_at();