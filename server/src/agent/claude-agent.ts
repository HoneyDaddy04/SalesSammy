import { AgentInterface, ResearchContext, DraftResult } from "./interface.js";
import { getContactHistory, searchKnowledgeBase, searchWeb, checkLinkedIn, pullEmailHistory } from "./tools.js";
import { getContactMemories, getPatternInsights, saveContactMemory, extractAndStoreMemories } from "./memory.js";
import { queryOne, queryAll } from "../db/database.js";
import { mergeContext } from "../services/context-merger.js";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// ── Tool definitions for Claude tool-calling ──
// Claude sees these and decides which ones to call during research.

const researchTools: Anthropic.Tool[] = [
  {
    name: "get_conversation_history",
    description: "Get all previous messages sent to and received from this contact across ALL channels (email, WhatsApp, LinkedIn, SMS, etc.). Returns chronological thread with channel info.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "The contact's ID" },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "search_knowledge_base",
    description: "Search the business knowledge base for product info, pricing, FAQs, policies, competitive positioning, or objection handling relevant to a query.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "What to search for (e.g. 'pricing for teams', 'migration from Jira', 'free trial details')" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_web",
    description: "Search the web for recent news, funding announcements, job postings, or other public information about a company or person. Use this to find fresh context for personalization.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "What to search for (e.g. 'Acme Corp funding announcement', 'Sarah Chen LinkedIn')" },
      },
      required: ["query"],
    },
  },
  {
    name: "check_linkedin",
    description: "Check a person's LinkedIn profile for recent posts, job changes, or activity that could be relevant for outreach.",
    input_schema: {
      type: "object" as const,
      properties: {
        linkedin_url: { type: "string", description: "The LinkedIn profile URL" },
      },
      required: ["linkedin_url"],
    },
  },
  {
    name: "get_contact_memories",
    description: "Get everything Sammy remembers about this contact from previous interactions: facts, interests, objections, preferences, and insights.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "The contact's ID" },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "get_pattern_insights",
    description: "Get cross-contact learnings: which angles, channels, and approaches work best for this business's leads.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "pull_channel_history",
    description: "Pull previous conversation history from a specific external channel (Gmail threads, WhatsApp messages, etc.) for context from BEFORE the contact entered the system.",
    input_schema: {
      type: "object" as const,
      properties: {
        channel: { type: "string", description: "Channel type: email, whatsapp, linkedin, sms, telegram, facebook, instagram" },
        contact_identifier: { type: "string", description: "Email address, phone number, or profile URL depending on channel" },
      },
      required: ["channel", "contact_identifier"],
    },
  },
  {
    name: "save_memory",
    description: "Save a new fact, interest, objection, or insight about a contact for future reference. Use this when you learn something important.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: { type: "string", description: "The contact's ID" },
        memory_type: { type: "string", enum: ["fact", "interest", "objection", "preference", "insight"], description: "Type of memory" },
        content: { type: "string", description: "The memory content" },
      },
      required: ["contact_id", "memory_type", "content"],
    },
  },
];

// ── Execute a tool call from Claude ──

async function executeTool(orgId: string, name: string, input: Record<string, string>): Promise<string> {
  try {
    switch (name) {
      case "get_conversation_history": {
        const history = await getContactHistory(input.contact_id);
        if (history.length === 0) return "No previous messages with this contact.";
        return history.map(m => `[${m.role.toUpperCase()} via ${m.channel}, ${m.date || "unknown date"}] ${m.content}`).join("\n\n");
      }
      case "search_knowledge_base": {
        const hits = await searchKnowledgeBase(orgId, input.query);
        if (hits.length === 0) return "No relevant knowledge base entries found.";
        return hits.join("\n\n");
      }
      case "search_web": {
        // Stub for now. Returns empty but the tool-calling architecture is real.
        // Replace with SerpAPI/Brave/Tavily integration.
        return "Web search not yet connected. No external results available.";
      }
      case "check_linkedin": {
        // Stub. Replace with Proxycurl/PhantomBuster integration.
        return "LinkedIn lookup not yet connected. No profile data available.";
      }
      case "get_contact_memories": {
        const memories = await getContactMemories(orgId, input.contact_id);
        if (memories.length === 0) return "No stored memories about this contact yet.";
        return memories.join("\n");
      }
      case "get_pattern_insights": {
        const insights = await getPatternInsights(orgId);
        if (insights.length === 0) return "No pattern insights available yet. Keep sending and Sammy will learn.";
        return insights.join("\n");
      }
      case "pull_channel_history": {
        // Stub. Replace with actual channel API integration.
        return `Channel history pull for ${input.channel} not yet connected. Use get_conversation_history for messages sent/received through Sammy.`;
      }
      case "save_memory": {
        await saveContactMemory(orgId, input.contact_id, input.memory_type, input.content);
        return `Memory saved: [${input.memory_type}] ${input.content}`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Tool error: ${err.message}`;
  }
}

// ── The Agent ──

export class ClaudeAgent implements AgentInterface {

  /**
   * Research a contact using Claude-driven tool calling.
   * Claude decides which tools to call based on what it knows about the contact.
   */
  async research(orgId: string, contactId: string): Promise<ResearchContext> {
    const contact = await queryOne(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
    if (!contact) throw new Error(`Contact ${contactId} not found`);

    const metadata = JSON.parse((contact.metadata as string) || "{}");
    const contactSummary = [
      `${contact.name}`,
      contact.role || metadata.role ? `is ${contact.role || metadata.role}` : null,
      contact.company ? `at ${contact.company}` : null,
      contact.industry ? `(${contact.industry})` : null,
      metadata.recent_signal ? `Recent signal: ${metadata.recent_signal}.` : null,
      metadata.team_size ? `Team size: ${metadata.team_size}.` : null,
      contact.lead_score ? `Lead score: ${contact.lead_score}.` : null,
      contact.status ? `Status: ${contact.status}.` : null,
    ].filter(Boolean).join(" ");

    // Let Claude drive the research via tool calling
    const messages: Anthropic.MessageParam[] = [{
      role: "user",
      content: `You are researching a contact before drafting a sales message. Here's what you know:

${contactSummary}

Contact ID: ${contactId}
Email: ${contact.email || "unknown"}
Phone: ${contact.phone || "unknown"}
LinkedIn: ${contact.linkedin || "unknown"}
Company: ${contact.company || "unknown"}

Use the tools available to gather context. At minimum:
1. Check conversation history (what have we already said to them?)
2. Check what we remember about them
3. Search the knowledge base for relevant product info
4. Check for any pattern insights

If they have a LinkedIn URL, check it. If they have a company name, search for recent news.

After gathering context, respond with a brief research summary.`,
    }];

    // Collect research results
    const collectedHistory: ResearchContext["previousMessages"] = [];
    const collectedWeb: string[] = [];
    const collectedKB: string[] = [];
    const collectedPatterns: string[] = [];
    const collectedMemory: string[] = [];

    // Agent loop: Claude calls tools, we execute, feed results back
    let loopCount = 0;
    const maxLoops = 5; // Safety limit

    while (loopCount < maxLoops) {
      loopCount++;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: "You are Sammy's research engine. Use the available tools to gather context about a contact before a sales message is drafted. Be thorough but efficient. Call tools to get real data, don't guess.",
        tools: researchTools,
        messages,
      });

      // Check if Claude wants to use tools
      const toolUseBlocks = response.content.filter(b => b.type === "tool_use");

      if (toolUseBlocks.length === 0) {
        // Claude is done researching, gave us a text summary
        break;
      }

      // Execute each tool call
      const toolResultContent: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;
        const result = await executeTool(orgId, block.name, block.input as Record<string, string>);

        // Collect results into the appropriate buckets
        switch (block.name) {
          case "get_conversation_history":
            (await getContactHistory(contactId)).forEach(m => {
              collectedHistory.push({
                role: m.role as "sent" | "received",
                content: m.content,
                channel: m.channel,
                date: m.date,
              });
            });
            break;
          case "search_knowledge_base":
            collectedKB.push(result);
            break;
          case "search_web":
          case "check_linkedin":
          case "pull_channel_history":
            if (result && !result.includes("not yet connected")) collectedWeb.push(result);
            break;
          case "get_contact_memories":
            collectedMemory.push(...await getContactMemories(orgId, contactId));
            break;
          case "get_pattern_insights":
            collectedPatterns.push(...await getPatternInsights(orgId));
            break;
        }

        toolResultContent.push({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: result,
        });
      }

      const toolResults: Anthropic.MessageParam = {
        role: "user",
        content: toolResultContent,
      };

      // Add Claude's response and tool results to messages for next loop
      messages.push({ role: "assistant", content: response.content });
      messages.push(toolResults);

      // If Claude signaled stop
      if (response.stop_reason === "end_turn") break;
    }

    return {
      contactSummary,
      previousMessages: collectedHistory,
      webInsights: collectedWeb,
      knowledgeBaseHits: collectedKB,
      patternInsights: collectedPatterns,
      contactMemory: collectedMemory,
    };
  }

  /**
   * Draft a message using the research context.
   * Single Claude call with rich context (not tool-calling for drafting).
   */
  async draft(orgId: string, contactId: string, context: ResearchContext, angle: string, channel: string, touchIndex: number): Promise<DraftResult> {
    const teammate = await queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
    if (!teammate) throw new Error("No teammate configured");

    const contact = await queryOne(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
    if (!contact) throw new Error(`Contact ${contactId} not found`);

    const sequenceId = contact.sequence_id as string | null;
    const contactTags: string[] = (() => { try { return JSON.parse(contact.tags as string); } catch { return []; } })();

    const merged = await mergeContext(
      orgId,
      teammate.persona_prompt as string,
      (teammate.operating_instructions as string) || "",
      JSON.parse((teammate.voice_examples as string) || "[]"),
      sequenceId,
      channel,
      contactTags
    );

    const voiceBlock = merged.voiceExamples.length > 0
      ? `\n\nMatch this voice (real messages that worked):\n${merged.voiceExamples.map((v: string, i: number) => `${i + 1}. "${v}"`).join("\n")}`
      : "";

    const memoryBlock = context.contactMemory.length > 0
      ? `\n\nWhat you remember about ${contact.name}:\n${context.contactMemory.join("\n")}`
      : "";

    const historyBlock = context.previousMessages.length > 0
      ? `\n\nConversation so far:\n${context.previousMessages.map(m => `[${m.role.toUpperCase()} via ${m.channel}] ${m.content}`).join("\n")}`
      : "";

    const knowledgeBlock = context.knowledgeBaseHits.length > 0
      ? `\n\nProduct knowledge:\n${context.knowledgeBaseHits.join("\n")}`
      : "";

    const patternBlock = context.patternInsights.length > 0
      ? `\n\nWhat's working:\n${context.patternInsights.join("\n")}`
      : "";

    const webBlock = context.webInsights.length > 0
      ? `\n\nFresh intel:\n${context.webInsights.join("\n")}`
      : "";

    const researchContext = `${context.contactSummary} Touch ${touchIndex + 1}.${historyBlock}${memoryBlock}${knowledgeBlock}${patternBlock}${webBlock}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: `${merged.persona}${voiceBlock}${merged.instructions ? `\n\nOperating instructions:\n${merged.instructions}` : ""}${memoryBlock}${historyBlock}${knowledgeBlock}${patternBlock}${webBlock}

Rules:
- Write like a real person. Short, warm, direct.
- No bullet points, no markdown, no formatting.
- Max 3-4 sentences.
- Reference something SPECIFIC about the contact (a recent event, their role, something they said).
- NEVER repeat something you already said in a previous message.
- Match the angle: ${angle.replace(/_/g, " ")}.
- Channel: ${channel}. Adjust tone/length accordingly (WhatsApp = shorter, email = slightly longer).
- End with a low-pressure question or clear next step.`,
      messages: [{
        role: "user",
        content: `Draft touch ${touchIndex + 1} for ${contact.name} (${contact.email || contact.phone}).
Angle: ${angle}
Context: ${context.contactSummary}
Goal: ${teammate.goal}`,
      }],
    });

    const draftedContent = (response.content[0] as Anthropic.TextBlock).text;

    // Auto-extract and store memories from this interaction
    await extractAndStoreMemories(orgId, contactId, draftedContent, "sent");

    return {
      content: draftedContent,
      researchContext,
      channel,
    };
  }

  /**
   * Classify an inbound reply using Claude tool-calling for ambiguous cases.
   * Tries rule-based first, falls back to Claude for uncertain messages.
   */
  async classifyReply(orgId: string, replyContent: string, contactId: string): Promise<{ classification: string; routedAction: string }> {
    const content = replyContent.toLowerCase();

    // ── Fast rule-based classification for clear-cut cases ──
    const optOutWords = ["unsubscribe", "stop", "remove me", "opt out", "opt-out"];
    const hostileWords = ["scam", "spam", "fuck off", "f*** off", "fuck you", "report you", "lawsuit", "legal action"];

    if (optOutWords.some(w => content.includes(w))) {
      await extractAndStoreMemories(orgId, contactId, replyContent, "received");
      return { classification: "negative", routedAction: "opt_out" };
    }
    if (hostileWords.some(w => content.includes(w))) {
      await extractAndStoreMemories(orgId, contactId, replyContent, "received");
      return { classification: "hostile", routedAction: "escalate" };
    }

    // ── Guardrail check (always runs) ──
    const teammate = await queryOne(`SELECT guardrails, escalation_contact FROM teammate WHERE org_id = ?`, [orgId]);
    if (teammate) {
      const guardrails: string[] = (() => { try { return JSON.parse(teammate.guardrails as string || "[]"); } catch { return []; } })();
      for (const rule of guardrails) {
        const lower = rule.toLowerCase();
        if (lower.includes("escalate")) {
          const words = lower.replace(/escalate\s*(if\s*)?(they\s*)?(mention\s*)?/i, "").split(/[\s,]+/).filter(w => w.length > 2);
          if (words.some(w => content.includes(w))) {
            await extractAndStoreMemories(orgId, contactId, replyContent, "received");
            return { classification: "escalated_guardrail", routedAction: "escalate" };
          }
        }
      }
    }

    // ── For everything else, use Claude with memory context ──
    const memories = await getContactMemories(orgId, contactId);
    const history = await getContactHistory(contactId);

    const memoryContext = memories.length > 0
      ? `\nMemories about this contact:\n${memories.join("\n")}`
      : "";
    const historyContext = history.length > 0
      ? `\nRecent conversation:\n${history.slice(-4).map(m => `[${m.role}] ${m.content}`).join("\n")}`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      system: `You are a reply classifier for a sales agent. Classify this reply into exactly one category and action.

Categories: positive, question, objection, negative
Actions: draft_response (for positive/question/objection), escalate (for things requiring human), opt_out (for unsubscribe requests)
${memoryContext}${historyContext}

Respond with ONLY two words: the classification and the action, separated by a space. Example: "positive draft_response" or "objection draft_response"`,
      messages: [{
        role: "user",
        content: replyContent,
      }],
    });

    const result = (response.content[0] as Anthropic.TextBlock).text.trim().toLowerCase();
    const parts = result.split(/\s+/);
    const classification = parts[0] || "question";
    const routedAction = parts[1] || "draft_response";

    // Store memory from the reply
    await extractAndStoreMemories(orgId, contactId, replyContent, "received");

    return { classification, routedAction };
  }

  async saveMemory(orgId: string, contactId: string, key: string, value: string): Promise<void> {
    await saveContactMemory(orgId, contactId, key, value);
  }

  async getMemory(orgId: string, contactId: string): Promise<string[]> {
    return await getContactMemories(orgId, contactId);
  }
}
