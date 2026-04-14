import { Router } from "express";
import { queryAll } from "../db/database.js";

const router = Router();

/** GET /api/jobs?org_id=xxx&status=queued&limit=50 */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  const status = req.query.status as string;
  const limit = parseInt(req.query.limit as string) || 100;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT * FROM job_queue WHERE org_id = ?`;
  const params: unknown[] = [orgId];
  if (status) { sql += ` AND status = ?`; params.push(status); }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  res.json(queryAll(sql, params));
});

export default router;
