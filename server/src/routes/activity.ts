import { Router } from "express";
import { queryAll } from "../db/database.js";

const router = Router();

/** GET /api/activity?org_id=xxx&agent_id=yyy&limit=50 */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  const agentId = req.query.agent_id as string;
  const limit = parseInt((req.query.limit as string) || "50", 10);

  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT * FROM activity_log WHERE org_id = ?`;
  const params: unknown[] = [orgId];

  if (agentId) {
    sql += ` AND agent_id = ?`;
    params.push(agentId);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  res.json(queryAll(sql, params));
});

export default router;
