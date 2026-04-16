// Local development server — no Postgres, no Supabase, no auth.
// Uses SQLite via better-sqlite3 (auto-detected when DATABASE_URL is unset).
delete process.env.DATABASE_URL;

import express from "express";
import cors from "cors";
import { getDb, queryOne } from "./db/database.js";
import { runMigrations } from "./db/migrate.js";

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

  const port = parseInt(process.env.PORT || "3001", 10);

  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", mode: "local-sqlite", timestamp: new Date().toISOString() });
  });

  // Returns the first org (demo org) so frontend doesn't need manual config
  app.get("/api/demo", async (_req, res) => {
    const org = await queryOne(`SELECT id, name FROM organizations LIMIT 1`);
    if (!org) { res.status(404).json({ error: "No demo org found. Run: npm run seed:local" }); return; }
    res.json(org);
  });

  // All routes are public (no auth middleware)
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
  app.use("/api/admin", adminRouter);

  app.listen(port, () => {
    console.log(`Vaigence LOCAL API running on http://localhost:${port} (SQLite mode, no auth)`);
  });
}

start().catch(console.error);
