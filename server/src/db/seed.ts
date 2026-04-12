import { getDb, run } from "./database.js";
import { v4 as uuid } from "uuid";
import { runMigrations } from "./migrate.js";

async function seed() {
  await getDb();
  await runMigrations();

  const orgId = uuid();
  run(`INSERT INTO organizations (id, name, industry) VALUES (?, ?, ?)`,
    [orgId, "Demo Company", "SaaS"]);

  // --- 5 Sequence Templates ---

  const sequences = [
    {
      id: uuid(),
      template_key: "cold_outbound",
      name: "Cold Outbound",
      description: "B2B sales, recruiting, agencies. 5 touches over 18 days.",
      touches: [
        { day_offset: 0, angle: "trigger_event", channel_tier: "primary" },
        { day_offset: 3, angle: "value_add", channel_tier: "primary" },
        { day_offset: 7, angle: "different_angle", channel_tier: "secondary" },
        { day_offset: 12, angle: "permission_to_close", channel_tier: "primary" },
        { day_offset: 18, angle: "revival", channel_tier: "secondary" },
      ],
    },
    {
      id: uuid(),
      template_key: "abandoned_cart",
      name: "Abandoned Cart / Inquiry",
      description: "E-commerce, DTC. 3 touches over 5 days, faster cadence.",
      touches: [
        { day_offset: 0, angle: "trigger_event", channel_tier: "primary" },
        { day_offset: 2, angle: "value_add", channel_tier: "primary" },
        { day_offset: 5, angle: "permission_to_close", channel_tier: "secondary" },
      ],
    },
    {
      id: uuid(),
      template_key: "inbound_lead",
      name: "Inbound Lead",
      description: "Real estate, services, B2B demos. 4 touches over 10 days, warmer tone.",
      touches: [
        { day_offset: 0, angle: "trigger_event", channel_tier: "primary" },
        { day_offset: 2, angle: "value_add", channel_tier: "primary" },
        { day_offset: 5, angle: "different_angle", channel_tier: "secondary" },
        { day_offset: 10, angle: "permission_to_close", channel_tier: "primary" },
      ],
    },
    {
      id: uuid(),
      template_key: "re_engagement",
      name: "Re-engagement",
      description: "Any business. Dormant leads. 3 touches over 14 days.",
      touches: [
        { day_offset: 0, angle: "trigger_event", channel_tier: "primary" },
        { day_offset: 7, angle: "different_angle", channel_tier: "secondary" },
        { day_offset: 14, angle: "permission_to_close", channel_tier: "primary" },
      ],
    },
    {
      id: uuid(),
      template_key: "post_meeting",
      name: "Post-Meeting Follow-Up",
      description: "B2B AE, services. 4 touches over 21 days.",
      touches: [
        { day_offset: 1, angle: "trigger_event", channel_tier: "primary" },
        { day_offset: 5, angle: "value_add", channel_tier: "primary" },
        { day_offset: 12, angle: "different_angle", channel_tier: "primary" },
        { day_offset: 21, angle: "permission_to_close", channel_tier: "secondary" },
      ],
    },
  ];

  for (const seq of sequences) {
    run(
      `INSERT INTO sequences (id, template_key, name, description, touches) VALUES (?, ?, ?, ?, ?)`,
      [seq.id, seq.template_key, seq.name, seq.description, JSON.stringify(seq.touches)]
    );
  }

  // --- Demo Teammate ---

  const teammateId = uuid();
  run(
    `INSERT INTO teammate (id, org_id, business_description, target_audience, lead_trigger_signals, lead_source_type, goal, voice_examples, guardrails, escalation_contact, persona_prompt, primary_channel, secondary_channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      teammateId,
      orgId,
      "We sell project management software for small teams. Monthly plans from $29. We help teams stop losing work in spreadsheets and chat threads.",
      "Founders and ops leads at companies with 5-30 people. Usually overwhelmed, juggling too many tools.",
      "They just raised funding, hired new people, or complained about losing track of tasks on social media.",
      "inbound",
      "Book a 15-minute demo call",
      JSON.stringify([
        "Hey Sarah — saw you just brought on 3 new people. Congrats! That's usually when task tracking starts breaking. We built something for exactly that stage. Worth a quick look?",
        "Quick one — noticed your team's growing fast. Most founders at your stage spend 5+ hours/week just keeping everyone aligned. We cut that to zero. Want me to show you how in 15 min?",
      ]),
      JSON.stringify([
        "Never discuss competitor pricing",
        "Don't promise custom features",
        "Don't commit to timelines",
      ]),
      JSON.stringify({ name: "Alex", email: "alex@demo.com", channel: "email" }),
      `You're a friendly, direct follow-up teammate. You work for a project management tool for small teams. Your job is to reach out to leads who've gone quiet, respond when they reply, and book demo calls.

You write like a real person — short sentences, no fluff, no corporate speak. You reference specific things about the lead (recent hiring, funding, social posts) so your messages feel personal, not templated.

You never push too hard. If someone's not interested, you close gracefully. If they have a question you can't answer, you loop in Alex.`,
      "email",
      "whatsapp",
    ]
  );

  // --- Demo Contacts ---

  const coldSeqId = sequences[0].id;
  const now = new Date();

  const contacts = [
    {
      name: "Sarah Chen", email: "sarah@acmecorp.com", company: "Acme Corp",
      metadata: { role: "Head of Ops", team_size: 12, recent_signal: "Hired 3 people last month", linkedin: "linkedin.com/in/sarachen" },
      touch_index: 1, status: "active",
      last_touch_at: daysAgo(4), next_touch_at: daysAgo(-1), // due yesterday
    },
    {
      name: "James Obi", email: "james@startupxyz.com", company: "StartupXYZ",
      metadata: { role: "CTO", team_size: 8, recent_signal: "Posted about project chaos on Twitter", linkedin: "linkedin.com/in/jamesobi" },
      touch_index: 0, status: "active",
      last_touch_at: null, next_touch_at: daysAgo(0), // due today
    },
    {
      name: "Maria Santos", email: "maria@growthco.io", company: "GrowthCo",
      metadata: { role: "Founder", team_size: 20, recent_signal: "Series A announced last week" },
      touch_index: 2, status: "active",
      last_touch_at: daysAgo(8), next_touch_at: daysAgo(-2), // due in 2 days
    },
    {
      name: "David Mensah", email: "david@localservices.ng", company: "LocalServices",
      metadata: { role: "Owner", team_size: 5, recent_signal: "Replied 'interesting, tell me more' 3 days ago" },
      touch_index: 1, status: "replied",
      last_touch_at: daysAgo(3), next_touch_at: null,
    },
  ];

  for (const c of contacts) {
    run(
      `INSERT INTO contacts (id, org_id, name, email, company, source, metadata, sequence_id, touch_index, last_touch_at, next_touch_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), orgId, c.name, c.email, c.company, "csv", JSON.stringify(c.metadata), coldSeqId, c.touch_index, c.last_touch_at, c.next_touch_at, c.status]
    );
  }

  // --- Demo Touch Queue (some pending approvals) ---

  const sarahTouchId = uuid();
  run(
    `INSERT INTO touch_queue (id, org_id, contact_id, sequence_id, touch_index, channel, angle, drafted_content, research_context, status, scheduled_for) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?)`,
    [
      sarahTouchId, orgId,
      // We need Sarah's contact ID — let's query it
      "PLACEHOLDER", coldSeqId, 1, "email", "value_add",
      "Hey Sarah — I know growing from 9 to 12 people sounds great until everyone's asking 'wait, who's doing what?' We built a dead-simple way to keep small teams aligned without another meeting. Takes 10 min to set up. Worth a look?",
      "Sarah Chen is Head of Ops at Acme Corp (12 people). Hired 3 new team members last month. First touch sent 4 days ago (trigger_event angle). No reply yet. LinkedIn shows she's active, posting about team scaling challenges.",
      daysAgo(-1),
    ]
  );

  // --- Demo Activity Log ---

  const activities = [
    { action: "Sent first touch to James Obi", detail: "cold_outbound / trigger_event / email", status: "success", contact_name: "James Obi" },
    { action: "Drafted follow-up for Sarah Chen — awaiting approval", detail: "Touch 2: value_add angle, email", status: "pending", contact_name: "Sarah Chen" },
    { action: "David Mensah replied — classified as positive", detail: "\"interesting, tell me more\"", status: "success", contact_name: "David Mensah" },
    { action: "Scanned 4 contacts, 2 touches due", detail: "Sequence: cold_outbound", status: "info", contact_name: null },
  ];

  for (const a of activities) {
    run(
      `INSERT INTO activity_log (id, org_id, action, detail, status, contact_name) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), orgId, a.action, a.detail, a.status, a.contact_name]
    );
  }

  console.log(`Seeded org: ${orgId}`);
  console.log(`Seeded teammate: ${teammateId}`);
  console.log(`Seeded ${sequences.length} sequence templates`);
  console.log(`Seeded ${contacts.length} contacts`);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

seed();
