import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryAll, run } from "../db/database.js";

const router = Router();

router.post("/", (req, res) => {
  const { org_id, content, source, metadata } = req.body;
  if (!org_id || !content || !source) {
    res.status(400).json({ error: "Missing: org_id, content, source" });
    return;
  }
  const id = uuid();
  run(
    `INSERT INTO knowledge_chunks (id, org_id, content, source, metadata) VALUES (?, ?, ?, ?, ?)`,
    [id, org_id, content, source, JSON.stringify(metadata || {})]
  );
  res.json({ id, status: "created" });
});

router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }
  res.json(queryAll(`SELECT * FROM knowledge_chunks WHERE org_id = ? ORDER BY created_at DESC`, [orgId]));
});

export default router;
