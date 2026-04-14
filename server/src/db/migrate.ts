import { getDb, exec } from "./database.js";

const migrations = `
-- Core
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Single teammate per org
CREATE TABLE IF NOT EXISTS teammate (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  business_description TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  lead_trigger_signals TEXT NOT NULL DEFAULT '',
  lead_source_type TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  voice_examples TEXT NOT NULL DEFAULT '[]',
  guardrails TEXT NOT NULL DEFAULT '[]',
  escalation_contact TEXT NOT NULL DEFAULT '{}',
  conversion_actions TEXT NOT NULL DEFAULT '[]',
  persona_prompt TEXT NOT NULL DEFAULT '',
  operating_instructions TEXT NOT NULL DEFAULT '',
  autonomy_stats TEXT NOT NULL DEFAULT '{}',
  primary_channel TEXT NOT NULL DEFAULT 'email',
  secondary_channel TEXT,
  tertiary_channel TEXT,
  status TEXT NOT NULL DEFAULT 'shadow' CHECK (status IN ('shadow', 'supervised', 'autonomous')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Contacts (leads the teammate works)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  linkedin TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  lead_score INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  source_detail TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  sequence_id TEXT REFERENCES sequences(id),
  touch_index INTEGER NOT NULL DEFAULT 0,
  last_touch_at TEXT,
  next_touch_at TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'active', 'paused', 'replied', 'converted', 'lost', 'completed', 'opted_out')),
  channel_history TEXT NOT NULL DEFAULT '[]',
  available_channels TEXT NOT NULL DEFAULT '[]',
  conversion_action TEXT,
  conversion_value REAL,
  converted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 5 hardcoded sequence templates
CREATE TABLE IF NOT EXISTS sequences (
  id TEXT PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  touches TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Touch queue (drafted/pending/sent messages)
CREATE TABLE IF NOT EXISTS touch_queue (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  sequence_id TEXT NOT NULL REFERENCES sequences(id),
  touch_index INTEGER NOT NULL,
  channel TEXT NOT NULL,
  angle TEXT NOT NULL,
  drafted_content TEXT NOT NULL DEFAULT '',
  research_context TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'drafted'
    CHECK (status IN ('drafted', 'pending_approval', 'approved', 'sent', 'failed', 'skipped')),
  scheduled_for TEXT,
  sent_at TEXT,
  edit_distance REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Reply events
CREATE TABLE IF NOT EXISTS reply_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  classification TEXT
    CHECK (classification IN ('positive', 'question', 'objection', 'negative', 'referral', 'ooo', 'hostile', 'support', 'not_a_lead')),
  auto_response_drafted TEXT,
  routed_action TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'handled', 'escalated')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'info'
    CHECK (status IN ('info', 'success', 'warning', 'error', 'pending')),
  contact_name TEXT,
  touch_queue_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Knowledge base
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Onboarding state (conversation-based)
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  current_question INTEGER NOT NULL DEFAULT 0,
  answers TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Chat with teammate (conversations + messages)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL DEFAULT 'teammate_chat'
    CHECK (type IN ('teammate_chat', 'onboarding', 'sandbox')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Integrations (connected tools: Gmail, WhatsApp, HubSpot, Sheets, etc.)
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'channel'
    CHECK (category IN ('channel', 'lead_source', 'context', 'calendar')),
  status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'error')),
  credentials TEXT NOT NULL DEFAULT '{}',
  config TEXT NOT NULL DEFAULT '{}',
  last_synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Subscriptions & billing
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  plan TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'growth', 'scale')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled')),
  touches_limit INTEGER NOT NULL DEFAULT 500,
  touches_used INTEGER NOT NULL DEFAULT 0,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  billing_cycle_start TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Inbound message classification (routing before sequences)
CREATE TABLE IF NOT EXISTS inbound_messages (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  channel TEXT NOT NULL,
  sender_identifier TEXT NOT NULL,
  content TEXT NOT NULL,
  classification TEXT
    CHECK (classification IN ('new_lead', 'returning_lead', 'existing_customer_support', 'existing_customer_upsell', 'spam', 'unknown')),
  matched_contact_id TEXT REFERENCES contacts(id),
  routed_to TEXT CHECK (routed_to IN ('teammate', 'support', 'human')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inbound_org ON inbound_messages(org_id, classification);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_status ON contacts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_next_touch ON contacts(next_touch_at, status);
CREATE INDEX IF NOT EXISTS idx_touch_queue_org ON touch_queue(org_id, status);
CREATE INDEX IF NOT EXISTS idx_touch_queue_scheduled ON touch_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_reply_events_org ON reply_events(org_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_log(org_id, created_at);

-- Job queue (async processing)
CREATE TABLE IF NOT EXISTS job_queue (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  result TEXT NOT NULL DEFAULT '{}',
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_org ON job_queue(org_id, type);

-- Config revision history (versioning)
CREATE TABLE IF NOT EXISTS config_revisions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  snapshot TEXT NOT NULL DEFAULT '{}',
  change_description TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_config_revisions_entity ON config_revisions(entity_type, entity_id, revision_number);

-- Per-context overrides (isolation per segment/sequence/channel)
CREATE TABLE IF NOT EXISTS context_overrides (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  scope_type TEXT NOT NULL
    CHECK (scope_type IN ('segment', 'sequence', 'channel')),
  scope_id TEXT NOT NULL,
  persona_additions TEXT NOT NULL DEFAULT '',
  instruction_additions TEXT NOT NULL DEFAULT '',
  voice_overrides TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_context_overrides_org ON context_overrides(org_id, scope_type);

-- Approval gates (sensitive operations require human sign-off)
CREATE TABLE IF NOT EXISTS approval_gates (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  gate_type TEXT NOT NULL
    CHECK (gate_type IN ('config_change', 'budget_breach', 'autonomy_transition', 'sequence_change', 'escalation_rule')),
  entity_id TEXT,
  old_value TEXT NOT NULL DEFAULT '{}',
  new_value TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_approval_gates_org ON approval_gates(org_id, status);

-- Contact memory (per-contact learned facts)
CREATE TABLE IF NOT EXISTS contact_memory (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'interest', 'objection', 'preference', 'interaction', 'insight')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_memory_org ON contact_memory(org_id, contact_id);

-- Pattern insights (learned across all contacts)
CREATE TABLE IF NOT EXISTS pattern_insights (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pattern_insights_org ON pattern_insights(org_id, insight_type);
`;

// ALTER TABLE migrations for existing databases (SQLite ignores if column exists via try/catch)
const alterMigrations = [
  "ALTER TABLE contacts ADD COLUMN role TEXT",
  "ALTER TABLE contacts ADD COLUMN linkedin TEXT",
  "ALTER TABLE contacts ADD COLUMN website TEXT",
  "ALTER TABLE contacts ADD COLUMN industry TEXT",
  "ALTER TABLE contacts ADD COLUMN company_size TEXT",
  "ALTER TABLE contacts ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE contacts ADD COLUMN notes TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE contacts ADD COLUMN lead_score INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE contacts ADD COLUMN source_detail TEXT",
  "ALTER TABLE contacts ADD COLUMN available_channels TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE contacts ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))",
];

export async function runMigrations() {
  await getDb();
  console.log("Running migrations...");
  exec(migrations);

  // Run ALTER TABLE migrations (ignore errors for already-existing columns)
  for (const sql of alterMigrations) {
    try { exec(sql); } catch {}
  }

  console.log("Migrations complete.");
}

runMigrations();
