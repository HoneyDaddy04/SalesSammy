import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";
import type { WorkTarget, ProposedAction, ChannelType } from "../types/index.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

/**
 * Use Claude to draft a message based on the agent's persona,
 * the research context, and the trigger type.
 */
export async function draftAction(
  persona: string,
  triggerType: string,
  target: WorkTarget,
  researchContext: string,
  availableActions: string[],
  preferredChannels: ChannelType[]
): Promise<ProposedAction> {
  const actionType = pickActionType(triggerType, availableActions);
  const channel = preferredChannels[0] || "email";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `${persona}

You are drafting a proactive outreach message. You're not replying to anyone — you're reaching out first because you noticed something that needs attention.

Rules:
- Write like a real person. Short, warm, direct.
- No bullet points, no markdown, no formatting. Just plain text.
- Max 3-4 sentences. Say one thing well.
- Reference something specific from the research so it doesn't feel generic.
- End with a low-pressure question or next step.
- Don't start with "I hope this finds you well" or any filler.
- Don't sign off with your name — it'll be added automatically.`,
    messages: [
      {
        role: "user",
        content: `Trigger: ${triggerType}
Target: ${target.name} (${target.email}) at ${target.company || "unknown company"}
Target type: ${target.type}
Context: ${JSON.stringify(target.metadata)}

Research:
${researchContext}

Draft a ${actionType.replace("_", " ")} for this ${target.type}. Channel: ${channel}.`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    type: actionType as ProposedAction["type"],
    channel,
    content: text,
  };
}

/**
 * Execute an approved action — actually send the message.
 * In production, this calls real channel APIs.
 */
export async function executeAction(action: ProposedAction, target: WorkTarget): Promise<string> {
  // TODO: Replace with real channel senders
  switch (action.channel) {
    case "email":
      // TODO: SendGrid / Gmail API
      console.log(`[EMAIL] To: ${target.email} | ${action.content.slice(0, 80)}...`);
      return `Email sent to ${target.email}`;

    case "whatsapp":
      // TODO: Twilio / Meta Cloud API
      console.log(`[WHATSAPP] To: ${target.metadata.phone || target.email} | ${action.content.slice(0, 80)}...`);
      return `WhatsApp message sent to ${target.name}`;

    case "slack":
      // TODO: Slack API
      console.log(`[SLACK] To: ${target.name} | ${action.content.slice(0, 80)}...`);
      return `Slack message sent to ${target.name}`;

    case "in_app":
      console.log(`[IN-APP] To: ${target.name} | ${action.content.slice(0, 80)}...`);
      return `In-app notification sent to ${target.name}`;

    default:
      return `Action logged (channel ${action.channel} not yet connected)`;
  }
}

function pickActionType(triggerType: string, available: string[]): string {
  const mapping: Record<string, string> = {
    idle_lead: "send_email",
    no_reply: "send_email",
    deal_stalled: "send_email",
    sla_breach: "send_email",
    stale_ticket: "send_email",
    negative_sentiment: "escalate",
    usage_drop: "send_email",
    inactive_user: "send_email",
    onboarding_stalled: "send_email",
  };

  const preferred = mapping[triggerType] || "send_email";
  // Use preferred if available, otherwise fall back to first available
  if (available.some((a) => a.includes(preferred.split("_").pop()!))) return preferred;
  return "send_email";
}
