# Agent Layer Documentation

Last updated: 2026-04-14

## Overview

The agent layer is the AI brain behind Sammy. It handles research, message drafting, reply classification, and memory. It's designed to be **swappable** - you can replace the underlying AI provider without changing any business logic.

---

## Interface Contract

File: `server/src/agent/interface.ts`

```typescript
interface AgentInterface {
  // Research a contact before drafting a message
  research(orgId: string, contactId: string): Promise<ResearchContext>;

  // Draft a message using research context
  draft(orgId: string, contactId: string, context: ResearchContext,
        angle: string, channel: string, touchIndex: number): Promise<DraftResult>;

  // Classify an inbound reply
  classifyReply(orgId: string, replyContent: string,
                contactId: string): Promise<{ classification: string; routedAction: string }>;

  // Save a memory about a contact
  saveMemory(orgId: string, contactId: string, key: string, value: string): Promise<void>;

  // Get all memories for a contact
  getMemory(orgId: string, contactId: string): Promise<string[]>;
}
```

Any implementation that satisfies this interface can power Sammy.

---

## Current Implementation: Claude Agent SDK

File: `server/src/agent/claude-agent.ts`

Uses the Anthropic SDK (`@anthropic-ai/sdk`) with **Claude tool-calling** for intelligent, agent-driven research.

### How Tool-Calling Works

Instead of statically gathering all context and dumping it into a prompt, Claude DRIVES the research:

1. We tell Claude about the contact and give it access to 8 tools
2. Claude decides which tools to call based on what it needs
3. We execute the tools and feed results back
4. Claude may call more tools based on what it learned
5. This loops up to 5 times until Claude has enough context
6. Claude then drafts the message with full context

This means Claude might decide: "This person is at a SaaS company, let me check the knowledge base for pricing... they have a LinkedIn, let me check that... they replied before about Jira, let me search for Jira migration info..."

### Available Tools (8 total)

| Tool | What it does |
|------|-------------|
| `get_conversation_history` | Full message thread across ALL channels |
| `search_knowledge_base` | Search product info, pricing, FAQs |
| `search_web` | Web search for company news (stub, ready for API) |
| `check_linkedin` | LinkedIn profile check (stub, ready for API) |
| `get_contact_memories` | Everything Sammy remembers about this person |
| `get_pattern_insights` | Cross-contact learnings (what works) |
| `pull_channel_history` | External channel history from before Sammy (stub) |
| `save_memory` | Store a new fact/insight about the contact |

### Research Flow (Agent-Driven)

When `research()` is called:

1. Loads contact info from database
2. Sends Claude a prompt: "Research this contact. Here's what you know. Use tools to gather context."
3. **Claude decides which tools to call** (not us)
4. We execute tools, return results to Claude
5. Claude may call more tools based on what it found (up to 5 loops)
6. Claude signals it has enough context
7. All tool results are collected into `ResearchContext`

### Draft Flow

When `draft()` is called:

1. Loads teammate config (persona, voice samples, guardrails, operating instructions)
2. Merges with per-context overrides (segment, sequence, channel specific)
3. Builds a rich system prompt including full research context + memories
4. Single Claude call to draft the message (no tool-calling here, just generation)
5. Rules enforce: no repeats, reference something specific, match angle/channel
6. After drafting, auto-extracts key facts and stores to contact_memory
7. Returns the draft content + research summary

### Classification Flow (Hybrid)

When `classifyReply()` is called:

1. **Fast path (rule-based)**: Opt-out and hostile messages classified instantly, no Claude call
2. **Guardrail check**: Always runs, forces escalation if guardrail keywords match
3. **Claude path (ambiguous)**: For everything else, Claude classifies WITH memory context. If the contact previously showed interest, ambiguous replies lean positive.

---

## Research Tools

File: `server/src/agent/tools.ts`

### getContactHistory(contactId)
Pulls ALL previous messages across ALL channels:
- Sent messages from touch_queue (status='sent')
- Received replies from reply_events
- Sorted chronologically
- Includes channel info so the agent knows what was said on which channel

**Multi-channel support:** This tool pulls from touch_queue and reply_events which both have a `channel` field. Whether the message was sent via email, WhatsApp, LinkedIn, SMS, Telegram, Facebook, or Instagram - they all live in the same tables. The agent sees the full cross-channel conversation.

### searchKnowledgeBase(orgId, query)
Keyword search across knowledge_chunks table. Returns top 5 matching entries with source labels.

**Future:** Replace with vector/semantic search for better relevance.

### searchWeb(companyName)
**Status: STUB** - Logs the search query, returns empty array.

**To implement:** Integrate with one of:
- SerpAPI ($50/mo for 5000 searches)
- Brave Search API (free tier available)
- Google Custom Search ($5/1000 queries)
- Tavily (built for AI agents, $50/mo)

### checkLinkedIn(linkedinUrl)
**Status: STUB** - Returns empty array.

**To implement:** Options:
- LinkedIn API (requires partnership/app approval)
- Proxycurl ($10/100 lookups)
- PhantomBuster (scraping, $56/mo)
- Manual: user pastes LinkedIn profile URL, we store recent data

### pullChannelHistory(orgId, contactId, channel)
Pulls previous conversation history from a specific channel integration.

**Status: STUB for external APIs** - But internal history (from touch_queue + reply_events) works for all channels.

**To implement per channel:**
- **Gmail**: Use Gmail API to search threads with contact's email
- **WhatsApp**: WhatsApp Business API message history
- **Telegram**: Telegram Bot API getUpdates
- **Facebook**: Facebook Graph API conversation threads
- **Instagram**: Instagram Graph API direct messages
- **LinkedIn**: LinkedIn messaging API (limited access)

**Important:** Even without external API integration, the agent already has full conversation history from messages sent/received through Sammy. External API integration adds history from BEFORE the customer started using Vaigence.

---

## Memory System

File: `server/src/agent/memory.ts`

### Contact Memory

Per-contact facts stored in `contact_memory` table:

| Type | Example | When stored |
|------|---------|-------------|
| fact | "Team size: 12 people" | Auto-extracted from messages |
| interest | "Asked about pricing" | Auto-extracted from messages |
| objection | "Budget sensitivity mentioned" | Auto-extracted from messages |
| preference | "Prefers WhatsApp over email" | Auto-extracted from behavior |
| interaction | "Positive reply on touch 3" | After each interaction |
| insight | "Responds better to case studies" | Agent inference |

### Pattern Insights

Cross-contact learnings stored in `pattern_insights` table:

| Type | Example | When stored |
|------|---------|-------------|
| angle_performance | "trigger_event gets 3x replies for SaaS" | After enough data |
| channel_performance | "WhatsApp: 40% response rate vs email: 12%" | After enough data |
| industry_pattern | "Healthcare leads respond to compliance angles" | After enough data |
| time_pattern | "Tuesday 10am gets highest open rates" | After enough data |

### Auto-Extraction

After every message sent or received, `extractAndStoreMemories()` scans for:
- Pricing mentions → store as "interest"
- Team size numbers → store as "fact"
- Competitor mentions → store as "fact"
- Budget concerns → store as "objection"
- Demo/call requests → store as "interest"

---

## Swapping the Agent Implementation

### To LangChain

1. Install: `npm install langchain @langchain/anthropic`
2. Create: `server/src/agent/langchain-agent.ts`
3. Implement `AgentInterface` using LangChain's tool-calling agent
4. Define tools as LangChain `DynamicTool` instances wrapping the functions in tools.ts
5. Update factory in `interface.ts`

### To n8n

1. Create: `server/src/agent/n8n-agent.ts`
2. Implement `AgentInterface` where each method POSTs to an n8n webhook:
   ```typescript
   async research(orgId, contactId) {
     const res = await fetch("https://your-n8n.com/webhook/research", {
       method: "POST",
       body: JSON.stringify({ orgId, contactId })
     });
     return res.json();
   }
   ```
3. Build the research/draft/classify workflows in n8n
4. Update factory in `interface.ts`

### To OpenAI

1. Install: `npm install openai`
2. Create: `server/src/agent/openai-agent.ts`
3. Same pattern as claude-agent.ts but using OpenAI's function calling
4. Update factory

### To a Custom API

1. Create: `server/src/agent/custom-agent.ts`
2. Each method calls your custom endpoint
3. Your endpoint can use any model, any framework, any logic
4. Update factory

---

## Inbound Agent Access

When the agent handles an inbound message (from deploy channels), it has access to:

1. **Full conversation history** across all channels the contact has used
2. **All contact memories** (facts, interests, objections stored from previous interactions)
3. **Pattern insights** (what works for similar contacts)
4. **Knowledge base** (product info, pricing, FAQs)
5. **Teammate config** (persona, voice, guardrails)

This means if a customer first messaged on WhatsApp, then emails, then chats on the website - Sammy remembers the full conversation across all three channels and never repeats or contradicts himself.

---

## Adding New Research Tools

1. Add the function to `server/src/agent/tools.ts`
2. Call it from the agent's `research()` method in `claude-agent.ts`
3. Add the results to `ResearchContext`
4. The draft prompt automatically includes new context

Example: Adding a Crunchbase lookup tool:
```typescript
// In tools.ts
export async function checkCrunchbase(companyName: string): Promise<string[]> {
  const res = await fetch(`https://api.crunchbase.com/v4/...`);
  const data = await res.json();
  return [`Founded: ${data.founded}`, `Funding: ${data.total_funding}`, ...];
}

// In claude-agent.ts research() method
const crunchbaseInsights = await checkCrunchbase(contact.company);
// Add to ResearchContext
```
