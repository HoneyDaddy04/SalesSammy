-- Row-Level Security policies for multi-tenancy
-- Run this against your Supabase Postgres database.
-- These ensure no cross-org data leaks even if app code has bugs.

-- Helper: tables that have org_id and need RLS
-- Each policy allows access only when the JWT's org_id matches the row's org_id.

-- Enable RLS on all org-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teammate ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE touch_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- For the service role (server-side), allow all access.
-- The server uses the service_role key which bypasses RLS by default in Supabase.
-- These policies apply to the anon/authenticated roles only.

-- Organizations: users can only see their own org
CREATE POLICY org_isolation ON organizations
  FOR ALL USING (id = current_setting('app.current_org_id', true));

-- Generic org_id isolation policy for all other tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'teammate', 'contacts', 'touch_queue', 'reply_events', 'activity_log',
      'knowledge_chunks', 'integrations', 'subscriptions', 'inbound_messages',
      'job_queue', 'config_revisions', 'context_overrides', 'approval_gates',
      'contact_memory', 'pattern_insights', 'onboarding_sessions', 'conversations'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY org_isolation ON %I FOR ALL USING (org_id = current_setting(''app.current_org_id'', true))',
      tbl
    );
  END LOOP;
END
$$;
