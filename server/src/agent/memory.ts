import { queryAll, queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";

// Save a memory about a specific contact
export function saveContactMemory(orgId: string, contactId: string, memoryType: string, content: string): void {
  run(
    `INSERT INTO contact_memory (id, org_id, contact_id, memory_type, content, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [uuid(), orgId, contactId, memoryType, content]
  );
}

// Get all memories for a contact
export function getContactMemories(orgId: string, contactId: string): string[] {
  const rows = queryAll(
    `SELECT memory_type, content FROM contact_memory WHERE org_id = ? AND contact_id = ? ORDER BY created_at DESC LIMIT 20`,
    [orgId, contactId]
  );
  return (rows as any[]).map(r => `[${r.memory_type}] ${r.content}`);
}

// Save a pattern insight (learned across all contacts)
export function savePatternInsight(orgId: string, insightType: string, content: string): void {
  // Upsert - update if same type exists, otherwise insert
  const existing = queryOne(
    `SELECT id FROM pattern_insights WHERE org_id = ? AND insight_type = ?`,
    [orgId, insightType]
  );
  if (existing) {
    run(`UPDATE pattern_insights SET content = ?, updated_at = datetime('now') WHERE id = ?`, [content, existing.id]);
  } else {
    run(
      `INSERT INTO pattern_insights (id, org_id, insight_type, content, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [uuid(), orgId, insightType, content]
    );
  }
}

// Get pattern insights for this org
export function getPatternInsights(orgId: string): string[] {
  const rows = queryAll(
    `SELECT insight_type, content FROM pattern_insights WHERE org_id = ? ORDER BY updated_at DESC LIMIT 10`,
    [orgId]
  );
  return (rows as any[]).map(r => `[${r.insight_type}] ${r.content}`);
}

// After each interaction, extract and store key facts about the contact
export function extractAndStoreMemories(orgId: string, contactId: string, messageContent: string, messageType: "sent" | "received"): void {
  // Store the interaction itself as a memory
  if (messageType === "received") {
    // Extract key facts from what they said
    const lower = messageContent.toLowerCase();
    if (lower.includes("pricing") || lower.includes("cost") || lower.includes("price")) {
      saveContactMemory(orgId, contactId, "interest", "Asked about pricing");
    }
    if (lower.includes("demo") || lower.includes("call") || lower.includes("meeting")) {
      saveContactMemory(orgId, contactId, "interest", "Interested in a demo/call");
    }
    if (lower.includes("team") || lower.match(/\d+\s*(people|employees|users)/)) {
      const match = messageContent.match(/(\d+)\s*(people|employees|users)/i);
      if (match) saveContactMemory(orgId, contactId, "fact", `Team size: ${match[1]} ${match[2]}`);
    }
    if (lower.includes("budget") || lower.includes("spend")) {
      saveContactMemory(orgId, contactId, "objection", "Budget sensitivity mentioned");
    }
    if (lower.includes("competitor") || lower.includes("already using") || lower.includes("currently use")) {
      saveContactMemory(orgId, contactId, "fact", "Using a competitor product");
    }
  }
}
