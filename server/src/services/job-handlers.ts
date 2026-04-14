import { queryOne, queryAll, run } from "../db/database.js";
import { enqueue } from "./job-queue.js";
import { v4 as uuid } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";
import { getChannel } from "../channels/registry.js";
import { decrypt } from "./vault.js";
import { mergeContext } from "./context-merger.js";
import { createAgent } from "../agent/interface.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
const agent = createAgent();

interface Job {
  id: string;
  org_id: string;
  type: string;
  payload: string;
}

export async function handleJob(job: Job): Promise<object> {
  const payload = JSON.parse(job.payload);
  switch (job.type) {
    case "draft_touch":
      return await handleDraftTouch(job.org_id, payload);
    case "send_touch":
      return await handleSendTouch(job.org_id, payload);
    case "classify_reply":
      return await handleClassifyReply(job.org_id, payload);
    case "classify_inbound":
      return await handleClassifyInbound(job.org_id, payload);
    case "draft_reply":
      return await handleDraftReply(job.org_id, payload);
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

/** Extracted from trigger.ts — drafts a single touch for one contact */
async function handleDraftTouch(orgId: string, payload: {
  contactId: string;
  sequenceId: string;
  touchIndex: number;
  seqTouches: string;
}): Promise<object> {
  const { contactId, sequenceId, touchIndex, seqTouches } = payload;

  const teammate = queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [orgId]);
  if (!teammate) throw new Error("No teammate configured");

  const contact = queryOne(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
  if (!contact) throw new Error(`Contact ${contactId} not found`);

  const touches = JSON.parse(seqTouches);
  if (touchIndex >= touches.length) {
    run(`UPDATE contacts SET status = 'completed' WHERE id = ?`, [contactId]);
    return { status: "completed", contactId };
  }

  const touch = touches[touchIndex];

  // Smart channel resolution
  const contactChannels: string[] = (() => { try { return JSON.parse(contact.available_channels as string); } catch { return []; } })();
  const connectedIntegrations = queryAll(
    `SELECT type FROM integrations WHERE org_id = ? AND category = 'channel' AND status = 'connected'`,
    [orgId]
  ).map((i: any) => i.type as string);
  const connectedChannels = connectedIntegrations.map(t =>
    t === "gmail" || t === "outlook" ? "email" : t
  );

  const tierOrder = touch.channel_tier === "primary"
    ? [teammate.primary_channel, teammate.secondary_channel, teammate.tertiary_channel]
    : [teammate.secondary_channel, teammate.primary_channel, teammate.tertiary_channel];

  const channel = (tierOrder as (string | null)[])
    .filter((ch): ch is string => !!ch)
    .find(ch => contactChannels.includes(ch) && connectedChannels.includes(ch))
    || (teammate.primary_channel as string);

  // Use agent layer for research + drafting
  const research = await agent.research(orgId, contactId);
  const draft = await agent.draft(orgId, contactId, research, touch.angle, channel, touchIndex);
  const draftedContent = draft.content;
  const researchContext = draft.researchContext;
  const now = new Date().toISOString();

  const touchId = uuid();
  run(
    `INSERT INTO touch_queue (id, org_id, contact_id, sequence_id, touch_index, channel, angle, drafted_content, research_context, status, scheduled_for) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?)`,
    [touchId, orgId, contactId, sequenceId, touchIndex, channel, touch.angle, draftedContent, researchContext, now]
  );

  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, touch_queue_id) VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [uuid(), orgId, `Drafted touch ${touchIndex + 1} for ${contact.name}`, `${touch.angle.replace(/_/g, " ")} / ${channel}`, contact.name, touchId]
  );

  return { status: "drafted", touchId, contactId, channel };
}

/** Send an approved touch via the channel plugin */
async function handleSendTouch(orgId: string, payload: {
  touchQueueId: string;
}): Promise<object> {
  const item = queryOne(`SELECT * FROM touch_queue WHERE id = ?`, [payload.touchQueueId]);
  if (!item) throw new Error("Touch queue item not found");

  const channelPlugin = getChannel(item.channel as string);
  if (!channelPlugin) {
    return { status: "skipped", reason: `No plugin for channel: ${item.channel}` };
  }

  // Get decrypted credentials for this channel's integration
  const integrationType = item.channel === "email" ? "gmail" : item.channel;
  const integration = queryOne(
    `SELECT credentials FROM integrations WHERE org_id = ? AND type = ? AND status = 'connected'`,
    [orgId, integrationType]
  );

  if (integration) {
    const creds = JSON.parse(decrypt(integration.credentials as string));
    await channelPlugin.connect(creds);
  }

  const contact = queryOne(`SELECT email, phone, linkedin FROM contacts WHERE id = ?`, [item.contact_id]);
  const recipient = item.channel === "email"
    ? (contact?.email as string)
    : item.channel === "linkedin"
      ? (contact?.linkedin as string)
      : (contact?.phone as string);

  if (!recipient) {
    return { status: "failed", reason: "No recipient address for channel" };
  }

  const result = await channelPlugin.send(recipient, item.drafted_content as string);
  return { status: result.status, messageId: result.messageId };
}

/** Classify an inbound message from an unknown sender — lead capture, support routing, or spam filtering */
async function handleClassifyInbound(orgId: string, payload: {
  messageId: string;
  orgId: string;
  channel: string;
  sender: string;
  senderName?: string;
  content: string;
}): Promise<object> {
  const { messageId, channel, sender, senderName, content } = payload;
  const lower = content.toLowerCase();
  const now = new Date().toISOString();

  // Load the inbound message
  const msg = queryOne(`SELECT * FROM inbound_messages WHERE id = ?`, [messageId]);
  if (!msg) throw new Error(`Inbound message ${messageId} not found`);

  // ── Classification rules ──
  const spamSignals = ["seo services", "link building", "marketing agency", "we noticed your website",
    "bulk email", "grow your business", "million leads", "buy now", "act now", "limited time offer"];
  const supportSignals = ["my order", "refund", "broken", "not working", "help with",
    "issue with", "problem with", "complaint", "cancel", "subscription"];

  let classification: string;
  let routedTo: string | null;

  if (spamSignals.some(s => lower.includes(s))) {
    classification = "spam";
    routedTo = null;
  } else if (supportSignals.some(s => lower.includes(s))) {
    classification = "existing_customer_support";
    routedTo = "support";
  } else {
    classification = "new_lead";
    routedTo = "teammate";
  }

  // Update inbound_messages with classification
  run(
    `UPDATE inbound_messages SET classification = ?, routed_to = ? WHERE id = ?`,
    [classification, routedTo, messageId]
  );

  // ── Handle by classification ──

  if (classification === "spam") {
    run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, created_at) VALUES (?, ?, ?, ?, 'info', ?)`,
      [uuid(), orgId, `Spam filtered from ${sender}`, `${channel}: ${content.substring(0, 80)}`, now]
    );
    return { status: "classified", messageId, classification, routedTo };
  }

  if (classification === "existing_customer_support") {
    // Try to match to existing contact
    const existing = queryOne(
      `SELECT * FROM contacts WHERE org_id = ? AND (email = ? OR phone = ?)`,
      [orgId, sender, sender]
    );
    if (existing) {
      run(`UPDATE inbound_messages SET matched_contact_id = ? WHERE id = ?`, [existing.id, messageId]);
    }
    run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, created_at) VALUES (?, ?, ?, ?, 'warning', ?)`,
      [uuid(), orgId, `Support inquiry from ${sender} via ${channel} - routing to team`, content.substring(0, 100), now]
    );
    return { status: "classified", messageId, classification, routedTo, matchedContactId: existing?.id || null };
  }

  // ── New lead capture ──
  const contactId = uuid();

  // Determine name: use senderName payload, or extract from sender, or use sender as-is
  const contactName = senderName || sender;

  // Determine email vs phone from sender
  const isEmail = sender.includes("@");
  const contactEmail = isEmail ? sender : null;
  const contactPhone = !isEmail ? sender : null;

  // Determine available channels from the channel they messaged from
  const channelMap: Record<string, string> = { whatsapp: "whatsapp", sms: "sms", email: "email", instagram: "instagram", twitter: "twitter", linkedin: "linkedin" };
  const availableChannels = channelMap[channel] ? [channelMap[channel]] : [channel];
  // If we have email, also add email channel
  if (isEmail && !availableChannels.includes("email")) availableChannels.push("email");

  // Find a sequence to assign — prefer inbound_lead, fall back to any active sequence
  const sequence = queryOne(
    `SELECT id FROM sequences WHERE template_key LIKE '%inbound%' AND active = 1 LIMIT 1`
  ) || queryOne(
    `SELECT id FROM sequences WHERE active = 1 LIMIT 1`
  );

  run(
    `INSERT INTO contacts (id, org_id, name, email, phone, lead_score, source, source_detail, status, available_channels, sequence_id, tags, metadata, touch_index, notes) VALUES (?, ?, ?, ?, ?, 25, ?, ?, 'active', ?, ?, '["inbound"]', '{}', 0, '')`,
    [
      contactId, orgId, contactName, contactEmail, contactPhone,
      `inbound_${channel}`, `Captured from ${channel} message`,
      JSON.stringify(availableChannels),
      sequence ? sequence.id : null,
    ]
  );

  // Update inbound_messages with matched contact
  run(`UPDATE inbound_messages SET matched_contact_id = ? WHERE id = ?`, [contactId, messageId]);

  // Create a reply_event so the message shows in the thread
  const replyId = uuid();
  run(
    `INSERT INTO reply_events (id, org_id, contact_id, channel, content, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [replyId, orgId, contactId, channel, content, now]
  );

  // Enqueue classify_reply so Sammy drafts a response
  enqueue(orgId, "classify_reply", { replyId, contactId, orgId });

  // Log activity
  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, created_at) VALUES (?, ?, ?, ?, 'info', ?, ?)`,
    [uuid(), orgId, `New lead captured from ${channel}: ${sender}`, content.substring(0, 100), contactName, now]
  );

  return { status: "classified", messageId, classification, routedTo, contactId, replyId };
}

/** Classify an inbound reply using rule-based heuristics */
async function handleClassifyReply(orgId: string, payload: {
  replyId: string;
  contactId: string;
  orgId: string;
}): Promise<object> {
  const { replyId, contactId } = payload;

  const reply = queryOne(`SELECT * FROM reply_events WHERE id = ?`, [replyId]);
  if (!reply) throw new Error(`Reply ${replyId} not found`);

  const contact = queryOne(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
  const contactName = (contact?.name as string) || "Unknown";
  const content = reply.content as string;
  const now = new Date().toISOString();

  // Use agent layer for classification (includes memory + guardrails)
  const result = await agent.classifyReply(orgId, content, contactId);
  const classification = result.classification;
  const routedAction = result.routedAction;

  // Update reply_events
  run(
    `UPDATE reply_events SET classification = ?, routed_action = ?, status = 'handled' WHERE id = ?`,
    [classification, routedAction, replyId]
  );

  // Handle opt-out and escalation
  if (routedAction === "opt_out") {
    run(`UPDATE contacts SET status = 'opted_out', updated_at = ? WHERE id = ?`, [now, contactId]);
    run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, created_at) VALUES (?, ?, ?, ?, 'warning', ?, ?)`,
      [uuid(), orgId, `${contactName} opted out`, `Reply classified as opt-out request`, contactName, now]
    );
  } else if (routedAction === "escalate") {
    run(`UPDATE contacts SET status = 'escalated', updated_at = ? WHERE id = ?`, [now, contactId]);
    run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, created_at) VALUES (?, ?, ?, ?, 'warning', ?, ?)`,
      [uuid(), orgId, `Reply from ${contactName} escalated`, `Classified as ${classification} — requires human review`, contactName, now]
    );
  } else if (routedAction === "draft_response") {
    // Enqueue draft reply job
    enqueue(orgId, "draft_reply", { replyId, contactId });
    run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, created_at) VALUES (?, ?, ?, ?, 'info', ?, ?)`,
      [uuid(), orgId, `Reply from ${contactName} classified as ${classification}`, `Drafting response`, contactName, now]
    );
  }

  return { status: "classified", replyId, classification, routedAction };
}

/** Draft a response to a classified reply */
async function handleDraftReply(orgId: string, payload: {
  replyId: string;
  contactId: string;
}): Promise<object> {
  const { replyId, contactId } = payload;

  const reply = queryOne(`SELECT * FROM reply_events WHERE id = ?`, [replyId]);
  if (!reply) throw new Error(`Reply ${replyId} not found`);

  const contact = queryOne(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
  const contactName = (contact?.name as string) || "Unknown";
  const now = new Date().toISOString();

  const classification = reply.classification as string;

  // Use agent layer for research + drafting the reply response
  const research = await agent.research(orgId, contactId);
  const draft = await agent.draft(orgId, contactId, research, `reply_to_${classification}`, reply.channel as string, 0);
  const draftContent = draft.content;

  const touchId = uuid();
  run(
    `INSERT INTO touch_queue (id, org_id, contact_id, channel, angle, drafted_content, status, scheduled_for) VALUES (?, ?, ?, ?, 'reply_response', ?, 'pending_approval', ?)`,
    [touchId, orgId, contactId, reply.channel as string, draftContent, now]
  );

  // Update reply status
  run(`UPDATE reply_events SET auto_response_drafted = 1, status = 'handled' WHERE id = ?`, [replyId]);

  run(
    `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, touch_queue_id, created_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [uuid(), orgId, `Draft response ready for ${contactName}`, `Reply to ${classification} message`, contactName, touchId, now]
  );

  return { status: "drafted", touchId, replyId, contactId };
}
