import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryAll, queryOne, run } from "../db/database.js";
import { enqueue } from "../services/job-queue.js";

const router = Router();

/** POST /api/replies/inbound - Receive an inbound reply (webhook or manual simulation) */
router.post("/inbound", async (req, res) => {
  const { org_id, channel, sender_email_or_phone, content } = req.body;
  if (!org_id || !channel || !sender_email_or_phone || !content) {
    res.status(400).json({ error: "org_id, channel, sender_email_or_phone, and content are required" });
    return;
  }

  const now = new Date().toISOString();

  // Match sender to a contact by email or phone
  const contact = await queryOne(
    `SELECT * FROM contacts WHERE org_id = ? AND (email = ? OR phone = ?)`,
    [org_id, sender_email_or_phone, sender_email_or_phone]
  );

  if (!contact) {
    // Unknown sender - log to inbound_messages and enqueue classification
    const msgId = uuid();
    await run(
      `INSERT INTO inbound_messages (id, org_id, channel, sender_identifier, content, classification, created_at) VALUES (?, ?, ?, ?, ?, 'unknown', ?)`,
      [msgId, org_id, channel, sender_email_or_phone, content, now]
    );

    // Enqueue classification job for lead capture / spam filtering
    await enqueue(org_id, "classify_inbound", {
      messageId: msgId,
      orgId: org_id,
      channel,
      sender: sender_email_or_phone,
      content,
    });

    res.json({ status: "new_inbound", message_id: msgId, contact_id: null });
    return;
  }

  const contactId = contact.id as string;
  const contactName = contact.name as string;

  // Insert reply event
  const replyId = uuid();
  await run(
    `INSERT INTO reply_events (id, org_id, contact_id, channel, content, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [replyId, org_id, contactId, channel, content, now]
  );

  // Update contact status to replied
  try { await run(`UPDATE contacts SET status = 'replied', updated_at = ? WHERE id = ?`, [now, contactId]); }
  catch { await run(`UPDATE contacts SET status = 'replied' WHERE id = ?`, [contactId]); }

  // Enqueue classification job
  await enqueue(org_id, "classify_reply", { replyId, contactId, orgId: org_id });

  // Log activity
  await run(
    `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, created_at) VALUES (?, ?, ?, ?, 'info', ?, ?)`,
    [uuid(), org_id, `Reply received from ${contactName} via ${channel}`, content.substring(0, 100), contactName, now]
  );

  res.json({ status: "received", reply_id: replyId, contact_id: contactId });
});

/** POST /api/replies/simulate - Simulate an inbound message for demo/testing */
router.post("/simulate", async (req, res) => {
  const { org_id, channel, sender_name, sender_contact, message } = req.body;
  if (!org_id || !channel || !sender_contact || !message) {
    res.status(400).json({ error: "org_id, channel, sender_contact, and message are required" });
    return;
  }

  const now = new Date().toISOString();
  const msgId = uuid();

  // Log to inbound_messages
  await run(
    `INSERT INTO inbound_messages (id, org_id, channel, sender_identifier, content, classification, created_at) VALUES (?, ?, ?, ?, ?, 'unknown', ?)`,
    [msgId, org_id, channel, sender_contact, message, now]
  );

  // Enqueue classification job
  await enqueue(org_id, "classify_inbound", {
    messageId: msgId,
    orgId: org_id,
    channel,
    sender: sender_contact,
    senderName: sender_name || null,
    content: message,
  });

  res.json({ status: "new_inbound", message_id: msgId, simulated: true });
});

/** GET /api/replies?org_id=xxx&status=pending - List replies */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  const status = req.query.status as string;

  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT r.*, c.name as contact_name, c.email as contact_email, c.company as contact_company
             FROM reply_events r
             LEFT JOIN contacts c ON c.id = r.contact_id
             WHERE r.org_id = ?`;
  const params: unknown[] = [orgId];

  if (status) { sql += ` AND r.status = ?`; params.push(status); }

  sql += ` ORDER BY r.created_at DESC LIMIT 100`;

  res.json(await queryAll(sql, params));
});

/** GET /api/replies/:id - Single reply detail */
router.get("/:id", async (req, res) => {
  const reply = await queryOne(
    `SELECT r.*, c.name as contact_name, c.email as contact_email, c.company as contact_company
     FROM reply_events r
     LEFT JOIN contacts c ON c.id = r.contact_id
     WHERE r.id = ?`,
    [req.params.id]
  );
  if (!reply) { res.status(404).json({ error: "Reply not found" }); return; }
  res.json(reply);
});

/** POST /api/replies/:id/handle - Mark a reply as handled */
router.post("/:id/handle", async (req, res) => {
  const { action, response_content } = req.body;
  if (!action) { res.status(400).json({ error: "action required" }); return; }

  const reply = await queryOne(`SELECT * FROM reply_events WHERE id = ?`, [req.params.id]);
  if (!reply) { res.status(404).json({ error: "Reply not found" }); return; }

  const now = new Date().toISOString();
  const orgId = reply.org_id as string;
  const contactId = reply.contact_id as string;
  const contact = await queryOne(`SELECT name FROM contacts WHERE id = ?`, [contactId]);
  const contactName = (contact?.name as string) || "Unknown";

  switch (action) {
    case "respond":
      // Create a touch_queue entry with the response
      if (response_content) {
        const touchId = uuid();
        await run(
          `INSERT INTO touch_queue (id, org_id, contact_id, channel, angle, drafted_content, status, scheduled_for) VALUES (?, ?, ?, ?, 'reply_response', ?, 'pending_approval', ?)`,
          [touchId, orgId, contactId, reply.channel as string, response_content, now]
        );
      }
      await run(`UPDATE reply_events SET status = 'handled', routed_action = 'respond' WHERE id = ?`, [req.params.id]);
      break;

    case "escalate":
      await run(`UPDATE reply_events SET status = 'escalated', routed_action = 'escalate' WHERE id = ?`, [req.params.id]);
      await run(`UPDATE contacts SET status = 'escalated', updated_at = ? WHERE id = ?`, [now, contactId]);
      await run(
        `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, created_at) VALUES (?, ?, ?, ?, 'warning', ?, ?)`,
        [uuid(), orgId, `Reply from ${contactName} escalated`, "Manual escalation", contactName, now]
      );
      break;

    case "pause_sequence":
      await run(`UPDATE reply_events SET status = 'handled', routed_action = 'pause_sequence' WHERE id = ?`, [req.params.id]);
      await run(`UPDATE contacts SET status = 'paused', updated_at = ? WHERE id = ?`, [now, contactId]);
      break;

    case "mark_handled":
      await run(`UPDATE reply_events SET status = 'handled', routed_action = 'mark_handled' WHERE id = ?`, [req.params.id]);
      break;

    default:
      res.status(400).json({ error: `Unknown action: ${action}` });
      return;
  }

  res.json({ status: "ok", action });
});

export default router;
