import { Router } from "express";
import { queryAll } from "../db/database.js";

const router = Router();

router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }
  res.json(
    queryAll(
      `SELECT c.*, a.name as agent_name, a.role as agent_role
       FROM conversations c JOIN agents a ON a.id = c.agent_id
       WHERE c.org_id = ? ORDER BY c.updated_at DESC LIMIT 50`,
      [orgId]
    )
  );
});

router.get("/:id/messages", (req, res) => {
  res.json(
    queryAll(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`, [req.params.id])
  );
});

export default router;
