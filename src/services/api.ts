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
  company: string;
  status: string;
  touch_index: number;
  next_touch_at: string | null;
  sequence_name: string;
  metadata: string;
}

export function fetchContacts(orgId: string, status?: string): Promise<ApiContact[]> {
  const qs = status ? `&status=${status}` : "";
  return request(`/api/contacts?org_id=${orgId}${qs}`);
}

export function importContacts(orgId: string, contacts: Record<string, unknown>[], sequenceKey?: string): Promise<{ imported: number }> {
  return request("/api/contacts/import", {
    method: "POST",
    body: JSON.stringify({ org_id: orgId, contacts, sequence_key: sequenceKey }),
  });
}

export function fetchContactThread(contactId: string): Promise<{ contact: ApiContact; timeline: Record<string, unknown>[] }> {
  return request(`/api/contacts/${contactId}/thread`);
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
  meetings_booked: number;
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
