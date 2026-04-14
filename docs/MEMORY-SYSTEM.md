# Memory System Documentation

Last updated: 2026-04-14

## Overview

Sammy's memory system ensures he never forgets a conversation, learns from every interaction, and gets smarter over time. Memory operates at two levels: per-contact and per-organization.

---

## Memory Types

### Contact Memory (per person)

Stored in `contact_memory` table. Scoped by `org_id` + `contact_id`.

| Type | What it captures | Example |
|------|-----------------|---------|
| **fact** | Objective information about the person/company | "Team size: 12", "Based in Lagos", "Series A funded" |
| **interest** | What they've shown interest in | "Asked about pricing", "Wants a demo", "Interested in API access" |
| **objection** | Concerns or pushback | "Budget sensitivity", "Already using competitor X", "Not the right time" |
| **preference** | Communication preferences | "Responds faster on WhatsApp", "Prefers morning messages" |
| **interaction** | Key interaction events | "Positive reply on touch 3", "Opened email 4 times", "Clicked pricing link" |
| **insight** | Agent-generated observations | "Responds better to case studies than cold stats" |

### Pattern Insights (per organization)

Stored in `pattern_insights` table. Scoped by `org_id`.

| Type | What it captures | Example |
|------|-----------------|---------|
| **angle_performance** | Which message angles get replies | "trigger_event: 23% reply rate, value_add: 8% reply rate" |
| **channel_performance** | Which channels work best | "WhatsApp: 40% response, Email: 12% response" |
| **industry_pattern** | What works for specific industries | "SaaS leads respond to ROI framing, services respond to case studies" |
| **time_pattern** | Best times to send | "Tuesday 10am highest opens, Friday afternoon worst" |
| **sequence_performance** | Which sequences convert best | "Cold Outbound: 6% conversion, Inbound Lead: 18% conversion" |

---

## How Memory Gets Created

### Automatic Extraction

After every message sent or received, `extractAndStoreMemories()` runs and scans for:

```
"How much does it cost?" → interest: "Asked about pricing"
"We have 15 people on our team" → fact: "Team size: 15"
"We're already using Salesforce" → fact: "Using competitor: Salesforce"
"That's too expensive for us" → objection: "Price objection"
"Can we do a demo next week?" → interest: "Wants demo"
"I prefer WhatsApp" → preference: "Prefers WhatsApp"
```

This runs automatically. No manual input needed.

### Agent-Generated Insights

After drafting or classifying, the agent may store observations:
- "This contact responds better to short messages"
- "Positive reply after switching from email to WhatsApp"

### Pattern Aggregation (Planned)

Periodic job that analyzes all contacts/touches to generate org-wide insights:
- "Trigger-event angle outperforms value-add 3:1 this month"
- "Contacts tagged 'funded' convert at 2x the average"

---

## How Memory Gets Used

### Before Drafting a Message

The agent's `research()` method loads:

1. **All contact memories** for this person (capped at 20 most recent)
2. **All pattern insights** for this org (capped at 10)
3. **Full conversation history** across all channels

These are included in the Claude system prompt so the draft is informed by everything Sammy knows.

Example prompt context:
```
MEMORIES ABOUT THIS CONTACT:
[fact] Team size: 12 people
[fact] Recently hired 3 new employees
[interest] Asked about pricing on touch 2
[objection] Said "maybe next quarter" on touch 3
[preference] Responds faster on WhatsApp

WHAT'S WORKING ACROSS YOUR CONTACTS:
[angle_performance] trigger_event gets 3x more replies than value_add
[channel_performance] WhatsApp response rate: 40% vs email: 12%

PREVIOUS CONVERSATION:
[email, Day 0] Sent: "Hey Sarah, saw you hired 3 people..."
[email, Day 3] Sent: "Quick follow-up, here's a guide..."
[whatsapp, Day 7] Sent: "Tried a different channel. Worth 15 min?"
[whatsapp, Day 8] Received: "Maybe next quarter, we're swamped"
```

### Before Classifying a Reply

The agent checks contact memory to improve classification:
- If memory says "previously showed interest" → ambiguous reply classified as "positive"
- If memory says "price objection" → similar message classified as "objection" not "negative"

---

## Database Schema

### contact_memory

```sql
CREATE TABLE contact_memory (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  memory_type TEXT NOT NULL
    CHECK (memory_type IN ('fact', 'interest', 'objection', 'preference', 'interaction', 'insight')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### pattern_insights

```sql
CREATE TABLE pattern_insights (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  insight_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## Multi-Channel Memory

Memory is **channel-agnostic**. When Sammy interacts with a contact on WhatsApp, the memories are the same ones used when drafting an email to that contact.

The conversation history tool (`getContactHistory`) pulls from ALL channels:
- touch_queue (sent messages, each with `channel` field)
- reply_events (received messages, each with `channel` field)

This means:
- WhatsApp conversation → stored → available when drafting email
- Email reply → stored → available when following up on LinkedIn
- Website chat → stored → available everywhere

Sammy never repeats himself across channels because he sees the full cross-channel thread.

---

## Memory and Multi-Tenancy

All memory is scoped by `org_id`. Customer A's contact memories and pattern insights are completely isolated from Customer B's.

- `contact_memory.org_id` ensures per-customer isolation
- `pattern_insights.org_id` ensures per-customer isolation
- The agent always receives `org_id` as the first parameter

---

## Future Enhancements

### Vector/Semantic Memory (Planned)
Replace keyword matching in knowledge base search with vector embeddings for semantic similarity. Would also enable semantic search across contact memories.

### Memory Decay (Planned)
Old memories should gradually lose weight. "Asked about pricing 6 months ago" is less relevant than "asked about pricing yesterday."

### Memory Summarization (Planned)
When a contact has 50+ memories, compress older ones into a summary to keep context window manageable.

### Shared Memory Across Teammates (Planned)
When Support Amara and Success Zuri are added, memories from sales interactions should inform support/success conversations and vice versa.
