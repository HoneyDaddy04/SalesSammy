import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryOne, run } from "../db/database.js";
import { enqueue } from "../services/job-queue.js";
import { config } from "../config/env.js";

const router = Router();

/**
 * WhatsApp Cloud API Webhook
 * Meta sends messages here when someone messages your WhatsApp Business number.
 *
 * Setup:
 * 1. In Meta Developer Portal → WhatsApp → Configuration → Callback URL
 * 2. Set URL to: https://your-api-domain.com/api/webhooks/whatsapp
 * 3. Set Verify Token to your WHATSAPP_VERIFY_TOKEN env var
 * 4. Subscribe to "messages" field
 */

// GET: Webhook verification (Meta sends this once during setup)
router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsappVerifyToken) {
    console.log("[WHATSAPP WEBHOOK] Verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// POST: Incoming messages
router.post("/whatsapp", async (req, res) => {
  // Always respond 200 quickly (Meta retries on timeouts)
  res.sendStatus(200);

  try {
    const body = req.body;
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) return; // Not a message event (could be status update)

    const message = value.messages[0];
    const contact = value.contacts?.[0];
    const phone = message.from; // Sender's phone number (E.164 without +)
    const senderName = contact?.profile?.name || phone;
    const content = message.text?.body || "";
    const timestamp = message.timestamp;

    if (!content) return; // Skip non-text messages for now

    console.log(`[WHATSAPP WEBHOOK] From: ${phone} (${senderName}): ${content.slice(0, 80)}`);

    // Find which org this WhatsApp number belongs to
    // Look for an org with a whatsapp integration that has this phone number
    const integration = await queryOne(
      `SELECT org_id FROM integrations WHERE type = 'whatsapp' AND status = 'connected' LIMIT 1`
    );

    if (!integration) {
      console.log("[WHATSAPP WEBHOOK] No org with connected WhatsApp integration");
      return;
    }

    const orgId = integration.org_id as string;

    // Check if this phone matches an existing contact
    const existingContact = await queryOne(
      `SELECT id FROM contacts WHERE org_id = ? AND phone = ?`,
      [orgId, phone]
    ) || await queryOne(
      `SELECT id FROM contacts WHERE org_id = ? AND phone = ?`,
      [orgId, `+${phone}`]
    );

    const msgId = uuid();
    const now = new Date().toISOString();

    if (existingContact) {
      // Known contact — create a reply event
      const replyId = uuid();
      await run(
        `INSERT INTO reply_events (id, org_id, contact_id, channel, content, status, created_at) VALUES (?, ?, ?, 'whatsapp', ?, 'pending', ?)`,
        [replyId, orgId, existingContact.id, content, now]
      );
      await enqueue(orgId, "classify_reply", { replyId, contactId: existingContact.id, orgId });
      console.log(`[WHATSAPP WEBHOOK] Reply from known contact ${existingContact.id}`);
    } else {
      // Unknown sender — create inbound message for classification
      await run(
        `INSERT INTO inbound_messages (id, org_id, channel, sender_identifier, content, created_at) VALUES (?, ?, 'whatsapp', ?, ?, ?)`,
        [msgId, orgId, phone, content, now]
      );
      await enqueue(orgId, "classify_inbound", {
        messageId: msgId, orgId, channel: "whatsapp",
        sender: phone, senderName, content,
      });
      console.log(`[WHATSAPP WEBHOOK] New inbound from ${phone} — queued for classification`);
    }
  } catch (err: any) {
    console.error("[WHATSAPP WEBHOOK] Error:", err.message);
  }
});

export default router;
