import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";
import { executeAction } from "../engine/actions.js";
import type { ProposedAction, WorkTarget } from "../types/index.js";
import { v4 as uuid } from "uuid";

const router = Router();

/** GET /api/work-items?org_id=xxx&status=pending_approval */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  const status = req.query.status as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  let sql = `SELECT w.*, a.name as agent_name, a.role as agent_role FROM work_items w JOIN agents a ON a.id = w.agent_id WHERE w.org_id = ?`;
  const params: unknown[] = [orgId];

  if (status) {
    sql += ` AND w.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY w.updated_at DESC LIMIT 50`;
  res.json(queryAll(sql, params));
});

/** POST /api/work-items/:id/approve — approve a pending action */
router.post("/:id/approve", async (req, res) => {
  const item = queryOne(`SELECT * FROM work_items WHERE id = ?`, [req.params.id]);
  if (!item) { res.status(404).json({ error: "Work item not found" }); return; }
  if (item.status !== "pending_approval") {
    res.status(400).json({ error: `Cannot approve item in status: ${item.status}` });
    return;
  }

  const action = JSON.parse(item.proposed_action as string) as ProposedAction;
  const target = JSON.parse(item.target as string) as WorkTarget;

  run(`UPDATE work_items SET status = 'approved', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);

  try {
    const result = await executeAction(action, target);
    run(`UPDATE work_items SET status = 'executed', result = ?, updated_at = datetime('now') WHERE id = ?`, [result, req.params.id]);

    // Log it
    const agentName = (item.agent_name as string) || "Agent";
    run(
      `INSERT INTO activity_log (id, org_id, agent_id, agent_name, work_item_id, action, detail, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
      [uuid(), item.org_id, item.agent_id, agentName, req.params.id, `Approved & sent to ${target.name}`, result]
    );

    res.json({ status: "executed", result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Execution failed";
    run(`UPDATE work_items SET status = 'failed', result = ?, updated_at = datetime('now') WHERE id = ?`, [msg, req.params.id]);
    res.status(500).json({ error: msg });
  }
});

/** POST /api/work-items/:id/reject — reject a pending action */
router.post("/:id/reject", (req, res) => {
  const item = queryOne(`SELECT * FROM work_items WHERE id = ?`, [req.params.id]);
  if (!item) { res.status(404).json({ error: "Work item not found" }); return; }

  const reason = req.body.reason || "Rejected by user";
  run(`UPDATE work_items SET status = 'rejected', result = ?, updated_at = datetime('now') WHERE id = ?`, [reason, req.params.id]);

  const target = JSON.parse(item.target as string) as WorkTarget;
  const agentName = (item.agent_name as string) || "Agent";
  run(
    `INSERT INTO activity_log (id, org_id, agent_id, agent_name, work_item_id, action, detail, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'warning')`,
    [uuid(), item.org_id, item.agent_id, agentName, req.params.id, `Rejected action for ${target.name}`, reason]
  );

  res.json({ status: "rejected" });
});

/** POST /api/work-items/:id/edit — edit the drafted message before approving */
router.post("/:id/edit", (req, res) => {
  const item = queryOne(`SELECT * FROM work_items WHERE id = ?`, [req.params.id]);
  if (!item) { res.status(404).json({ error: "Work item not found" }); return; }

  const { content } = req.body;
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const action = JSON.parse(item.proposed_action as string) as ProposedAction;
  action.content = content;

  run(`UPDATE work_items SET proposed_action = ?, updated_at = datetime('now') WHERE id = ?`, [JSON.stringify(action), req.params.id]);
  res.json({ status: "updated" });
});

export default router;
