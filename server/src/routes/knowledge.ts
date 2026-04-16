import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryAll, run, isLocalMode } from "../db/database.js";
import { chunkText } from "../services/chunking.js";
import { generateEmbeddings } from "../services/embeddings.js";

const router = Router();

/**
 * POST /api/knowledge — create knowledge entry.
 * On Postgres: chunks the content, generates embeddings, stores each chunk.
 * On SQLite: stores as-is (no embeddings).
 */
router.post("/", async (req, res) => {
  const { org_id, content, source, metadata } = req.body;
  if (!org_id || !content || !source) {
    res.status(400).json({ error: "Missing: org_id, content, source" });
    return;
  }

  const parentId = uuid();
  const metaStr = JSON.stringify(metadata || {});

  if (isLocalMode()) {
    // SQLite: store as single chunk, no embedding
    await run(
      `INSERT INTO knowledge_chunks (id, org_id, content, source, metadata, parent_id, chunk_index) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [parentId, org_id, content, source, metaStr, null, 0]
    );
    res.json({ id: parentId, chunks: 1, status: "created" });
    return;
  }

  // Postgres: chunk + embed
  const chunks = chunkText(content);
  const embeddings = await generateEmbeddings(chunks.map(c => c.content));

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = i === 0 ? parentId : uuid();
    const vectorStr = `[${embeddings[i].join(",")}]`;
    await run(
      `INSERT INTO knowledge_chunks (id, org_id, content, source, metadata, embedding, parent_id, chunk_index) VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8)`,
      [chunkId, org_id, chunks[i].content, source, metaStr, vectorStr, i === 0 ? null : parentId, i]
    );
  }

  res.json({ id: parentId, chunks: chunks.length, status: "created" });
});

router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  // Return parent chunks only (chunk_index = 0) for the list view
  const rows = await queryAll(
    `SELECT id, org_id, content, source, metadata, chunk_index, parent_id, created_at FROM knowledge_chunks WHERE org_id = ? AND chunk_index = 0 ORDER BY created_at DESC`,
    [orgId]
  );
  res.json(rows);
});

/** PUT /api/knowledge/:id — update a knowledge entry. Re-chunks + re-embeds on Postgres. */
router.put("/:id", async (req, res) => {
  const { content, source } = req.body;
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const parentId = req.params.id;

  if (isLocalMode()) {
    await run(`UPDATE knowledge_chunks SET content = ?, source = ? WHERE id = ?`, [content, source || "manual", parentId]);
    res.json({ status: "updated", chunks: 1 });
    return;
  }

  // Postgres: delete old chunks, re-chunk + re-embed
  // Get org_id and metadata from the existing entry
  const existing = await queryAll(`SELECT org_id, metadata FROM knowledge_chunks WHERE id = $1`, [parentId]);
  if (existing.length === 0) { res.status(404).json({ error: "not found" }); return; }
  const { org_id, metadata } = existing[0] as { org_id: string; metadata: string };

  // Delete old child chunks
  await run(`DELETE FROM knowledge_chunks WHERE parent_id = $1`, [parentId]);
  // Delete the parent itself
  await run(`DELETE FROM knowledge_chunks WHERE id = $1`, [parentId]);

  // Re-create with new content
  const chunks = chunkText(content);
  const embeddings = await generateEmbeddings(chunks.map(c => c.content));
  const srcVal = source || "manual";

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = i === 0 ? parentId : uuid();
    const vectorStr = `[${embeddings[i].join(",")}]`;
    await run(
      `INSERT INTO knowledge_chunks (id, org_id, content, source, metadata, embedding, parent_id, chunk_index) VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8)`,
      [chunkId, org_id, chunks[i].content, srcVal, metadata as string, vectorStr, i === 0 ? null : parentId, i]
    );
  }

  res.json({ status: "updated", chunks: chunks.length });
});

/** DELETE /api/knowledge/:id — delete entry and all its chunks */
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  // Delete child chunks first, then parent
  await run(`DELETE FROM knowledge_chunks WHERE parent_id = ?`, [id]);
  await run(`DELETE FROM knowledge_chunks WHERE id = ?`, [id]);
  res.json({ status: "deleted" });
});

/** POST /api/knowledge/fetch-url — fetch a page and extract text */
router.post("/fetch-url", async (req, res) => {
  const { url } = req.body;
  if (!url) { res.status(400).json({ error: "url required" }); return; }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VaigenceBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      res.status(502).json({ error: `Failed to fetch URL: HTTP ${response.status}` });
      return;
    }
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : new URL(url).hostname;

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);

    res.json({ content: text, title });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Failed to fetch URL" });
  }
});

export default router;
