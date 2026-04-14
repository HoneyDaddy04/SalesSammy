import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";

const router = Router();

/** GET /api/sequences - list all sequence templates */
router.get("/", (_req, res) => {
  const sequences = queryAll(`SELECT * FROM sequences ORDER BY template_key`);
  res.json(sequences);
});

/** GET /api/sequences/:id - get one sequence with parsed touches */
router.get("/:id", (req, res) => {
  const seq = queryOne(`SELECT * FROM sequences WHERE id = ?`, [req.params.id]);
  if (!seq) { res.status(404).json({ error: "Sequence not found" }); return; }
  res.json({ ...seq, touches: JSON.parse(seq.touches as string) });
});

/** POST /api/sequences - create a new sequence from a template */
router.post("/", (req, res) => {
  const { template_key, name, description, touches } = req.body;
  if (!name || !touches) { res.status(400).json({ error: "name and touches are required" }); return; }

  const id = uuid();
  const key = template_key || `custom_${id.slice(0, 8)}`;
  const touchesJson = typeof touches === "string" ? touches : JSON.stringify(touches);

  // Check for duplicate template_key
  const existing = queryOne(`SELECT id FROM sequences WHERE template_key = ?`, [key]);
  if (existing) { res.status(409).json({ error: "A sequence with this template_key already exists" }); return; }

  run(
    `INSERT INTO sequences (id, template_key, name, description, touches, active) VALUES (?, ?, ?, ?, ?, 1)`,
    [id, key, name, description || "", touchesJson]
  );

  const created = queryOne(`SELECT * FROM sequences WHERE id = ?`, [id]);
  res.status(201).json(created);
});

/** PUT /api/sequences/:id - update a sequence */
router.put("/:id", (req, res) => {
  const seq = queryOne(`SELECT * FROM sequences WHERE id = ?`, [req.params.id]);
  if (!seq) { res.status(404).json({ error: "Sequence not found" }); return; }

  const { name, description, touches, active } = req.body;
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (name !== undefined) { setClauses.push("name = ?"); values.push(name); }
  if (description !== undefined) { setClauses.push("description = ?"); values.push(description); }
  if (touches !== undefined) { setClauses.push("touches = ?"); values.push(typeof touches === "string" ? touches : JSON.stringify(touches)); }
  if (active !== undefined) { setClauses.push("active = ?"); values.push(active ? 1 : 0); }

  if (setClauses.length === 0) { res.status(400).json({ error: "No fields to update" }); return; }

  values.push(req.params.id);
  run(`UPDATE sequences SET ${setClauses.join(", ")} WHERE id = ?`, values);

  const updated = queryOne(`SELECT * FROM sequences WHERE id = ?`, [req.params.id]);
  res.json(updated);
});

/** DELETE /api/sequences/:id - remove a custom sequence */
router.delete("/:id", (req, res) => {
  const seq = queryOne(`SELECT * FROM sequences WHERE id = ?`, [req.params.id]);
  if (!seq) { res.status(404).json({ error: "Sequence not found" }); return; }

  // Check if any contacts are using this sequence
  const usage = queryOne(`SELECT COUNT(*) as c FROM contacts WHERE sequence_id = ?`, [req.params.id]);
  if (usage && (usage.c as number) > 0) {
    res.status(409).json({ error: `Cannot delete: ${usage.c} contacts are using this sequence` });
    return;
  }

  run(`DELETE FROM sequences WHERE id = ?`, [req.params.id]);
  res.json({ deleted: true });
});

export default router;
