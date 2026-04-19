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
    // Match on the phone_number_id from the webhook metadata
    const waPhoneId = value?.metadata?.phone_number_id || "";
    const integration = waPhoneId
      ? await queryOne(
          `SELECT org_id FROM integrations WHERE type = 'whatsapp' AND status = 'connected' AND config LIKE ?`,
          [`%${waPhoneId}%`]
        )
      : await queryOne(
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

/**
 * WhatsApp Embedded Signup — exchange code for token + phone number
 * Called by the frontend after the user completes Meta's Embedded Signup popup.
 *
 * Flow:
 * 1. Frontend loads Meta's JS SDK and launches Embedded Signup
 * 2. User links their WhatsApp Business Account in Meta's popup
 * 3. Meta returns a code to the frontend callback
 * 4. Frontend sends code + org_id here
 * 5. We exchange code → long-lived token, fetch phone number ID
 * 6. Store in integrations table for this org
 */
router.post("/whatsapp/signup", async (req, res) => {
  const { org_id, code } = req.body;
  if (!org_id || !code) {
    res.status(400).json({ error: "org_id and code required" });
    return;
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${config.metaAppId}` +
      `&client_secret=${config.metaAppSecret}` +
      `&code=${code}`,
      { method: "GET" }
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      res.status(400).json({ error: tokenData.error.message });
      return;
    }

    const accessToken = tokenData.access_token;

    // Get the WhatsApp Business Account ID
    const wabaRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}`,
      { headers: { "Authorization": `Bearer ${config.metaAppId}|${config.metaAppSecret}` } }
    );
    const wabaData = await wabaRes.json();

    // Fetch phone numbers associated with this WABA
    // First get the WABA ID from the shared WABAs
    const sharedRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?access_token=${accessToken}`
    );
    const sharedData = await sharedRes.json();

    // Try to get phone numbers from the first available WABA
    let phoneNumberId = "";
    let phoneDisplay = "";

    // Search for WABA phone numbers using the token
    const phonesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/phone_numbers?access_token=${accessToken}`
    );
    const phonesData = await phonesRes.json();

    if (phonesData.data?.length > 0) {
      phoneNumberId = phonesData.data[0].id;
      phoneDisplay = phonesData.data[0].display_phone_number || phonesData.data[0].verified_name || "";
    }

    // Store credentials in integrations table
    const { encrypt } = await import("../services/vault.js");
    const credentials = {
      whatsapp_token: accessToken,
      whatsapp_phone_id: phoneNumberId,
      phone_display: phoneDisplay,
    };
    const encryptedCreds = encrypt(JSON.stringify(credentials));

    const existing = await queryOne(
      `SELECT id FROM integrations WHERE org_id = ? AND type = 'whatsapp'`,
      [org_id]
    );

    if (existing) {
      await run(
        `UPDATE integrations SET status = 'connected', credentials = ?, config = ? WHERE id = ?`,
        [encryptedCreds, JSON.stringify({ phone_display: phoneDisplay, phone_number_id: phoneNumberId }), existing.id]
      );
    } else {
      const id = uuid();
      await run(
        `INSERT INTO integrations (id, org_id, type, category, status, credentials, config) VALUES (?, ?, 'whatsapp', 'channel', 'connected', ?, ?)`,
        [id, org_id, encryptedCreds, JSON.stringify({ phone_display: phoneDisplay, phone_number_id: phoneNumberId })]
      );
    }

    // Subscribe to webhooks for this phone number
    if (phoneNumberId && accessToken) {
      await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/subscribed_apps`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      ).catch(() => {}); // Non-critical
    }

    console.log(`[WHATSAPP SIGNUP] Org ${org_id} connected WhatsApp: ${phoneDisplay} (${phoneNumberId})`);
    res.json({
      status: "connected",
      phone_display: phoneDisplay,
      phone_number_id: phoneNumberId,
    });
  } catch (err: any) {
    console.error("[WHATSAPP SIGNUP] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/webhooks/whatsapp/config — return Meta App ID and config ID for frontend SDK */
router.get("/whatsapp/config", (_req, res) => {
  res.json({
    app_id: config.metaAppId,
    config_id: config.metaConfigId,
  });
});

export default router;
