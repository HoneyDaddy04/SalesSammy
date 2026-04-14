import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryAll, queryOne, run } from "../db/database.js";

const router = Router();

/** GET /api/contacts?org_id=xxx&status=xxx&source=xxx&sort=xxx&search=xxx */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  const status = req.query.status as string;
  const source = req.query.source as string;
  const search = req.query.search as string;
  const sort = req.query.sort as string || "next_touch";
  const tag = req.query.tag as string;

  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT c.*, s.name as sequence_name FROM contacts c LEFT JOIN sequences s ON s.id = c.sequence_id WHERE c.org_id = ?`;
  const params: unknown[] = [orgId];

  if (status) { sql += ` AND c.status = ?`; params.push(status); }
  if (source) { sql += ` AND c.source = ?`; params.push(source); }
  if (search) {
    sql += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ? OR c.role LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (tag) { sql += ` AND c.tags LIKE ?`; params.push(`%"${tag}"%`); }

  const sortMap: Record<string, string> = {
    next_touch: "c.next_touch_at ASC NULLS LAST",
    newest: "c.created_at DESC",
    oldest: "c.created_at ASC",
    name: "c.name ASC",
    company: "c.company ASC",
    score: "c.lead_score DESC",
    last_activity: "c.last_touch_at DESC NULLS LAST",
  };
  sql += ` ORDER BY ${sortMap[sort] || sortMap.next_touch} LIMIT 200`;

  res.json(await queryAll(sql, params));
});

/** GET /api/contacts/sources/summary - get unique sources with counts */
router.get("/sources/summary", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const sources = await queryAll(
    `SELECT source, COUNT(*) as count FROM contacts WHERE org_id = ? GROUP BY source ORDER BY count DESC`,
    [orgId]
  );
  res.json(sources);
});

/** GET /api/contacts/tags/all - get all unique tags */
router.get("/tags/all", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const rows = await queryAll(`SELECT tags FROM contacts WHERE org_id = ?`, [orgId]);
  const tagSet = new Set<string>();
  for (const row of rows) {
    try {
      const tags = JSON.parse((row as any).tags || "[]");
      for (const t of tags) tagSet.add(t);
    } catch {}
  }
  res.json([...tagSet].sort());
});

/** POST /api/contacts/import - import from CSV/JSON */
router.post("/import", async (req, res) => {
  const { org_id, contacts, sequence_key, source } = req.body;
  if (!org_id || !contacts || !Array.isArray(contacts)) {
    res.status(400).json({ error: "org_id and contacts[] required" });
    return;
  }

  const seq = sequence_key
    ? await queryOne(`SELECT id FROM sequences WHERE template_key = ?`, [sequence_key])
    : await queryOne(`SELECT id FROM sequences WHERE template_key = 'cold_outbound'`);
  const sequenceId = seq?.id as string || null;
  const importSource = source || "import";

  let imported = 0;
  const now = new Date().toISOString();

  for (const c of contacts) {
    if (!c.name && !c.email) continue;

    // Build available channels from provided data
    const channels: string[] = [];
    if (c.email) channels.push("email");
    if (c.phone) channels.push("sms", "whatsapp");
    if (c.linkedin) channels.push("linkedin");

    // Compute initial lead score
    let score = 10; // base
    if (c.email) score += 15;
    if (c.phone) score += 10;
    if (c.company) score += 10;
    if (c.linkedin) score += 5;
    if (c.role) score += 5;

    await run(
      `INSERT INTO contacts (id, org_id, name, email, phone, company, role, linkedin, website, industry, company_size, tags, notes, lead_score, source, source_detail, metadata, sequence_id, next_touch_at, status, available_channels, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?)`,
      [
        uuid(), org_id,
        c.name || "", c.email || null, c.phone || null, c.company || null,
        c.role || null, c.linkedin || null, c.website || null,
        c.industry || null, c.company_size || null,
        JSON.stringify(c.tags || []), c.notes || "",
        score, importSource, c.source_detail || null,
        JSON.stringify(c.metadata || {}), sequenceId, now,
        JSON.stringify(channels), now,
      ]
    );
    imported++;
  }

  res.json({ imported, sequence_id: sequenceId });
});

/** POST /api/contacts/webhook - webhook endpoint for form submissions */
router.post("/webhook", async (req, res) => {
  const { org_id, source_name, contacts: contactList, ...singleContact } = req.body;

  // Support both single contact and array
  const contacts = contactList || [singleContact];
  const resolvedOrgId = org_id || (await queryOne(`SELECT id FROM organizations LIMIT 1`))?.id as string;

  if (!resolvedOrgId) { res.status(400).json({ error: "No organization found" }); return; }

  const seq = await queryOne(`SELECT id FROM sequences WHERE template_key = 'inbound_lead'`);
  const sequenceId = seq?.id as string || null;
  const now = new Date().toISOString();
  let imported = 0;

  for (const c of contacts) {
    if (!c.name && !c.email) continue;

    const channels: string[] = [];
    if (c.email) channels.push("email");
    if (c.phone) channels.push("sms", "whatsapp");
    if (c.linkedin) channels.push("linkedin");

    let score = 20; // webhook leads are warmer (inbound)
    if (c.email) score += 15;
    if (c.phone) score += 10;
    if (c.company) score += 10;

    await run(
      `INSERT INTO contacts (id, org_id, name, email, phone, company, role, linkedin, website, industry, company_size, tags, notes, lead_score, source, source_detail, metadata, sequence_id, next_touch_at, status, available_channels, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'webhook', ?, ?, ?, ?, 'queued', ?, ?)`,
      [
        uuid(), resolvedOrgId,
        c.name || "", c.email || null, c.phone || null, c.company || null,
        c.role || null, c.linkedin || null, c.website || null,
        c.industry || null, c.company_size || null,
        JSON.stringify(c.tags || []), c.notes || "",
        score, source_name || "form",
        JSON.stringify(c.metadata || c.extra_fields || {}),
        sequenceId, now, JSON.stringify(channels), now,
      ]
    );
    imported++;
  }

  // Log activity
  if (imported > 0) {
    await run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, created_at) VALUES (?, ?, ?, ?, 'info', ?)`,
      [uuid(), resolvedOrgId, `${imported} lead${imported > 1 ? "s" : ""} received via webhook`, source_name || "form submission", now]
    );
  }

  res.json({ imported, sequence_id: sequenceId });
});

/** GET /api/contacts/:id - full contact detail with stats */
router.get("/:id", async (req, res) => {
  const contact = await queryOne(
    `SELECT c.*, s.name as sequence_name, s.touches as sequence_touches
     FROM contacts c LEFT JOIN sequences s ON s.id = c.sequence_id
     WHERE c.id = ?`,
    [req.params.id]
  );
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  // Get touch stats
  const touchStats = await queryOne(
    `SELECT COUNT(*) as total_touches, SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending
     FROM touch_queue WHERE contact_id = ?`,
    [req.params.id]
  );

  // Get reply stats
  const replyStats = await queryOne(
    `SELECT COUNT(*) as total_replies,
            SUM(CASE WHEN classification = 'positive' THEN 1 ELSE 0 END) as positive,
            SUM(CASE WHEN classification = 'question' THEN 1 ELSE 0 END) as questions,
            SUM(CASE WHEN classification = 'objection' THEN 1 ELSE 0 END) as objections
     FROM reply_events WHERE contact_id = ?`,
    [req.params.id]
  );

  // Get recent activity
  const activity = await queryAll(
    `SELECT * FROM activity_log WHERE contact_name = ? ORDER BY created_at DESC LIMIT 20`,
    [(contact as any).name]
  );

  res.json({ contact, touchStats, replyStats, activity });
});

/** GET /api/contacts/:id/thread - unified thread for a contact */
router.get("/:id/thread", async (req, res) => {
  const contact = await queryOne(`SELECT * FROM contacts WHERE id = ?`, [req.params.id]);
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  const touches = await queryAll(
    `SELECT id, touch_index, channel, angle, drafted_content, status, scheduled_for, sent_at, created_at FROM touch_queue WHERE contact_id = ? ORDER BY created_at ASC`,
    [req.params.id]
  );

  const replies = await queryAll(
    `SELECT id, channel, content, classification, status, created_at FROM reply_events WHERE contact_id = ? ORDER BY created_at ASC`,
    [req.params.id]
  );

  const timeline = [
    ...touches.map((t) => ({ type: "touch", ...t })),
    ...replies.map((r) => ({ type: "reply", ...r })),
  ].sort((a, b) => String((a as any).created_at).localeCompare(String((b as any).created_at)));

  res.json({ contact, timeline });
});

/** PUT /api/contacts/:id - update contact details */
router.put("/:id", async (req, res) => {
  const contact = await queryOne(`SELECT * FROM contacts WHERE id = ?`, [req.params.id]);
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  const allowedFields = [
    "name", "email", "phone", "company", "role", "linkedin", "website",
    "industry", "company_size", "tags", "notes", "lead_score", "source",
    "source_detail", "metadata", "status", "available_channels",
  ];

  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      const val = ["metadata", "tags", "available_channels"].includes(field)
        ? JSON.stringify(req.body[field])
        : req.body[field];
      updates.push(`${field} = ?`);
      values.push(val);
    }
  }

  if (updates.length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(req.params.id);

  await run(`UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`, values);
  res.json(await queryOne(`SELECT c.*, s.name as sequence_name FROM contacts c LEFT JOIN sequences s ON s.id = c.sequence_id WHERE c.id = ?`, [req.params.id]));
});

/** POST /api/contacts/:id/pause */
router.post("/:id/pause", async (req, res) => {
  await run(`UPDATE contacts SET status = 'paused', updated_at = NOW() WHERE id = ?`, [req.params.id]);
  res.json({ status: "paused" });
});

/** POST /api/contacts/:id/resume */
router.post("/:id/resume", async (req, res) => {
  await run(`UPDATE contacts SET status = 'active', next_touch_at = NOW(), updated_at = NOW() WHERE id = ?`, [req.params.id]);
  res.json({ status: "active" });
});

/** POST /api/contacts/:id/note - add a note */
router.post("/:id/note", async (req, res) => {
  const contact = await queryOne(`SELECT notes FROM contacts WHERE id = ?`, [req.params.id]) as any;
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  const existing = contact.notes || "";
  const timestamp = new Date().toISOString().split("T")[0];
  const newNote = `[${timestamp}] ${req.body.note}\n${existing}`;

  await run(`UPDATE contacts SET notes = ?, updated_at = NOW() WHERE id = ?`, [newNote, req.params.id]);
  res.json({ status: "ok" });
});

/** POST /api/contacts/:id/tag - add/remove tags */
router.post("/:id/tag", async (req, res) => {
  const contact = await queryOne(`SELECT tags FROM contacts WHERE id = ?`, [req.params.id]) as any;
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  let tags: string[] = [];
  try { tags = JSON.parse(contact.tags || "[]"); } catch {}

  const { add, remove } = req.body;
  if (add && !tags.includes(add)) tags.push(add);
  if (remove) tags = tags.filter(t => t !== remove);

  await run(`UPDATE contacts SET tags = ?, updated_at = NOW() WHERE id = ?`, [JSON.stringify(tags), req.params.id]);
  res.json({ tags });
});

/** DELETE /api/contacts/:id */
router.delete("/:id", async (req, res) => {
  await run(`DELETE FROM touch_queue WHERE contact_id = ?`, [req.params.id]);
  await run(`DELETE FROM reply_events WHERE contact_id = ?`, [req.params.id]);
  await run(`DELETE FROM contacts WHERE id = ?`, [req.params.id]);
  res.json({ status: "deleted" });
});

export default router;
