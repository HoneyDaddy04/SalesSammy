import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";
import { resolveGate, getPendingGates } from "../services/approval-gate.js";

const router = Router();

/** GET /api/approvals?org_id=xxx */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }
  res.json(getPendingGates(orgId));
});

/** GET /api/approvals/all?org_id=xxx — include resolved */
router.get("/all", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }
  res.json(await queryAll(
    `SELECT * FROM approval_gates WHERE org_id = ? ORDER BY requested_at DESC LIMIT 100`,
    [orgId]
  ));
});

/** POST /api/approvals/:id/resolve */
router.post("/:id/resolve", async (req, res) => {
  const { approved, resolved_by } = req.body;
  if (typeof approved !== "boolean") {
    res.status(400).json({ error: "approved (boolean) required" });
    return;
  }

  try {
    const { gate, newValue } = await resolveGate(req.params.id, approved, resolved_by || "user");

    // If approved, apply the change based on gate_type
    if (approved) {
      const gateType = gate.gate_type as string;
      const entityId = gate.entity_id as string;

      if (gateType === "autonomy_transition" && entityId) {
        const nv = newValue as { status: string };
        await run(`UPDATE teammate SET status = ? WHERE id = ?`, [nv.status, entityId]);
      } else if (gateType === "config_change" && entityId) {
        // Generic config change — apply each key/value to teammate
        for (const [key, value] of Object.entries(newValue)) {
          await run(`UPDATE teammate SET ${key} = ? WHERE id = ?`, [typeof value === "object" ? JSON.stringify(value) : value, entityId]);
        }
      }
    }

    res.json({ status: approved ? "approved" : "rejected", gate_type: gate.gate_type });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
