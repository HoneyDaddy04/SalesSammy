import { Router } from "express";
import { queryOne, queryAll } from "../db/database.js";

const router = Router();

/** GET /api/standup?org_id=xxx — today's standup report */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const today = new Date().toISOString().split("T")[0];

  const sent = queryOne(
    `SELECT COUNT(*) as count FROM touch_queue WHERE org_id = ? AND status = 'sent' AND date(sent_at) = ?`,
    [orgId, today]
  );

  const repliesAll = queryAll(
    `SELECT classification FROM reply_events WHERE org_id = ? AND date(created_at) = ?`,
    [orgId, today]
  );

  const pending = queryOne(
    `SELECT COUNT(*) as count FROM touch_queue WHERE org_id = ? AND status = 'pending_approval'`,
    [orgId]
  );

  const plannedToday = queryOne(
    `SELECT COUNT(*) as count FROM contacts WHERE org_id = ? AND status = 'active' AND date(next_touch_at) = ?`,
    [orgId, today]
  );

  const positiveReplies = repliesAll.filter((r) => r.classification === "positive").length;
  const escalated = queryOne(
    `SELECT COUNT(*) as count FROM reply_events WHERE org_id = ? AND status = 'escalated' AND date(created_at) = ?`,
    [orgId, today]
  );

  const recentActivity = queryAll(
    `SELECT action, detail, status, contact_name, created_at FROM activity_log WHERE org_id = ? ORDER BY created_at DESC LIMIT 10`,
    [orgId]
  );

  res.json({
    date: today,
    touches_sent: (sent?.count as number) || 0,
    replies_received: repliesAll.length,
    positive_replies: positiveReplies,
    meetings_booked: 0, // TODO: track via calendar adapter
    needs_you: (pending?.count as number) || 0,
    escalations: (escalated?.count as number) || 0,
    planned_today: (plannedToday?.count as number) || 0,
    recent_activity: recentActivity,
  });
});

export default router;
