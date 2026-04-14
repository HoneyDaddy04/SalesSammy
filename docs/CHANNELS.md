# Channel Integration Guide

Last updated: 2026-04-14

## Overview

Sammy communicates with contacts through channels. Each channel supports two directions:
- **Outbound (Send):** Sammy sends follow-up messages to contacts
- **Inbound (Receive):** Contacts message Sammy, who captures leads and responds

All channels feed into the same backend. The unified inbound endpoint is:
```
POST /api/replies/inbound
Body: { org_id, channel, sender_email_or_phone, content }
```

---

## Channel Status

| Channel | Outbound | Inbound | Plugin | Integration |
|---------|----------|---------|--------|-------------|
| Email (Gmail) | Plugin exists (stub) | Webhook ready | email.ts | Gmail OAuth |
| WhatsApp Business | Plugin exists (stub) | Webhook ready | whatsapp.ts | WhatsApp Business API |
| LinkedIn DM | Plugin exists (stub) | Webhook ready | linkedin.ts | LinkedIn API |
| SMS (Twilio) | Plugin exists (stub) | Webhook ready | sms.ts | Twilio |
| Website Chat | N/A (widget handles) | widget.js → webhook | N/A | Embed script |
| Telegram | Not built | Webhook ready | Planned | Telegram Bot API |
| Facebook Messenger | Not built | Webhook ready | Planned | Graph API |
| Instagram DMs | Not built | Webhook ready | Planned | Graph API |

**"Webhook ready"** means the `/api/replies/inbound` endpoint accepts messages from that channel. The channel name is passed as a parameter. No channel-specific backend code is needed for receiving.

**"Plugin exists (stub)"** means the send logic logs to console but doesn't actually call the channel's API yet. The plugin architecture is ready - just needs real API credentials and implementation.

---

## How Inbound Works (All Channels)

Every channel follows the same flow:

```
External webhook/widget → POST /api/replies/inbound
  ├── Known sender (matches contact by email/phone)
  │     → Create reply_event
  │     → Enqueue classify_reply job
  │     → Agent classifies + drafts response
  │
  └── Unknown sender (new person)
        → Log to inbound_messages
        → Enqueue classify_inbound job
        → Classify: new_lead / support / spam
        → If lead: create contact + assign sequence + draft response
        → If support: route to team
        → If spam: filter
```

---

## Setting Up Each Channel

### Email (Gmail)

**Outbound:** Connect Gmail in Integrations → provide app password or OAuth token → Sammy sends from your email.

**Inbound options:**
1. **Email forwarding:** Set up a forwarding rule to forward certain emails to a webhook endpoint
2. **Gmail API polling:** Use the Gmail integration to poll for new messages (planned)
3. **Simulate:** Use POST /api/replies/simulate for testing

### WhatsApp Business

**Outbound:** Connect WhatsApp in Integrations → provide Business API key → Sammy sends WhatsApp messages.

**Inbound:** Configure your WhatsApp Business API webhook to point to:
```
POST https://your-domain.com/api/replies/inbound
```

Webhook payload mapping:
```json
{
  "org_id": "your-org-id",
  "channel": "whatsapp",
  "sender_email_or_phone": "+1234567890",
  "content": "Message text from the customer"
}
```

### Website Chat Widget

**Setup:** Add to any webpage:
```html
<script src="https://your-domain.com/widget.js" data-org="YOUR_ORG_ID"></script>
```

Optional: `data-api="https://your-api-domain.com"` if API is on a different domain.

The widget:
- Shows a floating chat button (bottom-right)
- Opens a chat panel when clicked
- Sends messages to POST /api/replies/inbound with channel="website"
- Stores conversation in localStorage
- Auto-responds with "Thanks, Sammy will respond shortly"

### Telegram

**Setup (planned):**
1. Create a Telegram Bot via @BotFather
2. Set webhook: `https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://your-domain.com/api/replies/inbound`
3. Map incoming message format to the inbound payload

### Facebook Messenger

**Setup (planned):**
1. Create a Facebook App with Messenger permissions
2. Set webhook URL in Facebook Developer Console
3. Verify webhook with challenge token
4. Map incoming message events to inbound payload

### Instagram DMs

**Setup (planned):**
1. Connect via Facebook/Meta Graph API (Instagram Business account required)
2. Subscribe to messaging webhook events
3. Map incoming DM events to inbound payload

### LinkedIn DMs

**Setup (planned):**
1. LinkedIn Messaging API (requires LinkedIn partnership or Sales Navigator API)
2. Alternative: Integrate via third-party (Phantombuster, Dripify)
3. Map incoming messages to inbound payload

### SMS (Twilio)

**Setup (planned):**
1. Create Twilio account + phone number
2. Set webhook URL in Twilio console for incoming messages
3. Map Twilio webhook payload to inbound format

---

## Adding a New Channel

### Step 1: Create the plugin (for outbound)

```typescript
// server/src/channels/telegram.ts
import { ChannelPlugin, SendResult } from "./types.js";

export class TelegramPlugin implements ChannelPlugin {
  name = "Telegram";
  channelType = "telegram";
  private botToken = "";

  async connect(credentials: Record<string, unknown>) {
    this.botToken = credentials.bot_token as string;
  }

  async send(to: string, content: string): Promise<SendResult> {
    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: to, text: content }),
    });
    const data = await res.json();
    return { messageId: data.result?.message_id?.toString() || "", status: "sent" };
  }

  // ... other interface methods
}
```

### Step 2: Register the plugin

```typescript
// In server/src/index.ts
import { TelegramPlugin } from "./channels/telegram.js";
registerChannel(new TelegramPlugin());
```

### Step 3: Add to integrations catalog (frontend)

In `src/components/dashboard/IntegrationsView.tsx`, add the channel to the ALL_INTEGRATIONS array.

### Step 4: Add to deploy view

In `src/components/dashboard/DeployView.tsx`, add a card showing the webhook URL and setup instructions.

### Step 5: Inbound just works

No backend changes needed for inbound. All channels use the same `/api/replies/inbound` endpoint. Just configure the external service to POST to it.

---

## Conversation History Across Channels

The agent has access to the FULL conversation history across ALL channels:

```
touch_queue table:     channel | content | sent_at
reply_events table:    channel | content | created_at
```

Both tables include the `channel` field. When the agent calls `getContactHistory()`, it pulls from both tables sorted chronologically. The agent sees:

```
[email] Sent: "Hey Sarah, saw you hired 3 people..." (Day 0)
[email] Sent: "Quick follow-up, sharing a guide..." (Day 3)
[whatsapp] Sent: "Hey Sarah, tried a different channel..." (Day 7)
[whatsapp] Received: "Thanks, this looks interesting" (Day 8)
[email] Sent: "Great to hear! Here's the case study..." (Day 9)
[linkedin] Received: "Can we schedule a call?" (Day 10)
```

Sammy never repeats himself across channels and references previous conversations regardless of which channel they happened on.
