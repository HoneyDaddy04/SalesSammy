import { getDb, run } from "./database.js";
import { v4 as uuid } from "uuid";
import { runMigrations } from "./migrate.js";

async function seed() {
  await getDb();
  await runMigrations();

  const orgId = uuid();
  await run(`INSERT INTO organizations (id, name, industry) VALUES (?, ?, ?)`, [orgId, "FlowDesk", "SaaS"]);

  // --- 5 Sequence Templates ---
  const sequences = [
    { id: uuid(), template_key: "cold_outbound", name: "Cold Outbound", description: "B2B sales, recruiting, agencies. 5 touches over 18 days.",
      touches: [{ day_offset: 0, angle: "trigger_event", channel_tier: "primary" }, { day_offset: 3, angle: "value_add", channel_tier: "primary" }, { day_offset: 7, angle: "different_angle", channel_tier: "secondary" }, { day_offset: 12, angle: "permission_to_close", channel_tier: "primary" }, { day_offset: 18, angle: "revival", channel_tier: "secondary" }] },
    { id: uuid(), template_key: "abandoned_cart", name: "Abandoned Cart / Inquiry", description: "E-commerce, DTC. 3 touches over 5 days, faster cadence.",
      touches: [{ day_offset: 0, angle: "trigger_event", channel_tier: "primary" }, { day_offset: 2, angle: "value_add", channel_tier: "primary" }, { day_offset: 5, angle: "permission_to_close", channel_tier: "secondary" }] },
    { id: uuid(), template_key: "inbound_lead", name: "Inbound Lead", description: "Real estate, services, B2B demos. 4 touches over 10 days.",
      touches: [{ day_offset: 0, angle: "trigger_event", channel_tier: "primary" }, { day_offset: 2, angle: "value_add", channel_tier: "primary" }, { day_offset: 5, angle: "different_angle", channel_tier: "secondary" }, { day_offset: 10, angle: "permission_to_close", channel_tier: "primary" }] },
    { id: uuid(), template_key: "re_engagement", name: "Re-engagement", description: "Dormant leads, any business. 3 touches over 14 days.",
      touches: [{ day_offset: 0, angle: "trigger_event", channel_tier: "primary" }, { day_offset: 7, angle: "different_angle", channel_tier: "secondary" }, { day_offset: 14, angle: "permission_to_close", channel_tier: "primary" }] },
    { id: uuid(), template_key: "post_conversion", name: "Post-Conversion", description: "After purchase/booking: upsell, review request, referral ask. 3 touches over 14 days.",
      touches: [{ day_offset: 2, angle: "value_add", channel_tier: "primary" }, { day_offset: 7, angle: "different_angle", channel_tier: "primary" }, { day_offset: 14, angle: "trigger_event", channel_tier: "secondary" }] },
    { id: uuid(), template_key: "stalled_revival", name: "Stalled Lead Revival", description: "Leads that replied but went quiet. 3 touches over 21 days.",
      touches: [{ day_offset: 0, angle: "trigger_event", channel_tier: "primary" }, { day_offset: 10, angle: "different_angle", channel_tier: "secondary" }, { day_offset: 21, angle: "permission_to_close", channel_tier: "primary" }] },
  ];
  for (const s of sequences) await run(`INSERT INTO sequences (id, template_key, name, description, touches) VALUES (?, ?, ?, ?, ?)`, [s.id, s.template_key, s.name, s.description, JSON.stringify(s.touches)]);

  // --- Teammate ---
  const teammateId = uuid();
  await run(`INSERT INTO teammate (id, org_id, business_description, target_audience, lead_trigger_signals, lead_source_type, goal, voice_examples, guardrails, escalation_contact, conversion_actions, persona_prompt, operating_instructions, primary_channel, secondary_channel, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    teammateId, orgId,
    "FlowDesk is a project management tool for teams of 5-30. We replace the mess of spreadsheets, Slack threads, and sticky notes with one clean workspace. Plans start at $29/month.",
    "Founders and ops leads at startups and small businesses. Usually 5-30 people, overwhelmed by too many tools, losing track of who's doing what.",
    "Recently raised funding, hired 3+ people in a month, posted on social media about project chaos or missed deadlines, visited our pricing page multiple times.",
    "Mix of inbound (site demos) and cold outreach (LinkedIn prospecting)",
    "Book a 15-minute demo call or start a free trial",
    JSON.stringify([
      "Hey Sarah, saw you just brought on 3 new people. Congrats! That's usually when task tracking starts breaking. We built something for exactly that stage. Worth a quick look?",
      "Quick one.noticed your team's growing fast. Most founders at your stage spend 5+ hours/week just keeping everyone aligned. We cut that to zero. Want me to show you how in 15 min?",
      "James, saw your tweet about project chaos. Been there. We built FlowDesk specifically for CTOs who are tired of duct-taping Trello and Slack together. 10 min to set up, free trial. Interested?",
    ]),
    JSON.stringify(["Never discuss competitor pricing", "Don't promise custom features or timelines", "Don't commit to delivery dates", "Never share other customer names"]),
    JSON.stringify({ name: "Alex Okafor", email: "alex@flowdesk.io", channel: "email" }),
    JSON.stringify([
      { key: "book_demo", label: "Book a demo call", cta_type: "booking", cta_value: "https://calendly.com/flowdesk/demo", trackable: true },
      { key: "start_trial", label: "Start free trial", cta_type: "link", cta_value: "https://flowdesk.io/trial?ref={{contact_id}}", trackable: true },
    ]),
    "You're a friendly, direct follow-up specialist for FlowDesk, a project management tool for small teams. You reach out to leads who've gone quiet, respond when they reply, and book demo calls.\n\nYou write like a real person.short sentences, no fluff, no corporate speak. You reference specific things about the lead (recent hiring, funding, social posts) so your messages feel personal, not templated.\n\nYou never push too hard. If someone's not interested, you close gracefully. If they have a question you can't answer, you loop in Alex.",
    "Be more casual on WhatsApp.shorter messages, more conversational\nAlways mention the free trial when relevant\nFor Series A companies, emphasize scaling pain points over cost savings",
    "email", "whatsapp", "shadow",
  ]);

  // --- 12 Contacts with varied statuses ---
  const coldSeqId = sequences[0].id;
  const inboundSeqId = sequences[2].id;
  const reEngageSeqId = sequences[3].id;

  const contactData = [
    { name: "Sarah Chen", email: "sarah@acmecorp.com", phone: "+1-415-555-0123", company: "Acme Corp", role: "Head of Ops", linkedin: "linkedin.com/in/sarachen", website: "acmecorp.com", industry: "SaaS", companySize: "10-25", tags: ["hot-lead", "saas"], source: "csv", sourceDetail: "LinkedIn export Q1", score: 72, meta: { team_size: 12, recent_signal: "Hired 3 people last month" }, seq: coldSeqId, ti: 2, status: "active", lastTouch: 4, nextTouch: -1, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "James Obi", email: "james@startupxyz.com", phone: "+234-801-555-0456", company: "StartupXYZ", role: "CTO", linkedin: "linkedin.com/in/jamesobi", website: "startupxyz.com", industry: "Technology", companySize: "5-10", tags: ["tech-leader"], source: "csv", sourceDetail: "LinkedIn export Q1", score: 58, meta: { team_size: 8, recent_signal: "Tweeted about project chaos" }, seq: coldSeqId, ti: 0, status: "active", lastTouch: 0, nextTouch: 0, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "Maria Santos", email: "maria@growthco.io", phone: null, company: "GrowthCo", role: "Founder & CEO", linkedin: "linkedin.com/in/mariasantos", website: "growthco.io", industry: "SaaS", companySize: "10-25", tags: ["funded", "hot-lead"], source: "csv", sourceDetail: "LinkedIn export Q1", score: 85, meta: { team_size: 22, recent_signal: "Series A announced last week" }, seq: coldSeqId, ti: 3, status: "active", lastTouch: 8, nextTouch: -2, channels: ["email", "linkedin"] },
    { name: "David Mensah", email: "david@localservices.ng", phone: "+234-803-555-0789", company: "LocalServices NG", role: "Owner", linkedin: null, website: "localservicesng.com", industry: "Services", companySize: "1-5", tags: ["replied", "smb"], source: "manual", sourceDetail: null, score: 65, meta: { team_size: 5, recent_signal: "Replied positively 3 days ago" }, seq: coldSeqId, ti: 1, status: "replied", lastTouch: 3, nextTouch: null, channels: ["email", "sms", "whatsapp"] },
    { name: "Fatima Al-Hassan", email: "fatima@designlab.co", phone: "+971-50-555-1234", company: "DesignLab", role: "Operations Manager", linkedin: "linkedin.com/in/fatimaalhassan", website: "designlab.co", industry: "Design", companySize: "10-25", tags: ["inbound"], source: "webhook", sourceDetail: "Website demo form", score: 70, meta: { team_size: 15, recent_signal: "Job posting for project coordinator" }, seq: inboundSeqId, ti: 1, status: "active", lastTouch: 2, nextTouch: -3, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "Chen Wei", email: "chen@rapidscale.io", phone: "+86-138-5555-6789", company: "RapidScale", role: "VP Engineering", linkedin: "linkedin.com/in/chenwei", website: "rapidscale.io", industry: "Technology", companySize: "25-50", tags: ["enterprise", "objection"], source: "hubspot", sourceDetail: "HubSpot pipeline sync", score: 45, meta: { team_size: 30, recent_signal: "Expanded to 3 offices this quarter" }, seq: coldSeqId, ti: 4, status: "active", lastTouch: 14, nextTouch: -4, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "Aisha Bello", email: "aisha@craftmarket.ng", phone: "+234-805-555-2345", company: "CraftMarket", role: "Co-founder", linkedin: "linkedin.com/in/aishabello", website: "craftmarket.ng", industry: "E-Commerce", companySize: "5-10", tags: ["new"], source: "google_sheets", sourceDetail: "Lead pipeline sheet", score: 40, meta: { team_size: 7, recent_signal: "Launched new product line on Instagram" }, seq: inboundSeqId, ti: 0, status: "queued", lastTouch: null, nextTouch: 0, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "Tunde Adeyemi", email: "tunde@paystack.com", phone: "+234-802-555-3456", company: "PayStack Plus", role: "Head of Product", linkedin: "linkedin.com/in/tundeadeyemi", website: "paystackplus.com", industry: "FinTech", companySize: "10-25", tags: ["tech-leader", "jira-migrator"], source: "csv", sourceDetail: "LinkedIn export Q1", score: 62, meta: { team_size: 18, recent_signal: "Complained about Jira on LinkedIn" }, seq: coldSeqId, ti: 1, status: "active", lastTouch: 5, nextTouch: -1, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "Priya Sharma", email: "priya@techbridge.in", phone: "+91-98765-55432", company: "TechBridge", role: "CTO", linkedin: "linkedin.com/in/priyasharma", website: "techbridge.in", industry: "Technology", companySize: "10-25", tags: ["whitepaper-download"], source: "webhook", sourceDetail: "Whitepaper download form", score: 68, meta: { team_size: 11, recent_signal: "Downloaded our whitepaper" }, seq: inboundSeqId, ti: 2, status: "active", lastTouch: 6, nextTouch: -1, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "Oluwaseun Bakare", email: "seun@logistix.ng", phone: "+234-806-555-4567", company: "Logistix", role: "Founder", linkedin: null, website: "logistix.ng", industry: "Logistics", companySize: "5-10", tags: ["replied", "pricing-question"], source: "manual", sourceDetail: null, score: 75, meta: { team_size: 9, recent_signal: "Visited pricing page 3 times" }, seq: coldSeqId, ti: 2, status: "replied", lastTouch: 7, nextTouch: null, channels: ["email", "sms", "whatsapp"] },
    { name: "Rachel Kim", email: "rachel@novahealth.com", phone: "+1-310-555-5678", company: "Nova Health", role: "Operations Director", linkedin: "linkedin.com/in/rachelkim", website: "novahealth.com", industry: "Healthcare", companySize: "25-50", tags: ["podcast-mention", "paused"], source: "hubspot", sourceDetail: "HubSpot pipeline sync", score: 55, meta: { team_size: 25, recent_signal: "Mentioned in a podcast about scaling ops" }, seq: reEngageSeqId, ti: 0, status: "paused", lastTouch: 21, nextTouch: null, channels: ["email", "linkedin", "sms", "whatsapp"] },
    { name: "Emmanuel Nwosu", email: "emma@buildhub.io", phone: "+234-807-555-6789", company: "BuildHub", role: "CEO", linkedin: "linkedin.com/in/emmanuelnwosu", website: "buildhub.io", industry: "Construction Tech", companySize: "10-25", tags: ["funded", "converted"], source: "csv", sourceDetail: "LinkedIn export Q1", score: 92, meta: { team_size: 14, recent_signal: "Announced seed funding on Twitter" }, seq: coldSeqId, ti: 5, status: "completed", lastTouch: 20, nextTouch: null, channels: ["email", "linkedin", "sms", "whatsapp"] },
  ];

  const contactIds: string[] = [];
  for (const c of contactData) {
    const cId = uuid();
    contactIds.push(cId);
    await run(`INSERT INTO contacts (id, org_id, name, email, phone, company, role, linkedin, website, industry, company_size, tags, notes, lead_score, source, source_detail, metadata, sequence_id, touch_index, last_touch_at, next_touch_at, status, available_channels, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cId, orgId, c.name, c.email, c.phone, c.company, c.role, c.linkedin, c.website, c.industry, c.companySize, JSON.stringify(c.tags), "", c.score, c.source, c.sourceDetail, JSON.stringify(c.meta), c.seq, c.ti, c.lastTouch !== null ? daysAgo(c.lastTouch) : null, c.nextTouch !== null ? daysAgo(c.nextTouch) : null, c.status, JSON.stringify(c.channels), new Date().toISOString()]);
  }

  // --- Touch Queue: 3 pending, 5 sent ---
  const touchData = [
    // Pending approvals
    { contact: 0, ti: 2, channel: "email", angle: "different_angle", status: "pending_approval", scheduled: -1,
      content: "Hey Sarah, tried email a couple times, thought I'd try a different angle. Your team just crossed 12 people, right? That's exactly the point where things start falling through cracks. We've got a free trial that takes 10 minutes to set up. No commitment, no demo needed. Want me to send the link?",
      research: "Sarah Chen, Head of Ops at Acme Corp. Team grew from 9 to 12 last month. Two previous touches (trigger_event + value_add) with no reply. Active on LinkedIn, posting about team management." },
    { contact: 7, ti: 1, channel: "email", angle: "value_add", status: "pending_approval", scheduled: -1,
      content: "Tunde, not trying to sell you anything today. Just sharing a quick guide we wrote on migrating from Jira without losing your mind. Figured it might be useful given your LinkedIn post. Here if you want to chat about it.",
      research: "Tunde Adeyemi, Head of Product at PayStack Plus. 18 people. Complained about Jira complexity on LinkedIn last week. First touch sent 5 days ago, no reply yet." },
    { contact: 8, ti: 2, channel: "whatsapp", angle: "different_angle", status: "pending_approval", scheduled: 0,
      content: "Hi Priya, sent a couple emails, wanted to try here instead. Saw you downloaded our scaling teams whitepaper. Happy to walk you through how TechBridge could actually implement that stuff. 15 min call?",
      research: "Priya Sharma, CTO at TechBridge. 11 people. Downloaded whitepaper on scaling teams. Two previous touches via email. Trying WhatsApp as secondary channel." },
    // Sent touches
    { contact: 0, ti: 0, channel: "email", angle: "trigger_event", status: "sent", scheduled: 8, sent: 8,
      content: "Hey Sarah, saw you just brought on 3 new people at Acme Corp. Congrats! That's usually when task tracking starts breaking down. We built FlowDesk specifically for that stage. Worth 15 min to see if it fits?",
      research: "Sarah Chen, Head of Ops at Acme Corp. Recently hired 3 people." },
    { contact: 0, ti: 1, channel: "whatsapp", angle: "value_add", status: "sent", scheduled: 5, sent: 5,
      content: "Hey Sarah, quick one. We published a guide on how 10-person teams stay aligned without daily standups. Thought it might be relevant given your growth. Want me to send the link?",
      research: "Second touch, value-add angle via WhatsApp (channel switch). No reply to first email." },
    { contact: 1, ti: 0, channel: "linkedin", angle: "trigger_event", status: "sent", scheduled: 1, sent: 0,
      content: "James, saw your tweet about project chaos. Been there. We built FlowDesk specifically for CTOs who are tired of duct-taping Trello and Slack together. Takes 10 min to set up, free trial. Interested?",
      research: "James Obi, CTO at StartupXYZ. Posted about project management frustrations on Twitter. Reached via LinkedIn DM." },
    { contact: 2, ti: 0, channel: "email", angle: "trigger_event", status: "sent", scheduled: 12, sent: 12,
      content: "Maria, congrats on the Series A! That's huge. Quick heads up: most founders at your stage tell us the first thing that breaks is knowing who's working on what. We built FlowDesk for exactly that moment. Worth a look?",
      research: "Maria Santos, Founder at GrowthCo. Series A announced last week." },
    { contact: 3, ti: 0, channel: "email", angle: "trigger_event", status: "sent", scheduled: 6, sent: 6,
      content: "David, noticed you run a service business with about 5 people. That's the sweet spot where a simple project tool can save you 5+ hours a week. We built FlowDesk for teams exactly your size. Quick demo?",
      research: "David Mensah, Owner at LocalServices NG. 5 people, service business." },
  ];

  for (const t of touchData) {
    await run(`INSERT INTO touch_queue (id, org_id, contact_id, sequence_id, touch_index, channel, angle, drafted_content, research_context, status, scheduled_for, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), orgId, contactIds[t.contact], contactData[t.contact].seq, t.ti, t.channel, t.angle, t.content, t.research, t.status,
       daysAgo(t.scheduled), t.sent !== undefined ? daysAgo(t.sent) : null]);
  }

  // --- Reply Events ---
  const replies = [
    { contact: 3, channel: "email", content: "Interesting, tell me more about how this works for small service businesses. Do you have customers in logistics or facilities management?", classification: "positive", status: "pending" },
    { contact: 9, channel: "whatsapp", content: "Hey, we actually looked at this a few weeks ago. What's the pricing for 10 users? Also do you integrate with QuickBooks?", classification: "question", status: "pending" },
    { contact: 5, channel: "linkedin", content: "Thanks for reaching out. We're locked into our current tool for at least 6 more months on contract. Maybe circle back then?", classification: "objection", status: "handled" },
    { contact: 11, channel: "email", content: "Hey! We just closed our seed round and would love to try this. Can you set up a call with our Head of Ops this week?", classification: "positive", status: "handled" },
  ];

  for (const r of replies) {
    await run(`INSERT INTO reply_events (id, org_id, contact_id, channel, content, classification, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), orgId, contactIds[r.contact], r.channel, r.content, r.classification, r.status]);
  }

  // --- Integrations (Gmail connected, others mixed) ---
  const integrations = [
    { type: "gmail", category: "channel", status: "connected", creds: { email: "team@flowdesk.io" }, lastSync: 0 },
    { type: "whatsapp", category: "channel", status: "disconnected", creds: {}, lastSync: null },
    { type: "csv", category: "lead_source", status: "connected", creds: {}, lastSync: 1 },
    { type: "google_sheets", category: "lead_source", status: "connected", creds: { sheet_url: "https://docs.google.com/spreadsheets/d/1abc..." }, lastSync: 2 },
    { type: "hubspot", category: "lead_source", status: "disconnected", creds: {}, lastSync: null },
    { type: "google_calendar", category: "calendar", status: "connected", creds: { calendar_id: "primary" }, lastSync: 0 },
    { type: "calendly", category: "calendar", status: "disconnected", creds: {}, lastSync: null },
  ];

  for (const i of integrations) {
    await run(`INSERT INTO integrations (id, org_id, type, category, status, credentials, last_synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), orgId, i.type, i.category, i.status, JSON.stringify(i.creds), i.lastSync !== null ? daysAgo(i.lastSync) : null]);
  }

  // --- Subscription (growth plan, 87 touches used) ---
  await run(`INSERT INTO subscriptions (id, org_id, plan, status, touches_limit, touches_used, price_monthly) VALUES (?, ?, 'growth', 'active', 2000, 87, 14900)`, [uuid(), orgId]);

  // --- Rich Activity Log ---
  const activityData = [
    { action: "Scan complete.3 contacts due, 3 touches drafted", detail: "cold_outbound sequence", status: "info", contact: null, hoursAgo: 0.5 },
    { action: "Drafted follow-up for Sarah Chen, awaiting approval", detail: "Touch 3: different_angle / email", status: "pending", contact: "Sarah Chen", hoursAgo: 0.5 },
    { action: "Drafted follow-up for Tunde Adeyemi, awaiting approval", detail: "Touch 2: value_add / email", status: "pending", contact: "Tunde Adeyemi", hoursAgo: 0.5 },
    { action: "Drafted message for Priya Sharma, awaiting approval", detail: "Touch 3: different_angle / whatsapp (channel switch)", status: "pending", contact: "Priya Sharma", hoursAgo: 0.5 },
    { action: "Oluwaseun Bakare replied, classified as question", detail: "Asked about pricing for 10 users and QuickBooks integration", status: "success", contact: "Oluwaseun Bakare", hoursAgo: 2 },
    { action: "David Mensah replied, classified as positive", detail: "\"Interesting, tell me more about how this works...\"", status: "success", contact: "David Mensah", hoursAgo: 5 },
    { action: "Approved & sent touch to James Obi", detail: "Touch 1: trigger_event / email", status: "success", contact: "James Obi", hoursAgo: 8 },
    { action: "Approved & sent touch to Maria Santos", detail: "Touch 1: trigger_event / email, Series A congrats angle", status: "success", contact: "Maria Santos", hoursAgo: 12 },
    { action: "Chen Wei.no reply after 4 touches, moving to revival", detail: "Final touch (revival angle) scheduled for day 18", status: "warning", contact: "Chen Wei", hoursAgo: 24 },
    { action: "Emmanuel Nwosu.sequence completed, meeting booked!", detail: "Replied on touch 3, meeting scheduled for next Tuesday", status: "success", contact: "Emmanuel Nwosu", hoursAgo: 48 },
    { action: "Chen Wei replied, classified as objection", detail: "\"Locked into current tool for 6 months\"", status: "warning", contact: "Chen Wei", hoursAgo: 72 },
    { action: "Imported 12 contacts from CSV", detail: "Assigned to cold_outbound sequence", status: "info", contact: null, hoursAgo: 168 },
    { action: "Sammy onboarded.shadow mode activated", detail: "Persona generated, 3 voice samples captured", status: "info", contact: null, hoursAgo: 170 },
    { action: "Gmail integration connected", detail: "team@flowdesk.io", status: "success", contact: null, hoursAgo: 170 },
    { action: "Google Sheets connected", detail: "Lead pipeline sheet synced", status: "success", contact: null, hoursAgo: 169 },
  ];

  for (const a of activityData) {
    const ts = new Date(); ts.setHours(ts.getHours() - a.hoursAgo);
    await run(`INSERT INTO activity_log (id, org_id, action, detail, status, contact_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), orgId, a.action, a.detail, a.status, a.contact, ts.toISOString()]);
  }

  // --- Knowledge Base ---
  const knowledge = [
    { content: "FlowDesk pricing: Starter $29/mo (up to 5 users), Growth $79/mo (up to 15 users), Scale $149/mo (up to 50 users). All plans include unlimited projects and free trial.", source: "pricing.md" },
    { content: "FlowDesk integrates with: Slack, Google Workspace, Microsoft 365, Zapier, and API access on Growth+ plans. QuickBooks integration coming Q3.", source: "integrations.md" },
    { content: "Migration from Jira/Asana/Monday: We offer free migration assistance for teams on Growth and Scale plans. Takes 1-2 hours with our support team.", source: "migration.md" },
    { content: "Free trial: 14 days, no credit card required. Full access to all features on the Growth plan during trial.", source: "trial.md" },
    { content: "Security: SOC 2 Type II certified, GDPR compliant, data encrypted at rest and in transit. Enterprise SSO available on Scale plan.", source: "security.md" },
  ];

  for (const k of knowledge) {
    await run(`INSERT INTO knowledge_chunks (id, org_id, content, source, metadata) VALUES (?, ?, ?, ?, '{}')`, [uuid(), orgId, k.content, k.source]);
  }

  console.log(`Seeded org: ${orgId}`);
  console.log(`Seeded teammate: ${teammateId}`);
  console.log(`Seeded ${sequences.length} sequences, ${contactData.length} contacts, ${touchData.length} touches, ${replies.length} replies, ${activityData.length} activities`);
}

function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }

seed();
