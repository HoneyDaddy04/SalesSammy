# Vaigence AI Teammates - Architecture Documentation

Last updated: 2026-04-14

## Overview

Vaigence is a SaaS platform that deploys AI sales agents (starting with "Sales Sammy") to businesses. Sammy handles both inbound lead capture and outbound follow-up across multiple channels, using AI-powered research, memory, and personalized messaging.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)           │
│  Landing Page | Onboarding | Dashboard | Chat Widget │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│                    BACKEND (Express + TypeScript)     │
│  Routes | Job Queue | Channel Plugins | Agent Layer  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               AGENT LAYER (Swappable)                │
│  interface.ts | claude-agent.ts | tools.ts | memory  │
│  (Swap to LangChain, n8n, OpenAI, etc.)             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               DATA (SQLite via sql.js)               │
│  Organizations | Contacts | Sequences | Messages     │
│  Knowledge | Memory | Jobs | Integrations            │
└─────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
server/
  src/
    agent/                  # AI Agent Layer (SWAPPABLE)
      interface.ts          # Contract - any implementation must satisfy this
      claude-agent.ts       # Current implementation (Anthropic Claude)
      tools.ts              # Research tools (web, LinkedIn, email, KB, history)
      memory.ts             # Contact memory + pattern insights
    channels/               # Channel Plugins (send/receive per channel)
      registry.ts           # Plugin registry
      types.ts              # Plugin interface
      email.ts              # Gmail plugin
      whatsapp.ts           # WhatsApp Business plugin
      linkedin.ts           # LinkedIn DM plugin
      sms.ts                # SMS/Twilio plugin
    config/
      env.ts                # Environment configuration
    db/
      database.ts           # SQLite connection + query helpers
      migrate.ts            # Schema migrations
      seed.ts               # Demo data seeder
    routes/                 # Express API routes
      activity.ts           # Activity log
      approvals.ts          # Approval gates (autonomy graduation)
      billing.ts            # Subscription/billing
      contacts.ts           # Lead/contact CRUD
      context-overrides.ts  # Per-segment/channel config overrides
      integrations.ts       # Tool connections (Gmail, HubSpot, etc.)
      jobs.ts               # Job queue status
      knowledge.ts          # Knowledge base CRUD + URL fetch
      onboarding.ts         # Onboarding interview flow
      replies.ts            # Inbound message handling + simulation
      sequences.ts          # Follow-up sequence CRUD
      standup.ts            # Daily standup metrics
      teammate.ts           # Teammate config + chat + workflow config
      touch-queue.ts        # Message approval queue
      trigger.ts            # Scan for due contacts
    services/
      approval-gate.ts      # Approval gate logic
      context-merger.ts     # Merge persona + overrides per context
      job-handlers.ts       # Async job processing (draft, send, classify)
      job-queue.ts          # Job queue polling engine
      vault.ts              # Credential encryption
    index.ts                # Express app entry point

src/                        # Frontend
  components/
    dashboard/              # Dashboard views
      ContactDetailView.tsx # Single contact detail + thread
      DeployView.tsx        # Channel deployment + webhook URLs
      IntegrationsView.tsx  # Connect tools (Gmail, HubSpot, etc.)
      KnowledgeBaseView.tsx # Knowledge base management
      MessagesView.tsx      # Message approval queue
      OverviewView.tsx      # Dashboard home / standup
      SettingsView.tsx      # Account/billing settings
      Sidebar.tsx           # Navigation sidebar (collapsible)
      TeammateChat.tsx      # Chat with Sammy (floating popup)
      TeammateDetailView.tsx# Sammy profile + config
      ThreadsView.tsx       # Leads list + filters
      WorkflowsView.tsx     # Workflow config + sequence templates
    onboarding/
      InterviewChat.tsx     # Chat-based onboarding
    ui/                     # Shared UI components
      brand-icons.tsx       # SVG brand logos for integrations
      skeleton.tsx          # Loading skeleton components
      sonner.tsx            # Toast notifications
      ...                   # shadcn/ui components
  data/
    agents.ts               # Mock agent data (legacy, for reference)
  lib/
    constants.ts            # Shared constants (API_BASE, ORG_KEY, status configs)
    utils.ts                # Utility functions
  pages/
    Index.tsx               # Dashboard layout + routing
    Landing.tsx             # Marketing landing page
    Login.tsx               # Login/demo access
    Onboarding.tsx          # Multi-step onboarding form
    NotFound.tsx            # 404 page
  services/
    api.ts                  # Frontend API client

public/
  widget.js                 # Embeddable website chat widget (vanilla JS)

docs/
  ARCHITECTURE.md           # This file
  AGENT-LAYER.md            # Agent system documentation
  CHANNELS.md               # Channel integration guide
  MEMORY-SYSTEM.md          # Memory architecture
```

---

## Core Flows

### 1. Inbound Lead Capture

```
Customer messages on WhatsApp/Email/Website/etc.
  → Channel webhook hits POST /api/replies/inbound
  → Match sender to existing contact?
    → YES: Create reply_event, enqueue classify_reply job
    → NO: Log to inbound_messages, enqueue classify_inbound job
      → classify_inbound classifies: new_lead / support / spam
        → new_lead: Create contact, assign sequence, draft response
        → support: Route to team, log activity
        → spam: Filter, log, ignore
```

### 2. Outbound Follow-Up

```
Trigger scan (manual or scheduled)
  → POST /api/trigger/scan
  → Find contacts with next_touch_at <= now
  → For each: enqueue draft_touch job
    → Agent researches contact (history, web, KB, memory)
    → Agent drafts personalized message
    → Insert to touch_queue with status=pending_approval
    → User reviews in Messages view
      → Approve: enqueue send_touch job, advance contact
      → Edit + Approve: update content, track edit_distance, send
      → Reject: skip this touch, try again next scan
```

### 3. Reply Handling

```
Reply received (from existing contact)
  → classify_reply job
  → Agent classifies: positive / question / objection / hostile / opt-out
  → Check guardrails for forced escalation
  → Route:
    → positive/question: draft_reply job → pending approval
    → objection: draft_reply with objection handling
    → hostile/opt-out: escalate to owner, update contact status
```

### 4. Onboarding

```
User starts onboarding
  → 10-step form OR chat interview
  → Captures: business description, audience, triggers, goal,
    lead sources, channels, voice samples, guardrails, escalation contact
  → Claude generates persona prompt from answers
  → Creates: organization, teammate, default sequences
  → User enters dashboard
```

---

## Agent Layer (Swappable)

See [AGENT-LAYER.md](./AGENT-LAYER.md) for full documentation.

### Interface Contract

Any agent implementation must satisfy:

```typescript
interface AgentInterface {
  research(orgId, contactId) → ResearchContext
  draft(orgId, contactId, context, angle, channel, touchIndex) → DraftResult
  classifyReply(orgId, replyContent, contactId) → { classification, routedAction }
  saveMemory(orgId, contactId, key, value) → void
  getMemory(orgId, contactId) → string[]
}
```

### Swapping Implementations

To swap from Claude to another provider:

1. Create a new file: `server/src/agent/YOUR-agent.ts`
2. Implement `AgentInterface`
3. Update `server/src/agent/interface.ts` factory function:
   ```typescript
   export function createAgent(): AgentInterface {
     // Change this line:
     const { YourAgent } = require("./YOUR-agent.js");
     return new YourAgent();
   }
   ```
4. No other files need to change.

### Supported swap targets:
- **LangChain**: Install langchain, create langchain-agent.ts with tool definitions
- **n8n**: Create n8n-agent.ts that POSTs to your n8n webhook URL
- **OpenAI**: Create openai-agent.ts with OpenAI SDK
- **CrewAI**: Create crewai-agent.ts for multi-agent setups
- **Custom**: Any HTTP endpoint that accepts the interface contract

---

## Channel System

See [CHANNELS.md](./CHANNELS.md) for full documentation.

### Channel Plugin Interface

```typescript
interface ChannelPlugin {
  name: string;
  channelType: string;
  connect(credentials): Promise<void>;
  disconnect(): Promise<void>;
  send(to, content, metadata?): Promise<SendResult>;
  testConnection(): Promise<{ ok: boolean }>;
  isConnected(): boolean;
}
```

### Current Channel Status

| Channel | Send | Receive | Status |
|---------|------|---------|--------|
| Email (Gmail) | Stub (logs to console) | Via /api/replies/inbound webhook | Plugin exists |
| WhatsApp | Stub | Via /api/replies/inbound webhook | Plugin exists |
| LinkedIn DM | Stub | Via /api/replies/inbound webhook | Plugin exists |
| SMS (Twilio) | Stub | Via /api/replies/inbound webhook | Plugin exists |
| Website Chat | N/A | Via widget.js → /api/replies/inbound | Widget exists |
| Telegram | Not built | Via /api/replies/inbound webhook | Planned |
| Facebook DMs | Not built | Via /api/replies/inbound webhook | Planned |
| Instagram DMs | Not built | Via /api/replies/inbound webhook | Planned |

### Adding a New Channel

1. Create `server/src/channels/your-channel.ts` implementing `ChannelPlugin`
2. Register in `server/src/index.ts`: `registerChannel(new YourPlugin())`
3. Add to integrations catalog in `src/components/dashboard/IntegrationsView.tsx`
4. Add inbound webhook handling (all channels use the same /api/replies/inbound endpoint)

---

## Memory System

See [MEMORY-SYSTEM.md](./MEMORY-SYSTEM.md) for full documentation.

### Tables

**contact_memory** - Per-contact facts and learnings
- memory_type: fact, interest, objection, preference, interaction, insight
- Example: "Asked about pricing", "Team size: 12", "Using competitor X"

**pattern_insights** - Cross-contact learnings per org
- insight_type: angle_performance, channel_performance, industry_pattern, etc.
- Example: "trigger_event angle gets 3x more replies for SaaS companies"

### Memory Flow

```
Message sent or received
  → extractAndStoreMemories() auto-extracts key facts
  → Stored in contact_memory

Before drafting next message
  → agent.research() pulls:
    - All contact_memory for this person
    - All pattern_insights for this org
    - Full conversation history
  → Fed to Claude as context

Over time
  → Pattern insights accumulate from successful/failed touches
  → Each contact builds a rich profile
  → Sammy gets smarter per customer (org)
```

---

## Database Schema

### Core Tables
- **organizations** - Customer accounts
- **teammate** - AI agent config per org (persona, voice, guardrails)
- **contacts** - Leads/customers with full profile
- **sequences** - Follow-up sequence templates
- **touch_queue** - Drafted/sent messages (the approval queue)
- **reply_events** - Inbound replies from contacts
- **inbound_messages** - Raw inbound from unknown senders

### Memory Tables
- **contact_memory** - Per-contact facts and learnings
- **pattern_insights** - Cross-contact patterns per org

### Supporting Tables
- **activity_log** - Audit trail of all actions
- **knowledge_chunks** - Knowledge base entries
- **integrations** - Connected tools + credentials
- **subscriptions** - Billing plans
- **job_queue** - Async job processing
- **approval_gates** - Sensitive operations requiring approval
- **config_revisions** - Version history for teammate config
- **context_overrides** - Per-segment/channel config overrides
- **conversations / messages** - Chat with Sammy
- **onboarding_sessions** - Onboarding state

---

## Multi-Tenant Design

Everything is scoped by `org_id`:
- Each customer gets their own teammate config, contacts, memory, sequences
- No data crosses org boundaries
- Same code, different data per customer
- The agent uses org_id to pull the right persona, knowledge, and memory

---

## Environment Variables

```
ANTHROPIC_API_KEY=     # Claude API key
PORT=3001              # Server port
VITE_API_URL=          # Frontend API base URL (defaults to http://localhost:3001)
ENCRYPTION_KEY=        # For credential vault (integrations)
```

---

## Running Locally

```bash
# Backend
cd server
npm install
npm run db:seed        # Create demo data
npm run dev            # Start server on :3001

# Frontend
npm install
npm run dev            # Start Vite on :8080

# Access
# Landing: http://localhost:8080
# Dashboard: http://localhost:8080/dashboard (auto-detects demo org)
```

---

## Key Design Decisions

1. **SQLite over Postgres**: Fast to develop, single-file DB. Swap to Postgres for production scale.
2. **Job queue over real-time**: AI calls are slow (2-5s). Job queue processes async, user sees results on next refresh.
3. **Approval workflow**: Sammy starts in "shadow mode" where every message needs human approval. Builds trust before autonomy.
4. **Channel-agnostic inbound**: All channels feed into the same /api/replies/inbound endpoint. Classification and routing is channel-agnostic.
5. **Agent interface pattern**: AI logic is behind an interface so the underlying model/framework can be swapped without touching business logic.
