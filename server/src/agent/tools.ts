import { queryAll, queryOne, isLocalMode } from "../db/database.js";
import { generateEmbedding } from "../services/embeddings.js";

// Tool: Get all previous messages sent to and received from this contact
export async function getContactHistory(contactId: string): Promise<{ role: string; content: string; channel: string; date: string }[]> {
  const touches = await queryAll(
    `SELECT drafted_content as content, channel, 'sent' as role, sent_at as date FROM touch_queue WHERE contact_id = ? AND status = 'sent' ORDER BY sent_at ASC`,
    [contactId]
  );
  const replies = await queryAll(
    `SELECT content, channel, 'received' as role, created_at as date FROM reply_events WHERE contact_id = ? ORDER BY created_at ASC`,
    [contactId]
  );
  return [...touches, ...replies]
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    .map(m => ({ role: m.role as string, content: m.content as string, channel: m.channel as string, date: (m.date || "") as string }));
}

// Tool: Search knowledge base using vector similarity (Postgres) or keyword fallback (SQLite)
export async function searchKnowledgeBase(orgId: string, query: string): Promise<string[]> {
  if (isLocalMode()) {
    // SQLite fallback: keyword search
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const all = await queryAll(`SELECT content, source FROM knowledge_chunks WHERE org_id = ?`, [orgId]);
    return (all as any[])
      .filter(k => keywords.some(kw => (k.content as string).toLowerCase().includes(kw)))
      .map(k => `[${k.source}] ${k.content}`)
      .slice(0, 5);
  }

  // Postgres: vector similarity search via pgvector
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const results = await queryAll(
    `SELECT content, source, 1 - (embedding <=> $1::vector) as similarity
     FROM knowledge_chunks
     WHERE org_id = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT 5`,
    [vectorStr, orgId]
  );

  return results
    .filter(r => (r.similarity as number) > 0.3) // Minimum relevance threshold
    .map(r => `[${r.source}] (${((r.similarity as number) * 100).toFixed(0)}% match) ${r.content}`);
}

// Tool: Search web for recent news (stub - returns empty, replace with real API later)
export async function searchWeb(companyName: string): Promise<string[]> {
  // TODO: Integrate with a search API (SerpAPI, Brave Search, etc.)
  console.log(`[WEB SEARCH STUB] Would search for: ${companyName} recent news`);
  return [];
}

// Tool: Check LinkedIn for recent activity (stub)
export async function checkLinkedIn(linkedinUrl: string | null): Promise<string[]> {
  if (!linkedinUrl) return [];
  console.log(`[LINKEDIN STUB] Would check: ${linkedinUrl}`);
  return [];
}

// Tool: Pull email history from Gmail (stub - uses connected integration)
export async function pullEmailHistory(orgId: string, contactEmail: string | null): Promise<string[]> {
  if (!contactEmail) return [];
  console.log(`[EMAIL HISTORY STUB] Would pull threads with: ${contactEmail}`);
  return [];
}
