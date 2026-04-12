import { Router } from "express";
import { queryAll, queryOne } from "../db/database.js";

const router = Router();

router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const agents = queryAll(`SELECT * FROM agents WHERE org_id = ?`, [orgId]);

  // Include counts
  const enriched = agents.map((a) => {
    const pending = queryOne(
      `SELECT COUNT(*) as count FROM work_items WHERE agent_id = ? AND status = 'pending_approval'`,
      [a.id]
    );
    const executed = queryOne(
      `SELECT COUNT(*) as count FROM work_items WHERE agent_id = ? AND status = 'executed'`,
      [a.id]
    );
    return {
      ...a,
      pending_approvals: (pending?.count as number) || 0,
      executed_actions: (executed?.count as number) || 0,
    };
  });

  res.json(enriched);
});

router.get("/:id", (req, res) => {
  const agent = queryOne(`SELECT * FROM agents WHERE id = ?`, [req.params.id]);
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }
  res.json(agent);
});

export default router;
