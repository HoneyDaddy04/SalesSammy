import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryAll, queryOne, run } from "../db/database.js";

const router = Router();

/** GET /api/contacts?org_id=xxx */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  const status = req.query.status as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT c.*, s.name as sequence_name FROM contacts c LEFT JOIN sequences s ON s.id = c.sequence_id WHERE c.org_id = ?`;
  const params: unknown[] = [orgId];
  if (status) { sql += ` AND c.status = ?`; params.push(status); }
  sql += ` ORDER BY c.next_touch_at ASC NULLS LAST LIMIT 100`;

  res.json(queryAll(sql, params));
});

/** POST /api/contacts/import — import from CSV/JSON */
router.post("/import", (req, res) => {
  const { org_id, contacts, sequence_key } = req.body;
  if (!org_id || !contacts || !Array.isArray(contacts)) {
    res.status(400).json({ error: "org_id and contacts[] required" });
    return;
  }

  // Find sequence
  const seq = sequence_key
    ? queryOne(`SELECT id FROM sequences WHERE template_key = ?`, [sequence_key])
    : queryOne(`SELECT id FROM sequences WHERE template_key = 'cold_outbound'`);
  const sequenceId = seq?.id as string || null;

  let imported = 0;
  const now = new Date().toISOString();

  for (const c of contacts) {
    if (!c.name && !c.email) continue;
    run(
      `INSERT INTO contacts (id, org_id, name, email, phone, company, source, metadata, sequence_id, next_touch_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
      [uuid(), org_id, c.name || "", c.email || null, c.phone || null, c.company || null, "import", JSON.stringify(c.metadata || {}), sequenceId, now]
    );
    imported++;
  }

  res.json({ imported, sequence_id: sequenceId });
});

/** GET /api/contacts/:id/thread — unified thread for a contact */
router.get("/:id/thread", (req, res) => {
  const contact = queryOne(`SELECT * FROM contacts WHERE id = ?`, [req.params.id]);
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  // Get all sent touches
  const touches = queryAll(
    `SELECT id, touch_index, channel, angle, drafted_content, status, scheduled_for, sent_at, created_at FROM touch_queue WHERE contact_id = ? ORDER BY created_at ASC`,
    [req.params.id]
  );

  // Get all replies
  const replies = queryAll(
    `SELECT id, channel, content, classification, status, created_at FROM reply_events WHERE contact_id = ? ORDER BY created_at ASC`,
    [req.params.id]
  );

  // Merge into timeline
  const timeline = [
    ...touches.map((t) => ({ type: "touch", ...t })),
    ...replies.map((r) => ({ type: "reply", ...r })),
  ].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  res.json({ contact, timeline });
});

export default router;
