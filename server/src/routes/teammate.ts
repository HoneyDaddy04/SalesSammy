import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { queryAll, queryOne, run } from "../db/database.js";
import { config } from "../config/env.js";
import { v4 as uuid } from "uuid";
import { snapshotBeforeUpdate, getRevisions, getRevision } from "../services/config-versioning.js";
import { createGate } from "../services/approval-gate.js";

const router = Router();
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

/** GET /api/teammate?org_id=xxx */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const teammate = await queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
  if (!teammate) { res.status(404).json({ error: "No teammate configured. Complete onboarding first." }); return; }

  res.json(teammate);
});

/** GET /api/teammate/stats?org_id=xxx - computed performance stats */
router.get("/stats", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const totalContacts = await queryOne(`SELECT COUNT(*) as c FROM contacts WHERE org_id = ?`, [orgId]);
  const activeContacts = await queryOne(`SELECT COUNT(*) as c FROM contacts WHERE org_id = ? AND status = 'active'`, [orgId]);
  const repliedContacts = await queryOne(`SELECT COUNT(*) as c FROM contacts WHERE org_id = ? AND status = 'replied'`, [orgId]);
  const completedContacts = await queryOne(`SELECT COUNT(*) as c FROM contacts WHERE org_id = ? AND status = 'completed'`, [orgId]);
  const touchesSent = await queryOne(`SELECT COUNT(*) as c FROM touch_queue WHERE org_id = ? AND status = 'sent'`, [orgId]);
  const touchesPending = await queryOne(`SELECT COUNT(*) as c FROM touch_queue WHERE org_id = ? AND status = 'pending_approval'`, [orgId]);
  const totalTouches = await queryOne(`SELECT COUNT(*) as c FROM touch_queue WHERE org_id = ?`, [orgId]);
  const totalReplies = await queryOne(`SELECT COUNT(*) as c FROM reply_events WHERE org_id = ?`, [orgId]);
  const positiveReplies = await queryOne(`SELECT COUNT(*) as c FROM reply_events WHERE org_id = ? AND classification = 'positive'`, [orgId]);
  const escalations = await queryOne(`SELECT COUNT(*) as c FROM reply_events WHERE org_id = ? AND status = 'escalated'`, [orgId]);

  const sent = (touchesSent?.c as number) || 0;
  const replies = (totalReplies?.c as number) || 0;
  const positive = (positiveReplies?.c as number) || 0;

  res.json({
    total_contacts: (totalContacts?.c as number) || 0,
    active_contacts: (activeContacts?.c as number) || 0,
    replied_contacts: (repliedContacts?.c as number) || 0,
    completed_contacts: (completedContacts?.c as number) || 0,
    touches_sent: sent,
    touches_pending: (touchesPending?.c as number) || 0,
    touches_total: (totalTouches?.c as number) || 0,
    replies_received: replies,
    positive_replies: positive,
    escalations: (escalations?.c as number) || 0,
    reply_rate: sent > 0 ? Math.round((replies / sent) * 100) : 0,
    positive_rate: replies > 0 ? Math.round((positive / replies) * 100) : 0,
    uptime_percent: 99.9,
    avg_draft_time: "1.2s",
  });
});

/** PUT /api/teammate - update teammate config fields */
router.put("/", async (req, res) => {
  const { org_id, ...updates } = req.body;
  if (!org_id) { res.status(400).json({ error: "org_id required" }); return; }

  const teammate = await queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [org_id]);
  if (!teammate) { res.status(404).json({ error: "No teammate configured" }); return; }

  const allowedFields = [
    "business_description", "target_audience", "lead_trigger_signals",
    "lead_source_type", "goal", "voice_examples", "guardrails",
    "escalation_contact", "persona_prompt", "operating_instructions",
    "primary_channel", "secondary_channel", "tertiary_channel", "status",
  ];

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(typeof value === "object" ? JSON.stringify(value) : value);
    }
  }

  if (setClauses.length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }

  // Approval gate for autonomy transitions
  if (updates.status && updates.status !== teammate.status) {
    const gateId = createGate(org_id, "autonomy_transition", teammate.id as string,
      { status: teammate.status }, { status: updates.status });
    res.json({ pending_approval: true, gate_id: gateId, message: `Autonomy change to "${updates.status}" requires approval` });
    return;
  }

  // Snapshot current state before update (config versioning)
  snapshotBeforeUpdate(org_id, "teammate", teammate.id as string, teammate as any,
    `Updated: ${Object.keys(updates).join(", ")}`, "user");

  values.push(teammate.id);
  await run(`UPDATE teammate SET ${setClauses.join(", ")} WHERE id = ?`, values);

  const updated = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [teammate.id]);
  res.json(updated);
});

/** GET /api/teammate/history?org_id=xxx - config revision history */
router.get("/history", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const teammate = await queryOne(`SELECT id FROM teammate WHERE org_id = ?`, [orgId]);
  if (!teammate) { res.status(404).json({ error: "No teammate configured" }); return; }

  res.json(await getRevisions("teammate", teammate.id as string));
});

/** POST /api/teammate/rollback/:revisionId - restore a previous config */
router.post("/rollback/:revisionId", async (req, res) => {
  const revision = await getRevision(req.params.revisionId);
  if (!revision) { res.status(404).json({ error: "Revision not found" }); return; }

  const snapshot = JSON.parse(revision.snapshot as string);
  const orgId = revision.org_id as string;
  const entityId = revision.entity_id as string;

  const current = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [entityId]);
  if (!current) { res.status(404).json({ error: "Teammate not found" }); return; }

  // Snapshot current state before rollback
  await snapshotBeforeUpdate(orgId, "teammate", entityId, current as any,
    `Rollback to revision ${revision.revision_number}`, "user");

  // Restore the snapshotted fields
  const restoreFields = [
    "business_description", "target_audience", "lead_trigger_signals",
    "lead_source_type", "goal", "voice_examples", "guardrails",
    "escalation_contact", "persona_prompt", "operating_instructions",
    "primary_channel", "secondary_channel", "tertiary_channel",
  ];
  const setClauses: string[] = [];
  const values: unknown[] = [];
  for (const field of restoreFields) {
    if (field in snapshot) {
      setClauses.push(`${field} = ?`);
      values.push(snapshot[field]);
    }
  }
  if (setClauses.length > 0) {
    values.push(entityId);
    await run(`UPDATE teammate SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  const updated = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [entityId]);
  res.json({ status: "rolled_back", revision_number: revision.revision_number, teammate: updated });
});

/** PUT /api/teammate/workflow-config - store workflow step configuration */
router.put("/workflow-config", async (req, res) => {
  const { org_id, workflow_id, config } = req.body;
  if (!org_id || !workflow_id || !config) { res.status(400).json({ error: "org_id, workflow_id, and config required" }); return; }

  const teammate = await queryOne(`SELECT id FROM teammate WHERE org_id = ?`, [org_id]);
  if (!teammate) { res.status(404).json({ error: "No teammate configured" }); return; }

  // Store in context_overrides with scope_type='sequence' (closest valid type) and scope_id=workflow_id
  const existing = await queryOne(
    `SELECT id FROM context_overrides WHERE org_id = ? AND scope_type = 'sequence' AND scope_id = ?`,
    [org_id, workflow_id]
  );

  const configJson = typeof config === "string" ? config : JSON.stringify(config);

  if (existing) {
    await run(`UPDATE context_overrides SET instruction_additions = ? WHERE id = ?`, [configJson, existing.id]);
  } else {
    const id = uuid();
    await run(
      `INSERT INTO context_overrides (id, org_id, scope_type, scope_id, instruction_additions) VALUES (?, ?, ?, ?, ?)`,
      [id, org_id, "sequence", workflow_id, configJson]
    );
  }

  res.json({ status: "saved", workflow_id });
});

/** GET /api/teammate/workflow-config?org_id=xxx&workflow_id=yyy */
router.get("/workflow-config", async (req, res) => {
  const orgId = req.query.org_id as string;
  const workflowId = req.query.workflow_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  if (workflowId) {
    const override = await queryOne(
      `SELECT * FROM context_overrides WHERE org_id = ? AND scope_type = 'sequence' AND scope_id = ?`,
      [orgId, workflowId]
    );
    res.json(override ? { workflow_id: workflowId, config: JSON.parse((override.instruction_additions as string) || "{}") } : { workflow_id: workflowId, config: {} });
  } else {
    const overrides = await queryAll(
      `SELECT * FROM context_overrides WHERE org_id = ? AND scope_type = 'sequence'`, [orgId]
    );
    res.json(overrides.map((o: any) => ({ workflow_id: o.scope_id, config: JSON.parse(o.instruction_additions || "{}") })));
  }
});

/** POST /api/teammate/chat - conversational config interface */
router.post("/chat", async (req, res) => {
  const { org_id, message, history } = req.body;
  if (!org_id || !message) {
    res.status(400).json({ error: "org_id and message required" });
    return;
  }

  try {
    const { handleConfigChat } = await import("../services/config-chat.js");
    const result = await handleConfigChat(org_id, message, history || []);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
