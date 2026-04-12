import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuid } from "uuid";
import { queryOne, run } from "../db/database.js";
import { config } from "../config/env.js";
import { getToolSchemas, executeTool } from "./tools.js";
import {
  buildMemoryContext,
  getConversationHistory,
  saveCustomerMemory,
} from "./memory.js";
import type { InboundMessage } from "../types/index.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

/**
 * Core agent engine. Takes an inbound message, runs the agent loop
 * (Claude + tool use + memory), and returns the final response.
 */
export async function runAgent(
  message: InboundMessage
): Promise<{ response: string; conversationId: string }> {
  // 1. Load agent config
  const agent = queryOne(
    `SELECT * FROM agents WHERE id = ? AND org_id = ?`,
    [message.agent_id, message.org_id]
  );

  if (!agent) throw new Error(`Agent ${message.agent_id} not found`);

  const toolNames: string[] = JSON.parse(agent.tools as string);
  const brandVoice = JSON.parse(agent.brand_voice as string);

  // 2. Find or create conversation
  let conversation = queryOne(
    `SELECT id FROM conversations WHERE agent_id = ? AND customer_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1`,
    [message.agent_id, message.customer_id]
  );

  if (!conversation) {
    const convId = uuid();
    run(
      `INSERT INTO conversations (id, org_id, agent_id, channel, customer_id) VALUES (?, ?, ?, ?, ?)`,
      [convId, message.org_id, message.agent_id, message.channel, message.customer_id]
    );
    conversation = { id: convId };
  }

  const conversationId = conversation.id as string;

  // 3. Save the user's message
  run(
    `INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)`,
    [uuid(), conversationId, message.content]
  );

  // 4. Build context: memory + knowledge
  const memoryContext = buildMemoryContext(
    message.org_id,
    message.customer_id,
    message.content
  );

  // 5. Load conversation history
  const history = getConversationHistory(conversationId);
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // 6. Build system prompt
  const humaniseRules = `
## How to communicate
- Write like a real person texting a colleague. Short sentences. No filler.
- Never use bullet lists or markdown formatting in chat. Just talk naturally.
- One idea per message. If you need to cover multiple things, keep each one to a sentence.
- Don't start with "Great question!" or "That's a great point!" — just answer.
- Don't repeat what the customer said back to them. They know what they said.
- Use contractions (you're, we'll, it's). Avoid stiff corporate language.
- If you don't know something, say so in one line. Don't pad it.
- No emojis unless the customer uses them first.
- Max 2-3 short paragraphs per response. If you're writing more, you're writing too much.
- Sound like a helpful human, not an AI assistant reading a script.`;

  const systemPrompt = [
    agent.system_prompt as string,
    humaniseRules,
    `\nGreeting style: "${brandVoice.greeting}"`,
    `Sign-off style: "${brandVoice.signoff}"`,
    `Tone: ${brandVoice.tone}`,
    memoryContext ? `\n---\n${memoryContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // 7. Run Claude with tool use loop
  const toolSchemas = getToolSchemas(toolNames);
  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools: toolSchemas.length > 0 ? toolSchemas : undefined,
  });

  // Tool use loop
  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ContentBlockParam & { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
        b.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(toolUse.name, toolUse.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: toolSchemas.length > 0 ? toolSchemas : undefined,
    });
  }

  // 8. Extract final text response
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  const finalResponse = textBlocks.map((b) => b.text).join("\n");

  // 9. Save assistant message
  run(
    `INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'assistant', ?)`,
    [uuid(), conversationId, finalResponse]
  );

  // 10. Update conversation timestamp
  run(`UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`, [conversationId]);

  // 11. Extract and save customer memory
  extractAndSaveMemory(message.org_id, message.customer_id, message.content, conversationId);

  return { response: finalResponse, conversationId };
}

function extractAndSaveMemory(
  orgId: string,
  customerId: string,
  userMessage: string,
  conversationId: string
): void {
  const patterns = [
    /my name is (.+)/i,
    /i(?:'m| am) (?:the |a )?(.+?) (?:at|of|for)/i,
    /i prefer (.+)/i,
    /my email is (.+)/i,
    /our company (?:is called |name is )?(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern);
    if (match) {
      saveCustomerMemory(orgId, customerId, match[0], conversationId);
    }
  }
}
