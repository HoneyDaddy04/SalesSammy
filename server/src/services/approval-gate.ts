import { queryOne, queryAll, run } from "../db/database.js";
import { v4 as uuid } from "uuid";

export type GateType = "config_change" | "budget_breach" | "autonomy_transition" | "sequence_change" | "escalation_rule";

/** Create a pending approval gate. Returns gate id. */
export function createGate(
  orgId: string,
  gateType: GateType,
  entityId: string | null,
  oldValue: object,
  newValue: object
): string {
  const id = uuid();
  run(
    `INSERT INTO approval_gates (id, org_id, gate_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, orgId, gateType, entityId, JSON.stringify(oldValue), JSON.stringify(newValue)]
  );
  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status) VALUES (?, ?, ?, ?, 'pending')`,
    [uuid(), orgId, `Approval required: ${gateType.replace(/_/g, " ")}`, `Pending review`]
  );
  return id;
}

/** Resolve a gate. Returns the new_value if approved. */
export function resolveGate(gateId: string, approved: boolean, resolvedBy: string): { gate: any; newValue: object } {
  const gate = queryOne(`SELECT * FROM approval_gates WHERE id = ?`, [gateId]);
  if (!gate) throw new Error("Approval gate not found");
  if (gate.status !== "pending") throw new Error(`Gate already resolved: ${gate.status}`);

  run(
    `UPDATE approval_gates SET status = ?, resolved_at = datetime('now'), resolved_by = ? WHERE id = ?`,
    [approved ? "approved" : "rejected", resolvedBy, gateId]
  );

  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status) VALUES (?, ?, ?, ?, ?)`,
    [uuid(), gate.org_id, `Approval ${approved ? "granted" : "denied"}: ${gate.gate_type}`, `Resolved by ${resolvedBy}`, approved ? "success" : "warning"]
  );

  return { gate, newValue: JSON.parse(gate.new_value as string) };
}

/** Get pending gates for an org. */
export function getPendingGates(orgId: string) {
  return queryAll(
    `SELECT * FROM approval_gates WHERE org_id = ? AND status = 'pending' ORDER BY requested_at DESC`,
    [orgId]
  );
}
