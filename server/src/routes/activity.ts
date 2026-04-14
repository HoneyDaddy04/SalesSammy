import { Router } from "express";
import { queryAll } from "../db/database.js";

const router = Router();

/** GET /api/activity?org_id=xxx&limit=50 */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  const limit = parseInt((req.query.limit as string) || "50", 10);

  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT * FROM activity_log WHERE org_id = ?`;
  const params: unknown[] = [orgId];

  const contactName = req.query.contact_name as string;
  if (contactName) {
    sql += ` AND contact_name = ?`;
    params.push(contactName);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  res.json(await queryAll(sql, params));
});

export default router;
