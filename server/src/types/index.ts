// === Vaigence AI Teammate — Core Types ===

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
  source: string;               // csv, sheets, hubspot, manual
  metadata: string;             // JSON: extra fields
  sequence_id: string | null;
  touch_index: number;
  last_touch_at: string | null;
  next_touch_at: string | null;
  status: ContactStatus;
  channel_history: string;      // JSON: channels used per touch
  created_at: string;
}

export type ContactStatus =
  | "queued"
  | "active"
  | "paused"
  | "replied"
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
  | "post_meeting";

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
  | "hostile";

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
  meetings_booked: number;
  needs_you: number;
  observations: string[];
  planned_today: number;
}
