import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";
import { queryOne, queryAll, run } from "../db/database.js";
import { snapshotBeforeUpdate } from "./config-versioning.js";
import { v4 as uuid } from "uuid";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// ── Types for flow preview ──

export interface TouchPreview {
  index: number;
  day_offset: number;
  angle: string;
  channel_tier: string;
  channel_resolved: string; // Actual channel that would be used
}

export interface SequencePreview {
  template_key: string;
  name: string;
  active: boolean;
  touches: TouchPreview[];
}

export interface OverridePreview {
  scope_type: string;
  scope_id: string;
  persona_additions: string;
  instruction_additions: string;
}

export interface FlowPreview {
  teammate: {
    goal: string;
    primary_channel: string;
    secondary_channel: string | null;
    tertiary_channel: string | null;
    status: string;
  };
  sequences: SequencePreview[];
  guardrails: string[];
  voice_examples: string[];
  overrides: OverridePreview[];
  escalation_contact: { name: string; email: string; phone?: string } | null;
}

export interface ConfigChange {
  type: string; // "guardrail_added" | "timing_updated" | "override_set" | etc.
  label: string; // Human readable: "Added guardrail"
  detail: string; // What changed: "Never mention pricing unless asked"
  before?: string;
  after?: string;
  revision_id?: string; // For undo
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  response: string;
  changes: ConfigChange[];
  flowPreview: FlowPreview | null; // null if no changes were made (just a question)
}

// ── Build flow preview from current DB state ──

async function buildFlowPreview(orgId: string): Promise<FlowPreview> {
  const tm = await queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
  if (!tm) throw new Error("No teammate configured");

  const primaryChannel = (tm.primary_channel as string) || "email";
  const secondaryChannel = (tm.secondary_channel as string) || null;
  const tertiaryChannel = (tm.tertiary_channel as string) || null;

  const channelMap: Record<string, string> = {
    primary: primaryChannel,
    secondary: secondaryChannel || primaryChannel,
    tertiary: tertiaryChannel || secondaryChannel || primaryChannel,
  };

  const seqs = await queryAll(`SELECT * FROM sequences`, []);
  const sequences: SequencePreview[] = seqs.map(s => {
    const touches = JSON.parse((s.touches as string) || "[]");
    return {
      template_key: s.template_key as string,
      name: s.name as string,
      active: !!(s.active as number),
      touches: touches.map((t: any, i: number) => ({
        index: i,
        day_offset: t.day_offset ?? 0,
        angle: t.angle || "intro",
        channel_tier: t.channel_tier || "primary",
        channel_resolved: channelMap[t.channel_tier || "primary"] || primaryChannel,
      })),
    };
  });

  const overridesRows = await queryAll(`SELECT * FROM context_overrides WHERE org_id = ?`, [orgId]);
  const overrides: OverridePreview[] = overridesRows.map(o => ({
    scope_type: o.scope_type as string,
    scope_id: o.scope_id as string,
    persona_additions: (o.persona_additions as string) || "",
    instruction_additions: (o.instruction_additions as string) || "",
  }));

  const guardrails: string[] = JSON.parse((tm.guardrails as string) || "[]");
  const voiceExamples: string[] = JSON.parse((tm.voice_examples as string) || "[]");
  const escalation = JSON.parse((tm.escalation_contact as string) || "{}");

  return {
    teammate: {
      goal: (tm.goal as string) || "",
      primary_channel: primaryChannel,
      secondary_channel: secondaryChannel,
      tertiary_channel: tertiaryChannel,
      status: (tm.status as string) || "shadow",
    },
    sequences,
    guardrails,
    voice_examples: voiceExamples,
    overrides,
    escalation_contact: escalation.email ? escalation : null,
  };
}

// ── Tools Claude can call to modify config ──

const configTools: Anthropic.Tool[] = [
  {
    name: "update_teammate",
    description: "Update teammate config fields: business_description, target_audience, goal, persona_prompt, operating_instructions, lead_trigger_signals, lead_source_type, primary_channel, secondary_channel, tertiary_channel.",
    input_schema: {
      type: "object" as const,
      properties: {
        field: { type: "string", description: "The field to update" },
        value: { type: "string", description: "The new value" },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "add_guardrail",
    description: "Add a guardrail rule (e.g. 'Never mention competitor X', 'Escalate if they mention legal', 'Don't discuss pricing unless asked').",
    input_schema: {
      type: "object" as const,
      properties: {
        rule: { type: "string", description: "The guardrail rule to add" },
      },
      required: ["rule"],
    },
  },
  {
    name: "remove_guardrail",
    description: "Remove a guardrail rule by its text (partial match is fine).",
    input_schema: {
      type: "object" as const,
      properties: {
        rule_text: { type: "string", description: "Text to match against existing guardrails" },
      },
      required: ["rule_text"],
    },
  },
  {
    name: "add_voice_example",
    description: "Add a voice example — a real message that shows the tone/style the teammate should use.",
    input_schema: {
      type: "object" as const,
      properties: {
        example: { type: "string", description: "The voice example message" },
      },
      required: ["example"],
    },
  },
  {
    name: "remove_voice_example",
    description: "Remove a voice example by partial text match.",
    input_schema: {
      type: "object" as const,
      properties: {
        example_text: { type: "string", description: "Text to match against existing voice examples" },
      },
      required: ["example_text"],
    },
  },
  {
    name: "update_sequence",
    description: "Update a sequence's touches (timing, angles, channels). Use this when the user wants to change follow-up timing, add/remove touches, or change the approach for a sequence.",
    input_schema: {
      type: "object" as const,
      properties: {
        template_key: { type: "string", description: "Sequence template key: cold_outbound, abandoned_cart, inbound_lead, re_engagement, post_conversion, stalled_revival" },
        touches: { type: "string", description: "JSON array of touch objects: [{day_offset, angle, channel_tier}]" },
      },
      required: ["template_key", "touches"],
    },
  },
  {
    name: "update_sequence_timing",
    description: "Update just the timing (day_offset) of touches in a sequence without changing angles or channels.",
    input_schema: {
      type: "object" as const,
      properties: {
        template_key: { type: "string", description: "Sequence template key" },
        day_offsets: { type: "string", description: "JSON array of new day offsets, one per touch. e.g. [0, 3, 7, 14]" },
      },
      required: ["template_key", "day_offsets"],
    },
  },
  {
    name: "set_context_override",
    description: "Set behavior overrides for a specific scope (channel, sequence, or contact segment/tag). Use this when the user wants different behavior for specific channels or lead types.",
    input_schema: {
      type: "object" as const,
      properties: {
        scope_type: { type: "string", enum: ["channel", "sequence", "segment"], description: "What to scope the override to" },
        scope_id: { type: "string", description: "Channel name (email, whatsapp, linkedin), sequence template_key, or contact tag" },
        persona_additions: { type: "string", description: "Additional persona instructions for this scope" },
        instruction_additions: { type: "string", description: "Additional operating instructions for this scope" },
      },
      required: ["scope_type", "scope_id"],
    },
  },
  {
    name: "set_escalation_contact",
    description: "Set who gets notified when Sammy escalates a conversation (e.g. hostile reply, guardrail trigger).",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Contact name" },
        email: { type: "string", description: "Contact email" },
        phone: { type: "string", description: "Contact phone (optional)" },
      },
      required: ["name", "email"],
    },
  },
  {
    name: "get_current_config",
    description: "Read the current teammate config to answer a question about how things are set up. Use this before making changes so you know what exists.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_sequences",
    description: "Read all sequences and their touches to answer timing/approach questions.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ── Execute config tool calls ──

async function executeConfigTool(
  orgId: string,
  teammateId: string,
  name: string,
  input: Record<string, string>,
): Promise<{ result: string; change?: ConfigChange }> {
  try {
    switch (name) {
      case "get_current_config": {
        const tm = await queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
        if (!tm) return { result: "No teammate configured." };
        return {
          result: JSON.stringify({
            business_description: tm.business_description,
            target_audience: tm.target_audience,
            goal: tm.goal,
            persona_prompt: tm.persona_prompt,
            operating_instructions: tm.operating_instructions,
            lead_trigger_signals: tm.lead_trigger_signals,
            lead_source_type: tm.lead_source_type,
            guardrails: JSON.parse((tm.guardrails as string) || "[]"),
            voice_examples: JSON.parse((tm.voice_examples as string) || "[]"),
            escalation_contact: JSON.parse((tm.escalation_contact as string) || "{}"),
            primary_channel: tm.primary_channel,
            secondary_channel: tm.secondary_channel,
            tertiary_channel: tm.tertiary_channel,
            status: tm.status,
          }, null, 2),
        };
      }

      case "get_sequences": {
        const seqs = await queryAll(`SELECT * FROM sequences`, []);
        return {
          result: JSON.stringify(seqs.map(s => ({
            template_key: s.template_key,
            name: s.name,
            active: s.active,
            touches: JSON.parse((s.touches as string) || "[]"),
          })), null, 2),
        };
      }

      case "update_teammate": {
        const allowed = [
          "business_description", "target_audience", "goal", "persona_prompt",
          "operating_instructions", "lead_trigger_signals", "lead_source_type",
          "primary_channel", "secondary_channel", "tertiary_channel",
        ];
        if (!allowed.includes(input.field)) return { result: `Cannot update "${input.field}" via chat. Allowed: ${allowed.join(", ")}` };

        const current = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [teammateId]);
        const revisionId = uuid();
        await snapshotBeforeUpdate(orgId, "teammate", teammateId, current as any, `Chat: updated ${input.field}`, "chat");
        await run(`UPDATE teammate SET ${input.field} = ? WHERE id = ?`, [input.value, teammateId]);

        const oldVal = (current as any)?.[input.field] || "(empty)";
        return {
          result: `Updated ${input.field}.`,
          change: {
            type: "teammate_updated",
            label: `Updated ${input.field.replace(/_/g, " ")}`,
            detail: input.value,
            before: typeof oldVal === "string" ? oldVal.slice(0, 100) : JSON.stringify(oldVal).slice(0, 100),
            after: input.value.slice(0, 100),
            revision_id: revisionId,
          },
        };
      }

      case "add_guardrail": {
        const tm = await queryOne(`SELECT guardrails FROM teammate WHERE id = ?`, [teammateId]);
        const guardrails: string[] = JSON.parse((tm?.guardrails as string) || "[]");
        const before = [...guardrails];
        guardrails.push(input.rule);
        const current = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [teammateId]);
        const revisionId = uuid();
        await snapshotBeforeUpdate(orgId, "teammate", teammateId, current as any, `Chat: added guardrail`, "chat");
        await run(`UPDATE teammate SET guardrails = ? WHERE id = ?`, [JSON.stringify(guardrails), teammateId]);
        return {
          result: `Added guardrail: "${input.rule}". Now have ${guardrails.length} guardrail(s).`,
          change: {
            type: "guardrail_added",
            label: "Added guardrail",
            detail: input.rule,
            before: before.length ? before.join(", ") : "(none)",
            after: guardrails.join(", "),
            revision_id: revisionId,
          },
        };
      }

      case "remove_guardrail": {
        const tm = await queryOne(`SELECT guardrails FROM teammate WHERE id = ?`, [teammateId]);
        const guardrails: string[] = JSON.parse((tm?.guardrails as string) || "[]");
        const before = guardrails.length;
        const removed = guardrails.filter(g => g.toLowerCase().includes(input.rule_text.toLowerCase()));
        const filtered = guardrails.filter(g => !g.toLowerCase().includes(input.rule_text.toLowerCase()));
        if (filtered.length === before) return { result: `No guardrail matched "${input.rule_text}". Current guardrails: ${guardrails.join("; ")}` };
        const current = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [teammateId]);
        const revisionId = uuid();
        await snapshotBeforeUpdate(orgId, "teammate", teammateId, current as any, `Chat: removed guardrail`, "chat");
        await run(`UPDATE teammate SET guardrails = ? WHERE id = ?`, [JSON.stringify(filtered), teammateId]);
        return {
          result: `Removed ${before - filtered.length} guardrail(s). ${filtered.length} remaining.`,
          change: {
            type: "guardrail_removed",
            label: "Removed guardrail",
            detail: removed.join(", "),
            revision_id: revisionId,
          },
        };
      }

      case "add_voice_example": {
        const tm = await queryOne(`SELECT voice_examples FROM teammate WHERE id = ?`, [teammateId]);
        const examples: string[] = JSON.parse((tm?.voice_examples as string) || "[]");
        examples.push(input.example);
        const current = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [teammateId]);
        const revisionId = uuid();
        await snapshotBeforeUpdate(orgId, "teammate", teammateId, current as any, `Chat: added voice example`, "chat");
        await run(`UPDATE teammate SET voice_examples = ? WHERE id = ?`, [JSON.stringify(examples), teammateId]);
        return {
          result: `Added voice example. Now have ${examples.length} example(s).`,
          change: {
            type: "voice_added",
            label: "Added voice example",
            detail: `"${input.example}"`,
            revision_id: revisionId,
          },
        };
      }

      case "remove_voice_example": {
        const tm = await queryOne(`SELECT voice_examples FROM teammate WHERE id = ?`, [teammateId]);
        const examples: string[] = JSON.parse((tm?.voice_examples as string) || "[]");
        const before = examples.length;
        const filtered = examples.filter(e => !e.toLowerCase().includes(input.example_text.toLowerCase()));
        if (filtered.length === before) return { result: `No voice example matched "${input.example_text}".` };
        const current = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [teammateId]);
        const revisionId = uuid();
        await snapshotBeforeUpdate(orgId, "teammate", teammateId, current as any, `Chat: removed voice example`, "chat");
        await run(`UPDATE teammate SET voice_examples = ? WHERE id = ?`, [JSON.stringify(filtered), teammateId]);
        return {
          result: `Removed ${before - filtered.length} voice example(s).`,
          change: {
            type: "voice_removed",
            label: "Removed voice example",
            detail: input.example_text,
            revision_id: revisionId,
          },
        };
      }

      case "update_sequence": {
        const seq = await queryOne(`SELECT * FROM sequences WHERE template_key = ?`, [input.template_key]);
        if (!seq) return { result: `Sequence "${input.template_key}" not found.` };
        const oldTouches = (seq.touches as string) || "[]";
        await run(`UPDATE sequences SET touches = ? WHERE id = ?`, [input.touches, seq.id]);
        return {
          result: `Updated ${input.template_key} sequence touches.`,
          change: {
            type: "sequence_updated",
            label: `Updated ${(seq.name as string) || input.template_key} sequence`,
            detail: `${JSON.parse(input.touches).length} touches`,
            before: oldTouches,
            after: input.touches,
          },
        };
      }

      case "update_sequence_timing": {
        const seq = await queryOne(`SELECT * FROM sequences WHERE template_key = ?`, [input.template_key]);
        if (!seq) return { result: `Sequence "${input.template_key}" not found.` };
        const touches = JSON.parse((seq.touches as string) || "[]");
        const oldOffsets = touches.map((t: any) => t.day_offset);
        const offsets = JSON.parse(input.day_offsets);
        for (let i = 0; i < Math.min(touches.length, offsets.length); i++) {
          touches[i].day_offset = offsets[i];
        }
        await run(`UPDATE sequences SET touches = ? WHERE id = ?`, [JSON.stringify(touches), seq.id]);
        return {
          result: `Updated timing for ${input.template_key}: ${offsets.join(", ")} days.`,
          change: {
            type: "timing_updated",
            label: `Updated ${(seq.name as string) || input.template_key} timing`,
            detail: `Day ${offsets.join(" → ")}`,
            before: `Day ${oldOffsets.join(" → ")}`,
            after: `Day ${offsets.join(" → ")}`,
          },
        };
      }

      case "set_context_override": {
        const existing = await queryOne(
          `SELECT id FROM context_overrides WHERE org_id = ? AND scope_type = ? AND scope_id = ?`,
          [orgId, input.scope_type, input.scope_id]
        );
        if (existing) {
          const sets: string[] = [];
          const vals: unknown[] = [];
          if (input.persona_additions) { sets.push("persona_additions = ?"); vals.push(input.persona_additions); }
          if (input.instruction_additions) { sets.push("instruction_additions = ?"); vals.push(input.instruction_additions); }
          if (sets.length > 0) {
            vals.push(existing.id);
            await run(`UPDATE context_overrides SET ${sets.join(", ")} WHERE id = ?`, vals);
          }
          return {
            result: `Updated ${input.scope_type} override for "${input.scope_id}".`,
            change: {
              type: "override_set",
              label: `Updated ${input.scope_type} behavior`,
              detail: `${input.scope_id}: ${input.instruction_additions || input.persona_additions || ""}`,
            },
          };
        } else {
          const id = uuid();
          await run(
            `INSERT INTO context_overrides (id, org_id, scope_type, scope_id, persona_additions, instruction_additions) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, orgId, input.scope_type, input.scope_id, input.persona_additions || "", input.instruction_additions || ""]
          );
          return {
            result: `Created ${input.scope_type} override for "${input.scope_id}".`,
            change: {
              type: "override_set",
              label: `Set ${input.scope_type} behavior`,
              detail: `${input.scope_id}: ${input.instruction_additions || input.persona_additions || ""}`,
            },
          };
        }
      }

      case "set_escalation_contact": {
        const contact = { name: input.name, email: input.email, phone: input.phone || "" };
        const current = await queryOne(`SELECT * FROM teammate WHERE id = ?`, [teammateId]);
        const revisionId = uuid();
        await snapshotBeforeUpdate(orgId, "teammate", teammateId, current as any, `Chat: updated escalation contact`, "chat");
        await run(`UPDATE teammate SET escalation_contact = ? WHERE id = ?`, [JSON.stringify(contact), teammateId]);
        return {
          result: `Escalation contact set to ${input.name} (${input.email}).`,
          change: {
            type: "escalation_updated",
            label: "Updated escalation contact",
            detail: `${input.name} (${input.email})`,
            revision_id: revisionId,
          },
        };
      }

      default:
        return { result: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    return { result: `Error: ${err.message}` };
  }
}

// ── Main chat handler ──

export async function handleConfigChat(
  orgId: string,
  message: string,
  conversationHistory: ChatMessage[],
): Promise<ChatResult> {
  const teammate = await queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
  if (!teammate) throw new Error("No teammate configured");

  const teammateId = teammate.id as string;
  const changes: ConfigChange[] = [];

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const systemPrompt = `You are Sammy, the user's AI sales teammate. They're talking to you to adjust how you work.

You have tools to read and change your own configuration. ALWAYS read the current config first before making changes, so you know what exists and can give accurate before/after context.

Current quick summary:
- Goal: ${teammate.goal || "(not set)"}
- Primary channel: ${teammate.primary_channel}
- Status: ${teammate.status}

How to respond:
- Be conversational, warm, and brief. You're a teammate, not a settings page.
- When you make a change, confirm what you did in plain language. Show before → after when helpful.
- If the user's request is ambiguous, ask a clarifying question instead of guessing.
- If they ask something you can't change via tools, tell them honestly.
- Never use markdown formatting, bullet points, or numbered lists. Talk like a person.
- If they're just chatting or asking how you work, answer without calling tools.`;

  let loopCount = 0;
  const maxLoops = 8;
  let lastTextResponse = "";

  while (loopCount < maxLoops) {
    loopCount++;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      tools: configTools,
      messages,
    });

    const toolUseBlocks = response.content.filter(b => b.type === "tool_use");
    const textBlocks = response.content.filter(b => b.type === "text");

    if (textBlocks.length > 0) {
      lastTextResponse = (textBlocks[0] as Anthropic.TextBlock).text;
    }

    if (toolUseBlocks.length === 0) break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      if (block.type !== "tool_use") continue;
      const { result, change } = await executeConfigTool(orgId, teammateId, block.name, block.input as Record<string, string>);

      if (change) changes.push(change);

      toolResults.push({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    if (response.stop_reason === "end_turn") break;
  }

  // Build flow preview if changes were made
  const flowPreview = changes.length > 0 ? await buildFlowPreview(orgId) : null;

  return { response: lastTextResponse, changes, flowPreview };
}
