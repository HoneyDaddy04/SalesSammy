import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";

const router = Router();

/**
 * Admin panel API — for platform operators to manage all tenants.
 * In production, protect these routes with a separate admin auth middleware.
 */

/** GET /api/admin/tenants — list all organizations with stats */
router.get("/tenants", async (_req, res) => {
  const orgs = await queryAll(`
    SELECT
      o.id, o.name, o.industry, o.created_at,
      (SELECT COUNT(*) FROM contacts WHERE org_id = o.id) as contact_count,
      (SELECT COUNT(*) FROM touch_queue WHERE org_id = o.id AND status = 'sent') as touches_sent,
      (SELECT COUNT(*) FROM reply_events WHERE org_id = o.id) as replies_received,
      (SELECT status FROM teammate WHERE org_id = o.id) as teammate_status,
      (SELECT plan FROM subscriptions WHERE org_id = o.id) as plan
    FROM organizations o
    ORDER BY o.created_at DESC
  `, []);
  res.json(orgs);
});

/** GET /api/admin/tenants/:orgId — detailed tenant view */
router.get("/tenants/:orgId", async (req, res) => {
  const orgId = req.params.orgId;

  const [org, teammate, contacts, subscription, activity] = await Promise.all([
    queryOne(`SELECT * FROM organizations WHERE id = ?`, [orgId]),
    queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]),
    queryAll(`SELECT status, COUNT(*) as count FROM contacts WHERE org_id = ? GROUP BY status`, [orgId]),
    queryOne(`SELECT * FROM subscriptions WHERE org_id = ?`, [orgId]),
    queryAll(`SELECT * FROM activity_log WHERE org_id = ? ORDER BY created_at DESC LIMIT 20`, [orgId]),
  ]);

  if (!org) { res.status(404).json({ error: "Tenant not found" }); return; }

  res.json({ org, teammate, contactsByStatus: contacts, subscription, recentActivity: activity });
});

/** GET /api/admin/stats — platform-wide stats */
router.get("/stats", async (_req, res) => {
  const [orgs, contacts, touches, replies, activeOrgs] = await Promise.all([
    queryOne(`SELECT COUNT(*) as count FROM organizations`, []),
    queryOne(`SELECT COUNT(*) as count FROM contacts`, []),
    queryOne(`SELECT COUNT(*) as count FROM touch_queue WHERE status = 'sent'`, []),
    queryOne(`SELECT COUNT(*) as count FROM reply_events`, []),
    queryOne(`SELECT COUNT(DISTINCT org_id) as count FROM touch_queue WHERE status = 'sent'`, []),
  ]);

  res.json({
    total_tenants: (orgs?.count as number) || 0,
    total_contacts: (contacts?.count as number) || 0,
    total_touches_sent: (touches?.count as number) || 0,
    total_replies: (replies?.count as number) || 0,
    active_tenants: (activeOrgs?.count as number) || 0,
  });
});

/** PUT /api/admin/tenants/:orgId/plan — change a tenant's plan */
router.put("/tenants/:orgId/plan", async (req, res) => {
  const { plan, touches_limit } = req.body;
  const orgId = req.params.orgId;
  if (!plan) { res.status(400).json({ error: "plan required" }); return; }

  const sub = await queryOne(`SELECT id FROM subscriptions WHERE org_id = ?`, [orgId]);
  if (!sub) { res.status(404).json({ error: "No subscription for this tenant" }); return; }

  await run(`UPDATE subscriptions SET plan = ?, touches_limit = ? WHERE org_id = ?`,
    [plan, touches_limit || (plan === "starter" ? 500 : plan === "growth" ? 2000 : 10000), orgId]);
  res.json({ status: "updated" });
});

/** PUT /api/admin/tenants/:orgId/status — toggle teammate status (shadow/supervised/autonomous) */
router.put("/tenants/:orgId/status", async (req, res) => {
  const { status } = req.body;
  const orgId = req.params.orgId;
  if (!["shadow", "supervised", "autonomous"].includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  await run(`UPDATE teammate SET status = ? WHERE org_id = ?`, [status, orgId]);
  res.json({ status: "updated" });
});

/** DELETE /api/admin/tenants/:orgId — delete a tenant and all their data */
router.delete("/tenants/:orgId", async (req, res) => {
  const orgId = req.params.orgId;

  // Delete in dependency order
  const tables = [
    "contact_memory", "pattern_insights", "reply_events", "touch_queue",
    "contacts", "knowledge_chunks", "activity_log", "job_queue",
    "config_revisions", "context_overrides", "approval_gates",
    "integrations", "subscriptions", "inbound_messages",
    "onboarding_sessions", "messages", "conversations", "teammate",
  ];

  for (const table of tables) {
    await run(`DELETE FROM ${table} WHERE org_id = ?`, [orgId]);
  }
  // conversations messages need special handling (messages FK to conversations, not org_id)
  await run(`DELETE FROM organizations WHERE id = ?`, [orgId]);

  res.json({ status: "deleted" });
});

export default router;
