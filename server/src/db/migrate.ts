import { getDb, exec } from "./database.js";

const migrations = `
-- Core
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequences
CREATE TABLE IF NOT EXISTS sequences (
  id TEXT PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  touches TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  last_touch_at TIMESTAMPTZ,
  next_touch_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'active', 'paused', 'replied', 'converted', 'lost', 'completed', 'opted_out')),
  channel_history TEXT NOT NULL DEFAULT '[]',
  available_channels TEXT NOT NULL DEFAULT '[]',
  conversion_action TEXT,
  conversion_value REAL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Touch queue (drafted/pending/sent messages)
CREATE TABLE IF NOT EXISTS touch_queue (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  sequence_id TEXT REFERENCES sequences(id),
  touch_index INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL,
  angle TEXT NOT NULL,
  drafted_content TEXT NOT NULL DEFAULT '',
  research_context TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'drafted'
    CHECK (status IN ('drafted', 'pending_approval', 'approved', 'sent', 'failed', 'skipped')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  edit_distance REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding state
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  current_question INTEGER NOT NULL DEFAULT 0,
  answers TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversations + messages
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL DEFAULT 'teammate_chat'
    CHECK (type IN ('teammate_chat', 'onboarding', 'sandbox')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations
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
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  billing_cycle_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbound message classification
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job queue
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Config revision history
CREATE TABLE IF NOT EXISTS config_revisions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  snapshot TEXT NOT NULL DEFAULT '{}',
  change_description TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-context overrides
CREATE TABLE IF NOT EXISTS context_overrides (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  scope_type TEXT NOT NULL
    CHECK (scope_type IN ('segment', 'sequence', 'channel')),
  scope_id TEXT NOT NULL,
  persona_additions TEXT NOT NULL DEFAULT '',
  instruction_additions TEXT NOT NULL DEFAULT '',
  voice_overrides TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval gates
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
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Contact memory
CREATE TABLE IF NOT EXISTS contact_memory (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'interest', 'objection', 'preference', 'interaction', 'insight')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  org_id TEXT REFERENCES organizations(id),
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern insights
CREATE TABLE IF NOT EXISTS pattern_insights (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const indexes = `
CREATE INDEX IF NOT EXISTS idx_inbound_org ON inbound_messages(org_id, classification);
CREATE INDEX IF NOT EXISTS idx_contacts_org_status ON contacts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_next_touch ON contacts(next_touch_at, status);
CREATE INDEX IF NOT EXISTS idx_touch_queue_org ON touch_queue(org_id, status);
CREATE INDEX IF NOT EXISTS idx_touch_queue_scheduled ON touch_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_reply_events_org ON reply_events(org_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_log(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_org ON job_queue(org_id, type);
CREATE INDEX IF NOT EXISTS idx_config_revisions_entity ON config_revisions(entity_type, entity_id, revision_number);
CREATE INDEX IF NOT EXISTS idx_context_overrides_org ON context_overrides(org_id, scope_type);
CREATE INDEX IF NOT EXISTS idx_approval_gates_org ON approval_gates(org_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_memory_org ON contact_memory(org_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_org ON pattern_insights(org_id, insight_type);
`;

export async function runMigrations() {
  const pool = await getDb();
  console.log("Running migrations...");
  // pg can't run multiple statements in one query — use a single transaction
  await pool.query(migrations);
  await pool.query(indexes);
  console.log("Migrations complete.");
}

// Auto-run when called directly
runMigrations().catch(e => { console.error("Migration failed:", e.message); process.exit(1); });
