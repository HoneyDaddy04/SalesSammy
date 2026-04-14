import { queryAll, queryOne } from "../db/database.js";

// Tool: Get all previous messages sent to and received from this contact
export function getContactHistory(contactId: string): { role: string; content: string; channel: string; date: string }[] {
  const touches = queryAll(
    `SELECT drafted_content as content, channel, 'sent' as role, sent_at as date FROM touch_queue WHERE contact_id = ? AND status = 'sent' ORDER BY sent_at ASC`,
    [contactId]
  );
  const replies = queryAll(
    `SELECT content, channel, 'received' as role, created_at as date FROM reply_events WHERE contact_id = ? ORDER BY created_at ASC`,
    [contactId]
  );
  return [...touches, ...replies]
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    .map(m => ({ role: m.role as string, content: m.content as string, channel: m.channel as string, date: (m.date || "") as string }));
}

// Tool: Search knowledge base for relevant info
export function searchKnowledgeBase(orgId: string, query: string): string[] {
  // Simple keyword search (would be vector search in production)
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const all = queryAll(`SELECT content, source FROM knowledge_chunks WHERE org_id = ?`, [orgId]);
  return (all as any[])
    .filter(k => keywords.some(kw => (k.content as string).toLowerCase().includes(kw)))
    .map(k => `[${k.source}] ${k.content}`)
    .slice(0, 5);
}

// Tool: Search web for recent news (stub - returns empty, replace with real API later)
export async function searchWeb(companyName: string): Promise<string[]> {
  // TODO: Integrate with a search API (SerpAPI, Brave Search, etc.)
  // For now, return empty. The architecture is ready for real search.
  console.log(`[WEB SEARCH STUB] Would search for: ${companyName} recent news`);
  return [];
}

// Tool: Check LinkedIn for recent activity (stub)
export async function checkLinkedIn(linkedinUrl: string | null): Promise<string[]> {
  if (!linkedinUrl) return [];
  // TODO: Integrate with LinkedIn API or scraping service
  console.log(`[LINKEDIN STUB] Would check: ${linkedinUrl}`);
  return [];
}

// Tool: Pull email history from Gmail (stub - uses connected integration)
export async function pullEmailHistory(orgId: string, contactEmail: string | null): Promise<string[]> {
  if (!contactEmail) return [];
  // TODO: Use Gmail API with connected credentials
  // For now check if there are any context overrides or notes
  console.log(`[EMAIL HISTORY STUB] Would pull threads with: ${contactEmail}`);
  return [];
}
