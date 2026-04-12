import { Router } from "express";
import { queryAll, queryOne, run } from "../db/database.js";
import { v4 as uuid } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";

const router = Router();
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

/** POST /api/trigger/scan — run the sequence engine for due contacts */
router.post("/scan", async (req, res) => {
  const { org_id } = req.body;
  if (!org_id) { res.status(400).json({ error: "org_id required" }); return; }

  const teammate = queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [org_id]);
  if (!teammate) { res.status(400).json({ error: "No teammate configured" }); return; }

  const now = new Date().toISOString();

  // Find contacts with due touches
  const dueContacts = queryAll(
    `SELECT c.*, s.touches as seq_touches, s.name as seq_name, s.id as seq_id
     FROM contacts c
     JOIN sequences s ON s.id = c.sequence_id
     WHERE c.org_id = ? AND c.status IN ('queued', 'active') AND c.next_touch_at <= ?`,
    [org_id, now]
  );

  // Also activate queued contacts
  run(`UPDATE contacts SET status = 'active' WHERE org_id = ? AND status = 'queued' AND next_touch_at <= ?`, [org_id, now]);

  let drafted = 0;

  for (const contact of dueContacts) {
    const touches = JSON.parse(contact.seq_touches as string);
    const touchIndex = contact.touch_index as number;

    if (touchIndex >= touches.length) {
      run(`UPDATE contacts SET status = 'completed' WHERE id = ?`, [contact.id]);
      continue;
    }

    const touch = touches[touchIndex];
    const channel = touch.channel_tier === "primary"
      ? (teammate.primary_channel as string)
      : (teammate.secondary_channel as string) || (teammate.primary_channel as string);

    // Research context (simple for now — use contact metadata)
    const metadata = JSON.parse(contact.metadata as string);
    const researchContext = `${contact.name} is ${metadata.role || "a contact"} at ${contact.company || "unknown company"}. ${metadata.recent_signal ? `Recent signal: ${metadata.recent_signal}.` : ""} ${metadata.team_size ? `Team size: ${metadata.team_size}.` : ""} Touch ${touchIndex + 1} of ${touches.length}. Previous touches: ${touchIndex > 0 ? `${touchIndex} sent` : "none (first touch)"}.`;

    // Draft message using Claude
    const voiceExamples = JSON.parse((teammate.voice_examples as string) || "[]");
    const voiceBlock = voiceExamples.length > 0
      ? `\n\nHere are examples of messages the user has sent that got good responses — match this voice:\n${voiceExamples.map((v: string, i: number) => `${i + 1}. "${v}"`).join("\n")}`
      : "";

    const operatingInstructions = (teammate.operating_instructions as string) || "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: `${teammate.persona_prompt}${voiceBlock}${operatingInstructions ? `\n\nAdditional instructions from user:\n${operatingInstructions}` : ""}

Rules:
- Write like a real person. Short, warm, direct.
- No bullet points, no markdown, no formatting.
- Max 3-4 sentences.
- Reference something specific about the contact.
- Match the angle: ${touch.angle.replace(/_/g, " ")}.
- Channel: ${channel}. Adjust length/tone for this channel.
- End with a low-pressure question or next step.`,
      messages: [{
        role: "user",
        content: `Draft touch ${touchIndex + 1} for ${contact.name} (${contact.email}).
Angle: ${touch.angle}
Context: ${researchContext}
Goal: ${teammate.goal}`,
      }],
    });

    const draftedContent = (response.content[0] as Anthropic.TextBlock).text;

    // Insert into touch queue
    const touchId = uuid();
    run(
      `INSERT INTO touch_queue (id, org_id, contact_id, sequence_id, touch_index, channel, angle, drafted_content, research_context, status, scheduled_for) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?)`,
      [touchId, org_id, contact.id, contact.seq_id, touchIndex, channel, touch.angle, draftedContent, researchContext, now]
    );

    // Log activity
    run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, touch_queue_id) VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [uuid(), org_id, `Drafted touch ${touchIndex + 1} for ${contact.name}`, `${touch.angle.replace(/_/g, " ")} / ${channel}`, contact.name, touchId]
    );

    drafted++;
  }

  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status) VALUES (?, ?, ?, ?, 'info')`,
    [uuid(), org_id, `Scan complete`, `${dueContacts.length} contacts checked, ${drafted} touches drafted`]
  );

  res.json({ status: "complete", contacts_checked: dueContacts.length, touches_drafted: drafted });
});

export default router;
