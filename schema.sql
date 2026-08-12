-- ===================================================
-- College Outreach Automation System V2 - Schema SQL
-- Target Database: PostgreSQL / Supabase
-- ===================================================

-- 1. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  organization            TEXT,
  role                    TEXT,
  personalization         TEXT,
  personalization_approved BOOLEAN DEFAULT FALSE,
  do_not_contact          BOOLEAN DEFAULT FALSE,
  suppressed              BOOLEAN DEFAULT FALSE,
  suppression_reason      TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT DEFAULT 'Active'
                CHECK (status IN ('Active', 'Paused', 'Completed')),
  sender_email  TEXT NOT NULL,
  sender_name   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Outreach Table (State Machine & Enrollment)
CREATE TABLE IF NOT EXISTS outreach (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id        UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  campaign_id       UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  -- State machine
  status            TEXT DEFAULT 'Ready'
                    CHECK (status IN (
                      'Ready','Claimed','Sending','Sent',
                      'Follow-up 1','Follow-up 2',
                      'Replied','Closed','Error'
                    )),
  claim_id          TEXT,
  claimed_at        TIMESTAMPTZ,

  -- Email content
  subject           TEXT,
  email_body        TEXT,

  -- Timing & State
  sent_at           TIMESTAMPTZ,
  last_outbound_at  TIMESTAMPTZ,
  last_inbound_at   TIMESTAMPTZ,
  next_action_at    TIMESTAMPTZ,
  sequence_step     INTEGER DEFAULT 0,

  -- Delivery tracking
  provider_message_id TEXT,
  delivery_status     TEXT DEFAULT 'Pending'
                      CHECK (delivery_status IN (
                        'Pending','Queued','Sent','Delivered',
                        'Bounced','Failed','Blocked'
                      )),
  bounce_reason       TEXT,

  -- Reply data
  reply_body          TEXT,
  reply_received_at   TIMESTAMPTZ,
  gmail_message_id    TEXT,
  gmail_thread_id     TEXT,

  -- AI classification
  ai_category         TEXT
                      CHECK (ai_category IN (
                        'INTERESTED','NOT_INTERESTED','MEETING_REQUEST',
                        'QUESTION','FOLLOW_UP_LATER','OUT_OF_OFFICE','OTHER', NULL
                      )),
  ai_confidence       REAL,
  ai_sentiment        TEXT,
  ai_summary          TEXT,
  ai_next_action      TEXT,
  ai_suggested_followup_date DATE,
  ai_requires_human_review   BOOLEAN DEFAULT TRUE,

  -- Error tracking
  error_message       TEXT,
  error_category      TEXT,
  retry_count         INTEGER DEFAULT 0,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_id, campaign_id)
);

-- 4. Processed Gmail Messages (Idempotency)
CREATE TABLE IF NOT EXISTS processed_gmail_messages (
  message_id    TEXT PRIMARY KEY,
  processed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach(status);
CREATE INDEX IF NOT EXISTS idx_outreach_next_action ON outreach(next_action_at);
CREATE INDEX IF NOT EXISTS idx_outreach_gmail_msg ON outreach(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_outreach_gmail_thread ON outreach(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Auto-update updated_at helper trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_outreach_updated_at
BEFORE UPDATE ON outreach
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
