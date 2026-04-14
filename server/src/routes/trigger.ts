import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";
import { enqueue } from "../services/job-queue.js";

const router = Router();

/** POST /api/trigger/scan - enqueue draft jobs for due contacts (async) */
router.post("/scan", async (req, res) => {
  const { org_id } = req.body;
  if (!org_id) { res.status(400).json({ error: "org_id required" }); return; }

  const teammate = await queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [org_id]);
  if (!teammate) { res.status(400).json({ error: "No teammate configured" }); return; }

  const now = new Date().toISOString();

  const dueContacts = await queryAll(
    `SELECT c.*, s.touches as seq_touches, s.name as seq_name, s.id as seq_id
     FROM contacts c
     JOIN sequences s ON s.id = c.sequence_id
     WHERE c.org_id = ? AND c.status IN ('queued', 'active') AND c.next_touch_at <= ?`,
    [org_id, now]
  );

  // Activate queued contacts
  await run(`UPDATE contacts SET status = 'active' WHERE org_id = ? AND status = 'queued' AND next_touch_at <= ?`, [org_id, now]);

  const jobIds: string[] = [];

  for (const contact of dueContacts) {
    const touches = JSON.parse(contact.seq_touches as string);
    const touchIndex = contact.touch_index as number;

    if (touchIndex >= touches.length) {
      await run(`UPDATE contacts SET status = 'completed' WHERE id = ?`, [contact.id]);
      continue;
    }

    const jobId = await enqueue(org_id, "draft_touch", {
      contactId: contact.id,
      sequenceId: contact.seq_id,
      touchIndex,
      seqTouches: contact.seq_touches,
    });
    jobIds.push(jobId);
  }

  await run(
    `INSERT INTO activity_log (id, org_id, action, detail, status) VALUES (?, ?, ?, ?, 'info')`,
    [uuid(), org_id, `Scan complete`, `${dueContacts.length} contacts checked, ${jobIds.length} draft jobs queued`]
  );

  res.json({ status: "queued", contacts_checked: dueContacts.length, jobs_enqueued: jobIds.length, job_ids: jobIds });
});

export default router;
