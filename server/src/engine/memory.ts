import { queryAll, run } from "../db/database.js";
import { v4 as uuid } from "uuid";

// --- Customer Memory (long-term, per-customer facts) ---

export async function getCustomerMemory(orgId: string, customerId: string): Promise<string[]> {
  const rows = await queryAll(
    `SELECT fact FROM customer_memory WHERE org_id = ? AND customer_id = ? ORDER BY created_at DESC LIMIT 20`,
    [orgId, customerId]
  );
  return rows.map((r) => r.fact as string);
}

export async function saveCustomerMemory(
  orgId: string,
  customerId: string,
  fact: string,
  conversationId: string
): Promise<void> {
  await run(
    `INSERT INTO customer_memory (id, org_id, customer_id, fact, source_conversation_id) VALUES (?, ?, ?, ?, ?)`,
    [uuid(), orgId, customerId, fact, conversationId]
  );
}

// --- Conversation Memory (message history) ---

export async function getConversationHistory(conversationId: string) {
  return await queryAll(
    `SELECT role, content, tool_calls FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
    [conversationId]
  ) as { role: string; content: string; tool_calls: string | null }[];
}

// --- Knowledge Memory (keyword search, upgrade to vector later) ---

export async function searchKnowledge(orgId: string, query: string, limit = 5): Promise<string[]> {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return [];

  const whereClauses = terms.map(() => "LOWER(content) LIKE ?").join(" OR ");
  const params = [orgId, ...terms.map((t) => `%${t}%`), limit];

  const rows = await queryAll(
    `SELECT content, source FROM knowledge_chunks WHERE org_id = ? AND (${whereClauses}) LIMIT ?`,
    params
  );

  return rows.map((r) => `[${r.source}] ${r.content}`);
}

/**
 * Build context block with customer memory + relevant knowledge.
 */
export async function buildMemoryContext(
  orgId: string,
  customerId: string,
  userMessage: string
): Promise<string> {
  const customerFacts = await getCustomerMemory(orgId, customerId);
  const relevantKnowledge = await searchKnowledge(orgId, userMessage);

  const parts: string[] = [];

  if (customerFacts.length > 0) {
    parts.push(
      `## What you know about this customer\n${customerFacts.map((f) => `- ${f}`).join("\n")}`
    );
  }

  if (relevantKnowledge.length > 0) {
    parts.push(
      `## Relevant knowledge base articles\n${relevantKnowledge.map((k) => `- ${k}`).join("\n")}`
    );
  }

  return parts.join("\n\n");
}
