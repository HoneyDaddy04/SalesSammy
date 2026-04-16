const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AUTH_TOKEN_KEY = "sb-access-token";
const AUTH_REFRESH_KEY = "sb-refresh-token";
const DEMO_ORG_ID = "demo-org-00000000";

export function setAuthToken(token: string, refreshToken?: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_KEY);
}

function isDemoMode(): boolean {
  const orgId = localStorage.getItem("vaigence_org_id");
  return orgId === DEMO_ORG_ID || !getAuthToken();
}

// Demo-mode mock responses for write operations
function demoMock<T>(path: string, method?: string): T | null {
  if (!isDemoMode()) return null;
  if (!method || method === "GET") return null; // Let GETs go through (they have their own fallbacks)

  // Return mock success for all write operations in demo mode
  if (path.includes("/approve")) return { status: "approved" } as T;
  if (path.includes("/reject")) return { status: "rejected" } as T;
  if (path.includes("/edit")) return { status: "updated" } as T;
  if (path.includes("/scan")) return { status: "ok", touches_drafted: 2 } as T;
  if (path.includes("/pause")) return { status: "paused" } as T;
  if (path.includes("/resume")) return { status: "resumed" } as T;
  if (path.includes("/rollback")) return { status: "rolled_back" } as T;
  if (path.includes("/note")) return { status: "ok" } as T;
  if (path.includes("/tag")) return { tags: [] } as T;
  if (path.includes("/import")) return { imported: 1 } as T;
  if (path.includes("/connect")) return { status: "connected" } as T;
  if (path.includes("/disconnect")) return { status: "disconnected" } as T;
  if (path.includes("/resolve")) return { status: "resolved" } as T;
  if (path.includes("/upgrade") || path.includes("/billing")) return { status: "ok" } as T;
  if (path.includes("/fetch-url")) return { content: "Demo content from URL.", source: "url" } as T;
  if (path.includes("/teammate/chat")) return {
    response: "Got it! In demo mode, I can't make real changes, but in production I'd update your teammate's configuration based on your instructions. Try the live version to see this in action.",
    changes: [],
    flowPreview: null,
  } as T;
  if (path.includes("/teammate")) return { status: "ok" } as T;
  if (path.includes("/sequences")) return { id: "demo-seq", status: "ok" } as T;
  if (path.includes("/knowledge") && method === "DELETE") return { status: "deleted" } as T;
  if (path.includes("/knowledge")) return { id: "demo-kb", status: "ok" } as T;
  if (path.includes("/contacts") && method === "DELETE") return { status: "deleted" } as T;
  if (path.includes("/contacts") && method === "PUT") return { status: "updated" } as T;
  if (path.includes("/workflow-config")) return { status: "ok" } as T;

  // Fallback for any other write
  return { status: "ok" } as T;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase();

  // In demo mode, mock all write operations
  const mock = demoMock<T>(path, method);
  if (mock !== null) return mock;

  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
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

// --- Chat with Teammate (Conversational Config) ---

export interface TouchPreview {
  index: number;
  day_offset: number;
  angle: string;
  channel_tier: string;
  channel_resolved: string;
}

export interface SequencePreview {
  template_key: string;
  name: string;
  active: boolean;
  touches: TouchPreview[];
}

export interface OverridePreview {
  scope_type: string;
  scope_id: string;
  persona_additions: string;
  instruction_additions: string;
}

export interface FlowPreview {
  teammate: {
    goal: string;
    primary_channel: string;
    secondary_channel: string | null;
    tertiary_channel: string | null;
    status: string;
  };
  sequences: SequencePreview[];
  guardrails: string[];
  voice_examples: string[];
  overrides: OverridePreview[];
  escalation_contact: { name: string; email: string; phone?: string } | null;
}

export interface ConfigChange {
  type: string;
  label: string;
  detail: string;
  before?: string;
  after?: string;
  revision_id?: string;
}

export interface ChatResult {
  response: string;
  changes: ConfigChange[];
  flowPreview: FlowPreview | null;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export function chatWithTeammate(orgId: string, message: string, history?: ChatHistoryMessage[]): Promise<ChatResult> {
  return request("/api/teammate/chat", {
    method: "POST",
    body: JSON.stringify({ org_id: orgId, message, history: history || [] }),
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

// --- Auth ---

export interface AuthResponse {
  user: { id: string; email: string };
  org_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  org_id: string;
  role: string;
  created_at: string;
}

export function authSignup(email: string, password: string, name: string): Promise<AuthResponse> {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export function authLogin(email: string, password: string): Promise<AuthResponse> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function authLogout(): Promise<{ status: string }> {
  return request("/api/auth/logout", { method: "POST" });
}

export function authMe(): Promise<UserProfile> {
  return request("/api/auth/me");
}
