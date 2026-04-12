import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { queryOne, run } from "../db/database.js";
import { config } from "../config/env.js";
import { v4 as uuid } from "uuid";

const router = Router();
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

/** GET /api/teammate?org_id=xxx */
router.get("/", (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const teammate = queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
  if (!teammate) { res.status(404).json({ error: "No teammate configured. Complete onboarding first." }); return; }

  res.json(teammate);
});

/** POST /api/teammate/chat — chat-based adjustment interface */
router.post("/chat", async (req, res) => {
  const { org_id, message } = req.body;
  if (!org_id || !message) {
    res.status(400).json({ error: "org_id and message required" });
    return;
  }

  const teammate = queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [org_id]);
  if (!teammate) {
    res.status(404).json({ error: "No teammate configured" });
    return;
  }

  const currentInstructions = (teammate.operating_instructions as string) || "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You are the user's AI follow-up teammate. They're adjusting how you work via chat.

Your current operating instructions:
${currentInstructions || "(none yet)"}

Your persona:
${teammate.persona_prompt}

When the user gives you an adjustment (tone, content, timing, channels, guardrails, etc.):
1. Confirm you understood in 1-2 sentences
2. If the adjustment is a new rule, output it on a new line prefixed with "INSTRUCTION:" so it can be saved
3. Show a before/after if relevant

When the user asks a question about how you work, answer briefly.

Keep it conversational. No bullet points or markdown.`,
    messages: [{ role: "user", content: message }],
  });

  const responseText = (response.content[0] as Anthropic.TextBlock).text;

  // Extract any new instructions
  const instructionLines = responseText
    .split("\n")
    .filter((line) => line.startsWith("INSTRUCTION:"))
    .map((line) => line.replace("INSTRUCTION:", "").trim());

  if (instructionLines.length > 0) {
    const updated = currentInstructions
      ? currentInstructions + "\n" + instructionLines.join("\n")
      : instructionLines.join("\n");
    run(`UPDATE teammate SET operating_instructions = ? WHERE id = ?`, [updated, teammate.id]);
  }

  // Clean response (remove INSTRUCTION: lines from what user sees)
  const cleanResponse = responseText
    .split("\n")
    .filter((line) => !line.startsWith("INSTRUCTION:"))
    .join("\n")
    .trim();

  res.json({ response: cleanResponse });
});

export default router;
