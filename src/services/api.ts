const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API request failed");
  }
  return res.json();
}

// --- Onboarding ---

export interface OnboardingStartResponse {
  org_id: string;
  session_id: string;
  message: string;
  question_index: number;
  total_questions: number;
}

export interface OnboardingAnswerResponse {
  message: string;
  question_index: number;
  total_questions: number;
  complete: boolean;
  sample_message?: string;
  org_id?: string;
  teammate_id?: string;
}

export function startOnboarding(userName: string, userEmail: string, companyName: string): Promise<OnboardingStartResponse> {
  return request("/api/onboarding/start", {
    method: "POST",
    body: JSON.stringify({ user_name: userName, user_email: userEmail, company_name: companyName }),
  });
}

export function answerOnboarding(sessionId: string, answer: string): Promise<OnboardingAnswerResponse> {
  return request("/api/onboarding/answer", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, answer }),
  });
}

export function sendOnboardingFeedback(orgId: string, feedback: string): Promise<{ status: string }> {
  return request("/api/onboarding/feedback", {
    method: "POST",
    body: JSON.stringify({ org_id: orgId, feedback }),
  });
}

// --- Teammate ---

export interface Teammate {
  id: string;
  org_id: string;
  persona_prompt: string;
  status: string;
  primary_channel: string;
  secondary_channel: string | null;
  created_at: string;
}

export function fetchTeammate(orgId: string): Promise<Teammate> {
  return request(`/api/teammate?org_id=${orgId}`);
}

export function chatWithTeammate(orgId: string, message: string): Promise<{ response: string }> {
  return request("/api/teammate/chat", {
    method: "POST",
    body: JSON.stringify({ org_id: orgId, message }),
  });
}

// --- Queue (Touch Queue) ---

export interface QueueItem {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_company: string;
  contact_metadata: string;
  sequence_name: string;
  touch_index: number;
  channel: string;
  angle: string;
  drafted_content: string;
  research_context: string;
  status: string;
  scheduled_for: string;
}

export function fetchQueue(orgId: string, status?: string): Promise<QueueItem[]> {
  const qs = status ? `&status=${status}` : "";
  return request(`/api/queue?org_id=${orgId}${qs}`);
}

export function approveTouch(id: string): Promise<{ status: string }> {
  return request(`/api/queue/${id}/approve`, { method: "POST" });
}

export function rejectTouch(id: string, reason?: string): Promise<{ status: string }> {
  return request(`/api/queue/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function editTouch(id: string, content: string): Promise<{ status: string }> {
  return request(`/api/queue/${id}/edit`, { method: "POST", body: JSON.stringify({ content }) });
}

// --- Contacts ---

export interface ApiContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  role: string | null;
  linkedin: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  tags: string;
  notes: string;
  lead_score: number;
  source: string;
  source_detail: string | null;
  status: string;
  touch_index: number;
  last_touch_at: string | null;
  next_touch_at: string | null;
  sequence_name: string;
  available_channels: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ContactDetail {
  contact: ApiContact;
  touchStats: { total_touches: number; sent: number; pending: number };
  replyStats: { total_replies: number; positive: number; questions: number; objections: number };
  activity: Array<{ id: string; action: string; detail: string; status: string; created_at: string }>;
}

export function fetchContacts(orgId: string, params?: { status?: string; source?: string; search?: string; sort?: string; tag?: string }): Promise<ApiContact[]> {
  const qs = new URLSearchParams({ org_id: orgId });
  if (params?.status) qs.set("status", params.status);
  if (params?.source) qs.set("source", params.source);
  if (params?.search) qs.set("search", params.search);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.tag) qs.set("tag", params.tag);
  return request(`/api/contacts?${qs.toString()}`);
}

export function fetchContactDetail(contactId: string): Promise<ContactDetail> {
  return request(`/api/contacts/${contactId}`);
}

export function importContacts(orgId: string, contacts: Record<string, unknown>[], opts?: { sequenceKey?: string; source?: string }): Promise<{ imported: number }> {
  return request("/api/contacts/import", {
    method: "POST",
    body: JSON.stringify({ org_id: orgId, contacts, sequence_key: opts?.sequenceKey, source: opts?.source }),
  });
}

export function updateContact(contactId: string, data: Partial<ApiContact>): Promise<ApiContact> {
  return request(`/api/contacts/${contactId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function addContactNote(contactId: string, note: string): Promise<{ status: string }> {
  return request(`/api/contacts/${contactId}/note`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function tagContact(contactId: string, add?: string, remove?: string): Promise<{ tags: string[] }> {
  return request(`/api/contacts/${contactId}/tag`, {
    method: "POST",
    body: JSON.stringify({ add, remove }),
  });
}

export function fetchContactThread(contactId: string): Promise<{ contact: ApiContact; timeline: Record<string, unknown>[] }> {
  return request(`/api/contacts/${contactId}/thread`);
}

export function fetchContactSources(orgId: string): Promise<Array<{ source: string; count: number }>> {
  return request(`/api/contacts/sources/summary?org_id=${orgId}`);
}

export function fetchContactTags(orgId: string): Promise<string[]> {
  return request(`/api/contacts/tags/all?org_id=${orgId}`);
}

// --- Activity ---

export interface ActivityEntry {
  id: string;
  action: string;
  detail: string;
  status: string;
  contact_name: string | null;
  created_at: string;
}

export function fetchActivity(orgId: string, limit = 30): Promise<ActivityEntry[]> {
  return request(`/api/activity?org_id=${orgId}&limit=${limit}`);
}

// --- Standup ---

export interface StandupData {
  date: string;
  touches_sent: number;
  replies_received: number;
  positive_replies: number;
  conversions: number;
  needs_you: number;
  planned_today: number;
  recent_activity: ActivityEntry[];
}

export function fetchStandup(orgId: string): Promise<StandupData> {
  return request(`/api/standup?org_id=${orgId}`);
}

// --- Trigger ---

export function triggerScan(orgId: string): Promise<{ status: string; touches_drafted: number }> {
  return request("/api/trigger/scan", { method: "POST", body: JSON.stringify({ org_id: orgId }) });
}

// --- Health ---

export function checkHealth(): Promise<{ status: string }> {
  return request("/api/health");
}
