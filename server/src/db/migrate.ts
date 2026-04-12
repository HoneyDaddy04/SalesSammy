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
  source TEXT NOT NULL DEFAULT 'manual',
  metadata TEXT NOT NULL DEFAULT '{}',
  sequence_id TEXT REFERENCES sequences(id),
  touch_index INTEGER NOT NULL DEFAULT 0,
  last_touch_at TEXT,
  next_touch_at TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'active', 'paused', 'replied', 'completed', 'opted_out')),
  channel_history TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
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
    CHECK (classification IN ('positive', 'question', 'objection', 'negative', 'referral', 'ooo', 'hostile')),
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_status ON contacts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_next_touch ON contacts(next_touch_at, status);
CREATE INDEX IF NOT EXISTS idx_touch_queue_org ON touch_queue(org_id, status);
CREATE INDEX IF NOT EXISTS idx_touch_queue_scheduled ON touch_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_reply_events_org ON reply_events(org_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_log(org_id, created_at);
`;

export async function runMigrations() {
  await getDb();
  console.log("Running migrations...");
  exec(migrations);
  console.log("Migrations complete.");
}

runMigrations();
