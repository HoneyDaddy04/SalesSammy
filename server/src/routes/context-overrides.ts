import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";

const router = Router();

/** GET /api/context-overrides?org_id=xxx */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }
  res.json(await queryAll(`SELECT * FROM context_overrides WHERE org_id = ? ORDER BY scope_type, scope_id`, [orgId]));
});

/** POST /api/context-overrides */
router.post("/", async (req, res) => {
  const { org_id, scope_type, scope_id, persona_additions, instruction_additions, voice_overrides } = req.body;
  if (!org_id || !scope_type || !scope_id) {
    res.status(400).json({ error: "org_id, scope_type, and scope_id required" });
    return;
  }

  const id = uuid();
  await run(
    `INSERT INTO context_overrides (id, org_id, scope_type, scope_id, persona_additions, instruction_additions, voice_overrides) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, org_id, scope_type, scope_id, persona_additions || "", instruction_additions || "", JSON.stringify(voice_overrides || [])]
  );
  res.json({ id, status: "created" });
});

/** PUT /api/context-overrides/:id */
router.put("/:id", async (req, res) => {
  const existing = await queryOne(`SELECT * FROM context_overrides WHERE id = ?`, [req.params.id]);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { persona_additions, instruction_additions, voice_overrides } = req.body;
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (persona_additions !== undefined) { sets.push("persona_additions = ?"); vals.push(persona_additions); }
  if (instruction_additions !== undefined) { sets.push("instruction_additions = ?"); vals.push(instruction_additions); }
  if (voice_overrides !== undefined) { sets.push("voice_overrides = ?"); vals.push(JSON.stringify(voice_overrides)); }

  if (sets.length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  vals.push(req.params.id);
  await run(`UPDATE context_overrides SET ${sets.join(", ")} WHERE id = ?`, vals);
  res.json({ status: "updated" });
});

/** DELETE /api/context-overrides/:id */
router.delete("/:id", async (req, res) => {
  await run(`DELETE FROM context_overrides WHERE id = ?`, [req.params.id]);
  res.json({ status: "deleted" });
});

export default router;
