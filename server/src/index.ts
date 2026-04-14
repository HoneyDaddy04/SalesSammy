import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { getDb, queryOne } from "./db/database.js";
import { runMigrations } from "./db/migrate.js";

// Channel plugins
import { registerChannel } from "./channels/registry.js";
import { EmailPlugin } from "./channels/email.js";
import { WhatsAppPlugin } from "./channels/whatsapp.js";
import { LinkedInPlugin } from "./channels/linkedin.js";
import { SmsPlugin } from "./channels/sms.js";

// Job runner
import { startJobRunner } from "./services/job-queue.js";

// Routes
import onboardingRouter from "./routes/onboarding.js";
import teammateRouter from "./routes/teammate.js";
import touchQueueRouter from "./routes/touch-queue.js";
import contactsRouter from "./routes/contacts.js";
import activityRouter from "./routes/activity.js";
import standupRouter from "./routes/standup.js";
import triggerRouter from "./routes/trigger.js";
import knowledgeRouter from "./routes/knowledge.js";
import integrationsRouter from "./routes/integrations.js";
import billingRouter from "./routes/billing.js";
import sequencesRouter from "./routes/sequences.js";
import jobsRouter from "./routes/jobs.js";
import contextOverridesRouter from "./routes/context-overrides.js";
import approvalsRouter from "./routes/approvals.js";
import repliesRouter from "./routes/replies.js";

async function start() {
  await getDb();
  await runMigrations();

  // Register channel plugins
  registerChannel(new EmailPlugin());
  registerChannel(new WhatsAppPlugin());
  registerChannel(new LinkedInPlugin());
  registerChannel(new SmsPlugin());

  // Start async job runner (polls every 2s)
  startJobRunner(2000);

  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Returns the first org (demo org) so frontend doesn't need manual config
  app.get("/api/demo", async (_req, res) => {
    const org = await queryOne(`SELECT id, name FROM organizations LIMIT 1`);
    if (!org) { res.status(404).json({ error: "No demo org found" }); return; }
    res.json(org);
  });

  app.use("/api/onboarding", onboardingRouter);
  app.use("/api/teammate", teammateRouter);
  app.use("/api/queue", touchQueueRouter);
  app.use("/api/contacts", contactsRouter);
  app.use("/api/activity", activityRouter);
  app.use("/api/standup", standupRouter);
  app.use("/api/trigger", triggerRouter);
  app.use("/api/knowledge", knowledgeRouter);
  app.use("/api/integrations", integrationsRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/sequences", sequencesRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/context-overrides", contextOverridesRouter);
  app.use("/api/approvals", approvalsRouter);
  app.use("/api/replies", repliesRouter);

  app.listen(config.port, () => {
    console.log(`Vaigence API running on http://localhost:${config.port}`);
  });
}

start().catch(console.error);
