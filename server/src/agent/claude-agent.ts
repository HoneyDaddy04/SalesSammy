import { AgentInterface, ResearchContext, DraftResult } from "./interface.js";
import { getContactHistory, searchKnowledgeBase, searchWeb, checkLinkedIn } from "./tools.js";
import { getContactMemories, getPatternInsights, saveContactMemory, extractAndStoreMemories } from "./memory.js";
import { queryOne, queryAll } from "../db/database.js";
import { mergeContext } from "../services/context-merger.js";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

export class ClaudeAgent implements AgentInterface {

  async research(orgId: string, contactId: string): Promise<ResearchContext> {
    const contact = queryOne(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
    if (!contact) throw new Error(`Contact ${contactId} not found`);

    const metadata = JSON.parse((contact.metadata as string) || "{}");

    // Build contact summary
    const contactSummary = `${contact.name} is ${metadata.role || contact.role || "a contact"} at ${contact.company || "unknown company"}. ${metadata.recent_signal ? `Recent signal: ${metadata.recent_signal}.` : ""} ${metadata.team_size ? `Team size: ${metadata.team_size}.` : ""}`;

    // Get conversation history
    const previousMessages = getContactHistory(contactId).map(m => ({
      role: m.role as "sent" | "received",
      content: m.content,
      channel: m.channel,
      date: m.date,
    }));

    // Search knowledge base with company/role context
    const searchQuery = [contact.company, contact.role, contact.industry].filter(Boolean).join(" ");
    const knowledgeBaseHits = searchKnowledgeBase(orgId, searchQuery || "general");

    // Web search (stub)
    const webInsights = await searchWeb((contact.company as string) || "");

    // LinkedIn check (stub)
    const linkedinInsights = await checkLinkedIn(contact.linkedin as string | null);
    const allWebInsights = [...webInsights, ...linkedinInsights];

    // Contact memory
    const contactMemory = getContactMemories(orgId, contactId);

    // Pattern insights
    const patternInsights = getPatternInsights(orgId);

    return {
      contactSummary,
      previousMessages,
      webInsights: allWebInsights,
      knowledgeBaseHits,
      patternInsights,
      contactMemory,
    };
  }

  async draft(orgId: string, contactId: string, context: ResearchContext, angle: string, channel: string, touchIndex: number): Promise<DraftResult> {
    const teammate = queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
    if (!teammate) throw new Error("No teammate configured");

    const contact = queryOne(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
    if (!contact) throw new Error(`Contact ${contactId} not found`);

    // Get sequence info for context merging
    const sequenceId = contact.sequence_id as string | null;
    const contactTags: string[] = (() => { try { return JSON.parse(contact.tags as string); } catch { return []; } })();

    const merged = mergeContext(
      orgId,
      teammate.persona_prompt as string,
      (teammate.operating_instructions as string) || "",
      JSON.parse((teammate.voice_examples as string) || "[]"),
      sequenceId,
      channel,
      contactTags
    );

    const voiceBlock = merged.voiceExamples.length > 0
      ? `\n\nHere are examples of messages the user has sent that got good responses - match this voice:\n${merged.voiceExamples.map((v: string, i: number) => `${i + 1}. "${v}"`).join("\n")}`
      : "";

    // Build memory/research block for the system prompt
    const memoryBlock = context.contactMemory.length > 0
      ? `\n\nWhat you remember about this contact:\n${context.contactMemory.join("\n")}`
      : "";

    const historyBlock = context.previousMessages.length > 0
      ? `\n\nConversation history:\n${context.previousMessages.map(m => `[${m.role}/${m.channel}] ${m.content}`).join("\n")}`
      : "";

    const knowledgeBlock = context.knowledgeBaseHits.length > 0
      ? `\n\nRelevant knowledge:\n${context.knowledgeBaseHits.join("\n")}`
      : "";

    const patternBlock = context.patternInsights.length > 0
      ? `\n\nLearned patterns:\n${context.patternInsights.join("\n")}`
      : "";

    const webBlock = context.webInsights.length > 0
      ? `\n\nRecent web insights:\n${context.webInsights.join("\n")}`
      : "";

    const researchContext = `${context.contactSummary} Touch ${touchIndex + 1}.${historyBlock}${memoryBlock}${knowledgeBlock}${patternBlock}${webBlock}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: `${merged.persona}${voiceBlock}${merged.instructions ? `\n\nAdditional instructions from user:\n${merged.instructions}` : ""}${memoryBlock}${historyBlock}${knowledgeBlock}${patternBlock}${webBlock}

Rules:
- Write like a real person. Short, warm, direct.
- No bullet points, no markdown, no formatting.
- Max 3-4 sentences.
- Reference something specific about the contact.
- Match the angle: ${angle.replace(/_/g, " ")}.
- Channel: ${channel}. Adjust length/tone for this channel.
- End with a low-pressure question or next step.`,
      messages: [{
        role: "user",
        content: `Draft touch ${touchIndex + 1} for ${contact.name} (${contact.email}).
Angle: ${angle}
Context: ${context.contactSummary}
Goal: ${teammate.goal}`,
      }],
    });

    const draftedContent = (response.content[0] as Anthropic.TextBlock).text;

    // Store memory from the drafted interaction
    extractAndStoreMemories(orgId, contactId, draftedContent, "sent");

    return {
      content: draftedContent,
      researchContext,
      channel,
    };
  }

  async classifyReply(orgId: string, replyContent: string, contactId: string): Promise<{ classification: string; routedAction: string }> {
    const content = replyContent.toLowerCase();

    // Rule-based classification
    const optOutWords = ["unsubscribe", "stop", "remove me", "opt out", "opt-out"];
    const hostileWords = ["scam", "spam", "fuck off", "f*** off", "fuck you", "report you", "lawsuit", "legal action"];
    const positiveWords = ["interested", "tell me more", "yes", "sounds good", "let's talk", "lets talk", "book", "demo", "pricing", "sign me up", "love to", "would like"];
    const objectionWords = ["not now", "too expensive", "already have", "no thanks", "maybe later", "not interested", "no thank you", "pass", "not for us", "budget"];
    const questionIndicators = ["?", "how", "what", "when", "where", "why", "who", "can you", "could you", "do you", "is there"];

    let classification: string;
    let routedAction: string;

    if (optOutWords.some(w => content.includes(w))) {
      classification = "negative";
      routedAction = "opt_out";
    } else if (hostileWords.some(w => content.includes(w))) {
      classification = "hostile";
      routedAction = "escalate";
    } else if (positiveWords.some(w => content.includes(w))) {
      classification = "positive";
      routedAction = "draft_response";
    } else if (objectionWords.some(w => content.includes(w))) {
      classification = "objection";
      routedAction = "draft_response";
    } else if (questionIndicators.some(w => content.includes(w))) {
      classification = "question";
      routedAction = "draft_response";
    } else {
      // Memory-enhanced classification: check if contact previously showed interest
      const memories = getContactMemories(orgId, contactId);
      const hasPositiveHistory = memories.some(m =>
        m.includes("[interest]") || m.includes("pricing") || m.includes("demo")
      );
      if (hasPositiveHistory) {
        classification = "positive";
        routedAction = "draft_response";
      } else {
        classification = "question";
        routedAction = "draft_response";
      }
    }

    // Guardrail-based escalation check
    const teammate = queryOne(`SELECT guardrails, escalation_contact FROM teammate WHERE org_id = ?`, [orgId]);
    if (teammate) {
      const guardrails: string[] = (() => { try { return JSON.parse(teammate.guardrails as string || "[]"); } catch { return []; } })();
      for (const rule of guardrails) {
        const lower = rule.toLowerCase();
        if (lower.includes("escalate")) {
          const words = lower.replace(/escalate\s*(if\s*)?(they\s*)?(mention\s*)?/i, "").split(/[\s,]+/).filter(w => w.length > 2);
          if (words.some(w => content.includes(w))) {
            classification = "escalated_guardrail";
            routedAction = "escalate";
            const esc = teammate.escalation_contact as string | null;
            if (esc) {
              console.log(`[ESCALATION] Notify ${esc} — guardrail "${rule}" matched for contact ${contactId}`);
            }
            break;
          }
        }
      }
    }

    // Store memory from the reply
    extractAndStoreMemories(orgId, contactId, replyContent, "received");

    return { classification, routedAction };
  }

  async saveMemory(orgId: string, contactId: string, key: string, value: string): Promise<void> {
    saveContactMemory(orgId, contactId, key, value);
  }

  async getMemory(orgId: string, contactId: string): Promise<string[]> {
    return getContactMemories(orgId, contactId);
  }
}
