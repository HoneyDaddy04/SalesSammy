import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryAll, run } from "../db/database.js";

const router = Router();

router.post("/", (req, res) => {
  const { org_id, content, source, metadata } = req.body;
  if (!org_id || !content || !source) {
    res.status(400).json({ error: "Missing: org_id, content, source" });
    return;
  }
  const id = uuid();
  run(
    `INSERT INTO knowledge_chunks (id, org_id, content, source, metadata) VALUES (?, ?, ?, ?, ?)`,
    [id, org_id, content, source, JSON.stringify(metadata || {})]
  );
  res.json({ id, status: "created" });
});

router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }
  res.json(queryAll(`SELECT * FROM knowledge_chunks WHERE org_id = ? ORDER BY created_at DESC`, [orgId]));
});

/** PUT /api/knowledge/:id */
router.put("/:id", (req, res) => {
  const { content, source } = req.body;
  if (!content) { res.status(400).json({ error: "content required" }); return; }
  run(`UPDATE knowledge_chunks SET content = ?, source = ? WHERE id = ?`, [content, source || "manual", req.params.id]);
  res.json({ status: "updated" });
});

/** DELETE /api/knowledge/:id */
router.delete("/:id", (req, res) => {
  run(`DELETE FROM knowledge_chunks WHERE id = ?`, [req.params.id]);
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

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : new URL(url).hostname;

    // Strip HTML tags and decode basic entities
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
