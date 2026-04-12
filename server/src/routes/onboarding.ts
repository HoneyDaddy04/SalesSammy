import { Router } from "express";
import { v4 as uuid } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import { queryOne, queryAll, run } from "../db/database.js";
import { config } from "../config/env.js";

const router = Router();
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// The 10 onboarding questions
const QUESTIONS = [
  {
    key: "business_description",
    question: "So tell me — what does your business do? Just a paragraph is fine, like you'd explain it to someone at a coffee shop.",
  },
  {
    key: "target_audience",
    question: "Who are you trying to reach? What kind of person or company? Think role, industry, size — whatever matters.",
  },
  {
    key: "lead_source_type",
    question: "How do these people usually come to you? Cold outreach, inbound from your site, DMs, referrals, abandoned carts — what's the main way?",
  },
  {
    key: "lead_trigger_signals",
    question: "Here's the most important one: what's a sign that someone probably needs you right now? A trigger. Like they just raised funding, posted about a problem you solve, or visited your pricing page.",
  },
  {
    key: "goal",
    question: "What do you want them to do? Book a call, buy something, reply, visit a page — what's the win?",
  },
  {
    key: "lead_source",
    question: "Where do your leads live right now? A spreadsheet, Google Sheets, HubSpot, Shopify, somewhere else? I need to know where to pull them from.",
  },
  {
    key: "channels",
    question: "Where do you message them? Email, WhatsApp, Instagram DMs, LinkedIn, SMS — which channels do you use or want to use?",
  },
  {
    key: "voice_examples",
    question: "This one really matters — can you share 2 or 3 messages you've sent that got good responses? Paste them in. I'll learn your voice from these.",
  },
  {
    key: "guardrails",
    question: "Anything I should never say or promise? Pricing limits, competitor mentions, legal stuff, anything off-limits?",
  },
  {
    key: "escalation",
    question: "Last one — who should I ping when I need help? Give me a name, email, and how you want me to reach them.",
  },
];

/** POST /api/onboarding/start — create org + start interview */
router.post("/start", async (req, res) => {
  const { user_name, user_email, company_name } = req.body;
  if (!company_name) {
    res.status(400).json({ error: "company_name required" });
    return;
  }

  const orgId = uuid();
  const sessionId = uuid();

  run(`INSERT INTO organizations (id, name) VALUES (?, ?)`, [orgId, company_name]);
  run(
    `INSERT INTO onboarding_sessions (id, org_id, current_question, answers) VALUES (?, ?, 0, ?)`,
    [sessionId, orgId, JSON.stringify({ user_name, user_email, company_name })]
  );

  res.json({
    org_id: orgId,
    session_id: sessionId,
    message: `Hey ${user_name || "there"}! I'm your new teammate. Before I start working, I need to learn about your business. 10 quick questions — takes about 15 minutes.\n\nLet's go.\n\n${QUESTIONS[0].question}`,
    question_index: 0,
    total_questions: QUESTIONS.length,
  });
});

/** POST /api/onboarding/answer — answer current question, get next */
router.post("/answer", async (req, res) => {
  const { session_id, answer } = req.body;
  if (!session_id || !answer) {
    res.status(400).json({ error: "session_id and answer required" });
    return;
  }

  const session = queryOne(
    `SELECT * FROM onboarding_sessions WHERE id = ?`,
    [session_id]
  );
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const currentQ = session.current_question as number;
  const answers = JSON.parse(session.answers as string);

  // Store the answer
  answers[QUESTIONS[currentQ].key] = answer;
  const nextQ = currentQ + 1;

  if (nextQ < QUESTIONS.length) {
    // More questions to go
    run(
      `UPDATE onboarding_sessions SET current_question = ?, answers = ? WHERE id = ?`,
      [nextQ, JSON.stringify(answers), session_id]
    );

    // Use Claude for a natural transition to the next question
    const transition = await generateTransition(answer, QUESTIONS[nextQ].question, currentQ);

    res.json({
      message: transition,
      question_index: nextQ,
      total_questions: QUESTIONS.length,
      complete: false,
    });
  } else {
    // All questions answered — generate persona and create teammate
    run(
      `UPDATE onboarding_sessions SET current_question = ?, answers = ?, status = 'complete' WHERE id = ?`,
      [nextQ, JSON.stringify(answers), session_id]
    );

    const orgId = session.org_id as string;
    const result = await finalizeTeammate(orgId, answers);

    res.json({
      message: result.message,
      sample_message: result.sampleMessage,
      org_id: orgId,
      teammate_id: result.teammateId,
      question_index: nextQ,
      total_questions: QUESTIONS.length,
      complete: true,
    });
  }
});

/** POST /api/onboarding/feedback — feedback on the sample message */
router.post("/feedback", async (req, res) => {
  const { org_id, feedback } = req.body;
  if (!org_id) {
    res.status(400).json({ error: "org_id required" });
    return;
  }

  const teammate = queryOne(`SELECT * FROM teammate WHERE org_id = ?`, [org_id]);
  if (!teammate) {
    res.status(404).json({ error: "Teammate not found" });
    return;
  }

  // Append feedback as an operating instruction
  let instructions = teammate.operating_instructions as string || "";
  if (feedback && feedback.trim()) {
    instructions += (instructions ? "\n" : "") + `User feedback on first draft: ${feedback}`;
    run(`UPDATE teammate SET operating_instructions = ? WHERE id = ?`, [instructions, teammate.id]);
  }

  res.json({ status: "ok", message: "Got it — I'll adjust based on your feedback. Ready to get to work." });
});

// --- Helpers ---

async function generateTransition(previousAnswer: string, nextQuestion: string, questionIndex: number): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: `You're onboarding a new user as their AI follow-up teammate. They just answered question ${questionIndex + 1} of 10. Acknowledge their answer briefly (1 short sentence max), then ask the next question naturally. No bullet points, no markdown. Keep it conversational and warm. Don't repeat their answer back to them.`,
    messages: [
      { role: "user", content: `Their answer: "${previousAnswer}"\n\nNext question to ask: "${nextQuestion}"` },
    ],
  });

  return (response.content[0] as Anthropic.TextBlock).text;
}

async function finalizeTeammate(orgId: string, answers: Record<string, string>) {
  // Parse channels from answer
  const channelAnswer = (answers.channels || "email").toLowerCase();
  const primaryChannel = channelAnswer.includes("email") ? "email"
    : channelAnswer.includes("whatsapp") ? "whatsapp"
    : channelAnswer.includes("instagram") ? "instagram"
    : "email";
  const secondaryChannel = channelAnswer.includes("whatsapp") && primaryChannel !== "whatsapp" ? "whatsapp"
    : channelAnswer.includes("email") && primaryChannel !== "email" ? "email"
    : null;

  // Parse voice examples into array
  const voiceExamples = answers.voice_examples
    ? answers.voice_examples.split(/\n{2,}|\d+[\.\)]\s/).filter(Boolean).map(s => s.trim())
    : [];

  // Parse guardrails
  const guardrails = answers.guardrails
    ? answers.guardrails.split(/\n|,|;/).filter(Boolean).map(s => s.trim())
    : [];

  // Pick sequence based on lead source type
  const sourceType = (answers.lead_source_type || "").toLowerCase();
  let sequenceKey = "cold_outbound";
  if (sourceType.includes("inbound") || sourceType.includes("site") || sourceType.includes("demo")) sequenceKey = "inbound_lead";
  else if (sourceType.includes("cart") || sourceType.includes("abandon") || sourceType.includes("shop")) sequenceKey = "abandoned_cart";
  else if (sourceType.includes("referral") || sourceType.includes("dm")) sequenceKey = "inbound_lead";
  else if (sourceType.includes("dormant") || sourceType.includes("old") || sourceType.includes("re-engage")) sequenceKey = "re_engagement";

  // Generate persona prompt
  const personaResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You're creating a persona prompt for an AI follow-up teammate. Based on the user's onboarding answers, write a brief persona that captures who this teammate is, what they do, and how they communicate. Write it in second person ("You are..."). Include the user's actual voice quirks from their sample messages. Max 5 sentences. No markdown.`,
    messages: [
      {
        role: "user",
        content: `Business: ${answers.business_description}
Target: ${answers.target_audience}
How leads come: ${answers.lead_source_type}
Trigger signals: ${answers.lead_trigger_signals}
Goal: ${answers.goal}
Voice examples: ${answers.voice_examples || "none provided"}
Guardrails: ${answers.guardrails || "none"}
Escalation: ${answers.escalation || "none"}`,
      },
    ],
  });

  const personaPrompt = (personaResponse.content[0] as Anthropic.TextBlock).text;

  // Create teammate
  const teammateId = uuid();
  run(
    `INSERT INTO teammate (id, org_id, business_description, target_audience, lead_trigger_signals, lead_source_type, goal, voice_examples, guardrails, escalation_contact, persona_prompt, primary_channel, secondary_channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      teammateId, orgId,
      answers.business_description || "",
      answers.target_audience || "",
      answers.lead_trigger_signals || "",
      answers.lead_source_type || "",
      answers.goal || "",
      JSON.stringify(voiceExamples),
      JSON.stringify(guardrails),
      JSON.stringify({ contact: answers.escalation || "" }),
      personaPrompt,
      primaryChannel,
      secondaryChannel,
    ]
  );

  // Generate a sample message
  const sampleResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    system: `${personaPrompt}\n\nWrite like a real person. Short, warm, direct. No bullet points. Max 3-4 sentences. Reference the trigger signal naturally.`,
    messages: [
      {
        role: "user",
        content: `Draft a first-touch ${primaryChannel === "email" ? "email" : "message"} to a lead who matches this trigger: "${answers.lead_trigger_signals}". The goal is: ${answers.goal}. Channel: ${primaryChannel}.`,
      },
    ],
  });

  const sampleMessage = (sampleResponse.content[0] as Anthropic.TextBlock).text;

  return {
    teammateId,
    sampleMessage,
    message: `Done! I've learned your business, your voice, and what to watch for.\n\nHere's a sample first message I'd send. Let me know what you'd change:\n\n"${sampleMessage}"\n\nEdit it or tell me what to adjust, and I'll learn from that too.`,
  };
}

export default router;
