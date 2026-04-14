// === Vaigence AI Teammate - Core Types ===

// --- Organization ---

export interface Organization {
  id: string;
  name: string;
  industry: string;
  created_at: string;
}

// --- Teammate Config (one per org) ---

export interface TeammateConfig {
  id: string;
  org_id: string;
  business_description: string;
  target_audience: string;
  lead_trigger_signals: string;   // "what's a sign they need you now?"
  lead_source_type: string;       // how leads come in (inbound, cold, DM, referral, etc.)
  goal: string;                   // what you want leads to do
  voice_examples: string;         // JSON array of sample messages
  guardrails: string;             // JSON array of don't-say rules
  escalation_contact: string;     // JSON { name, email, channel }
  conversion_actions: string;     // JSON ConversionAction[] — what "converted" means for this business
  persona_prompt: string;         // generated from interview answers
  operating_instructions: string; // accumulated chat adjustments
  autonomy_stats: string;         // JSON: per-message-type approval counts + edit distances
  primary_channel: ChannelType;
  secondary_channel: ChannelType | null;
  tertiary_channel: ChannelType | null;
  status: "shadow" | "supervised" | "autonomous";
  created_at: string;
}

// --- Contacts (leads/customers the teammate works) ---

export interface Contact {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  linkedin: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  tags: string;                 // JSON array of tag strings
  notes: string;
  lead_score: number;           // 0-100, computed from engagement signals
  source: string;               // csv, sheets, hubspot, manual, webhook, crm
  source_detail: string | null; // e.g. form name, sheet name, CRM pipeline
  metadata: string;             // JSON: extra fields
  sequence_id: string | null;
  touch_index: number;
  last_touch_at: string | null;
  next_touch_at: string | null;
  status: ContactStatus;
  channel_history: string;      // JSON: channels used per touch
  available_channels: string;   // JSON: channels we can reach this contact on
  conversion_action: string | null;
  conversion_value: number | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactStatus =
  | "queued"
  | "active"
  | "paused"
  | "replied"
  | "converted"     // took the desired action (purchased, booked, signed up)
  | "lost"          // went cold after engagement, or explicitly said no
  | "completed"
  | "opted_out";

// --- Sequences (5 hardcoded templates) ---

export interface Sequence {
  id: string;
  template_key: SequenceKey;
  name: string;
  description: string;
  touches: string;  // JSON array of Touch[]
  active: boolean;
  created_at: string;
}

export type SequenceKey =
  | "cold_outbound"
  | "abandoned_cart"
  | "inbound_lead"
  | "re_engagement"
  | "post_conversion"    // upsell, review request, referral ask after conversion
  | "stalled_revival";   // re-engage leads that went quiet after replying

export interface Touch {
  day_offset: number;
  angle: TouchAngle;
  channel_tier: "primary" | "secondary" | "tertiary";
}

export type TouchAngle =
  | "trigger_event"      // strongest trigger event
  | "value_add"          // provide value, no ask
  | "different_angle"    // new trigger or different intel
  | "permission_to_close" // "bad timing?"
  | "revival";           // only if new trigger emerges

// --- Touch Queue (messages drafted/pending/sent) ---

export interface TouchQueueItem {
  id: string;
  org_id: string;
  contact_id: string;
  sequence_id: string;
  touch_index: number;
  channel: ChannelType;
  angle: TouchAngle;
  drafted_content: string;
  research_context: string;
  status: TouchStatus;
  scheduled_for: string;
  sent_at: string | null;
  edit_distance: number | null;  // how much the user edited before approving
  created_at: string;
}

export type TouchStatus =
  | "drafted"
  | "pending_approval"
  | "approved"
  | "sent"
  | "failed"
  | "skipped";

// --- Reply Events ---

export interface ReplyEvent {
  id: string;
  org_id: string;
  contact_id: string;
  channel: ChannelType;
  content: string;
  classification: ReplyClassification;
  auto_response_drafted: string | null;
  routed_action: string | null;
  status: "pending" | "handled" | "escalated";
  created_at: string;
}

export type ReplyClassification =
  | "positive"
  | "question"
  | "objection"
  | "negative"
  | "referral"
  | "ooo"
  | "hostile"
  | "support"          // existing customer, route away from sales
  | "not_a_lead";      // spam, wrong person, irrelevant

// --- Activity Log ---

export interface ActivityEntry {
  id: string;
  org_id: string;
  action: string;
  detail: string;
  status: "info" | "success" | "warning" | "error" | "pending";
  contact_name: string | null;
  touch_queue_id: string | null;
  created_at: string;
}

// --- Channels ---

export type ChannelType =
  | "email"
  | "whatsapp"
  | "instagram"
  | "linkedin"
  | "sms"
  | "telegram"
  | "facebook"
  | "sandbox";

// --- Integrations ---

export interface Integration {
  id: string;
  org_id: string;
  type: string;           // gmail, whatsapp, hubspot, google_sheets, etc.
  category: IntegrationCategory;
  status: "connected" | "disconnected" | "error";
  credentials: string;    // encrypted JSON
  config: string;         // JSON: sync settings
  last_synced_at: string | null;
  created_at: string;
}

export type IntegrationCategory = "channel" | "lead_source" | "context" | "calendar";

// --- Billing ---

export interface Subscription {
  id: string;
  org_id: string;
  plan: "starter" | "growth" | "scale";
  status: "active" | "past_due" | "cancelled";
  touches_limit: number;
  touches_used: number;
  price_monthly: number;
  billing_cycle_start: string | null;
  created_at: string;
}

// --- Onboarding ---

export interface OnboardingState {
  org_id: string;
  conversation_id: string;
  current_question: number;  // 0-9
  answers: Record<string, string>;
  status: "in_progress" | "complete";
}

// --- Standup ---

export interface StandupReport {
  date: string;
  touches_sent: number;
  replies_received: number;
  positive_replies: number;
  conversions: number;
  needs_you: number;
  observations: string[];
  planned_today: number;
  conversion_value: number;       // total dollar value of conversions today
}

// --- Conversion Actions (what "converted" means for this business) ---

export interface ConversionAction {
  key: string;                    // e.g. "purchase", "book_service", "signup", "book_meeting"
  label: string;                  // e.g. "Made a purchase", "Booked a service"
  cta_type: "link" | "code" | "booking" | "reply";  // what the teammate sends
  cta_value: string;              // URL, discount code template, booking link, or instruction
  trackable: boolean;             // can we detect conversion automatically?
}

// --- Inbound Classification (routing inbound messages before they hit sequences) ---

export type InboundClassification =
  | "new_lead"                    // unknown sender, buying intent
  | "returning_lead"              // known contact re-engaging
  | "existing_customer_support"   // known customer, support issue — route away
  | "existing_customer_upsell"    // known customer, buying more — handle
  | "spam"
  | "unknown";                    // needs human triage

// --- Job Queue ---

export interface Job {
  id: string;
  org_id: string;
  type: "draft_touch" | "send_touch" | "import_contacts" | "sync_integration";
  payload: string;
  status: "queued" | "running" | "completed" | "failed";
  result: string;
  error: string | null;
  attempts: number;
  max_attempts: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// --- Config Versioning ---

export interface ConfigRevision {
  id: string;
  org_id: string;
  entity_type: "teammate" | "sequence" | "context_override";
  entity_id: string;
  revision_number: number;
  snapshot: string;
  change_description: string;
  changed_by: "user" | "system" | "chat";
  created_at: string;
}

// --- Context Overrides (Per-Context Isolation) ---

export interface ContextOverride {
  id: string;
  org_id: string;
  scope_type: "segment" | "sequence" | "channel";
  scope_id: string;
  persona_additions: string;
  instruction_additions: string;
  voice_overrides: string;
  created_at: string;
}

// --- Approval Gates ---

export interface ApprovalGate {
  id: string;
  org_id: string;
  gate_type: "config_change" | "budget_breach" | "autonomy_transition" | "sequence_change" | "escalation_rule";
  entity_id: string | null;
  old_value: string;
  new_value: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

// --- Inbound Messages ---

export interface InboundMessage {
  id: string;
  org_id: string;
  channel: ChannelType;
  sender_identifier: string;      // email, phone, or platform ID
  content: string;
  classification: InboundClassification;
  matched_contact_id: string | null;
  routed_to: "teammate" | "support" | "human" | null;
  created_at: string;
}
