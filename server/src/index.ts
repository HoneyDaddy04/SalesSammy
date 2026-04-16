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

// Auth
import authRouter from "./auth/routes.js";
import { requireAuth } from "./middleware/auth.js";

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
import adminRouter from "./routes/admin.js";

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

  const allowedOrigins = config.corsOrigin
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    })
  );
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

  // Public routes (no auth required)
  app.use("/api/auth", authRouter);
  app.use("/api/onboarding", onboardingRouter);

  // Protected routes (auth required)
  app.use("/api/teammate", requireAuth, teammateRouter);
  app.use("/api/queue", requireAuth, touchQueueRouter);
  app.use("/api/contacts", requireAuth, contactsRouter);
  app.use("/api/activity", requireAuth, activityRouter);
  app.use("/api/standup", requireAuth, standupRouter);
  app.use("/api/trigger", requireAuth, triggerRouter);
  app.use("/api/knowledge", requireAuth, knowledgeRouter);
  app.use("/api/integrations", requireAuth, integrationsRouter);
  app.use("/api/billing", requireAuth, billingRouter);
  app.use("/api/sequences", requireAuth, sequencesRouter);
  app.use("/api/jobs", requireAuth, jobsRouter);
  app.use("/api/context-overrides", requireAuth, contextOverridesRouter);
  app.use("/api/approvals", requireAuth, approvalsRouter);
  app.use("/api/replies", requireAuth, repliesRouter);

  // Admin routes (TODO: add admin-specific auth middleware)
  app.use("/api/admin", requireAuth, adminRouter);

  app.listen(config.port, () => {
    console.log(`Vaigence API running on http://localhost:${config.port}`);
  });
}

start().catch(console.error);
