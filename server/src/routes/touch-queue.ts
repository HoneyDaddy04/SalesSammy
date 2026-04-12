import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";

const router = Router();

/** GET /api/queue?org_id=xxx&status=pending_approval */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  const status = req.query.status as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT t.*, c.name as contact_name, c.email as contact_email, c.company as contact_company, c.metadata as contact_metadata, s.name as sequence_name
    FROM touch_queue t
    JOIN contacts c ON c.id = t.contact_id
    JOIN sequences s ON s.id = t.sequence_id
    WHERE t.org_id = ?`;
  const params: unknown[] = [orgId];

  if (status) { sql += ` AND t.status = ?`; params.push(status); }
  sql += ` ORDER BY t.scheduled_for ASC LIMIT 50`;

  res.json(queryAll(sql, params));
});

/** POST /api/queue/:id/approve */
router.post("/:id/approve", (req, res) => {
  const item = queryOne(`SELECT * FROM touch_queue WHERE id = ?`, [req.params.id]);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  if (item.status !== "pending_approval") {
    res.status(400).json({ error: `Cannot approve: status is ${item.status}` });
    return;
  }

  // Calculate edit distance if content was edited
  const editDist = item.edit_distance ?? 0;

  run(`UPDATE touch_queue SET status = 'sent', sent_at = datetime('now') WHERE id = ?`, [req.params.id]);

  // TODO: Actually send via channel adapter

  // Log activity
  const contact = queryOne(`SELECT name FROM contacts WHERE id = ?`, [item.contact_id]);
  const contactName = (contact?.name as string) || "Unknown";
  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, touch_queue_id) VALUES (?, ?, ?, ?, 'success', ?, ?)`,
    [uuid(), item.org_id, `Approved & sent to ${contactName}`, `Touch ${(item.touch_index as number) + 1} via ${item.channel}`, contactName, req.params.id]
  );

  // Advance contact to next touch
  const contact2 = queryOne(`SELECT * FROM contacts WHERE id = ?`, [item.contact_id]);
  if (contact2) {
    const seqRow = queryOne(`SELECT touches FROM sequences WHERE id = ?`, [contact2.sequence_id]);
    if (seqRow) {
      const touches = JSON.parse(seqRow.touches as string);
      const nextIndex = (contact2.touch_index as number) + 1;
      if (nextIndex < touches.length) {
        const nextTouch = touches[nextIndex];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + nextTouch.day_offset);
        run(
          `UPDATE contacts SET touch_index = ?, last_touch_at = datetime('now'), next_touch_at = ?, status = 'active' WHERE id = ?`,
          [nextIndex, nextDate.toISOString(), item.contact_id]
        );
      } else {
        run(`UPDATE contacts SET status = 'completed', last_touch_at = datetime('now'), next_touch_at = NULL WHERE id = ?`, [item.contact_id]);
      }
    }
  }

  res.json({ status: "sent" });
});

/** POST /api/queue/:id/reject */
router.post("/:id/reject", (req, res) => {
  const item = queryOne(`SELECT * FROM touch_queue WHERE id = ?`, [req.params.id]);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }

  run(`UPDATE touch_queue SET status = 'skipped' WHERE id = ?`, [req.params.id]);

  const contact = queryOne(`SELECT name FROM contacts WHERE id = ?`, [item.contact_id]);
  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, touch_queue_id) VALUES (?, ?, ?, ?, 'warning', ?, ?)`,
    [uuid(), item.org_id, `Rejected touch for ${(contact?.name as string) || "Unknown"}`, req.body.reason || "Rejected by user", (contact?.name as string), req.params.id]
  );

  res.json({ status: "skipped" });
});

/** POST /api/queue/:id/edit */
router.post("/:id/edit", (req, res) => {
  const { content } = req.body;
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const item = queryOne(`SELECT drafted_content FROM touch_queue WHERE id = ?`, [req.params.id]);
  if (!item) { res.status(404).json({ error: "Not found" }); return; }

  // Simple edit distance: ratio of changed characters
  const original = item.drafted_content as string;
  const editDistance = Math.abs(content.length - original.length) / Math.max(original.length, 1);

  run(`UPDATE touch_queue SET drafted_content = ?, edit_distance = ? WHERE id = ?`, [content, editDistance, req.params.id]);
  res.json({ status: "updated", edit_distance: editDistance });
});

export default router;
