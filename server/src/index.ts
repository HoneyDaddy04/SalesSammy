import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { getDb } from "./db/database.js";
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
import chatRouter from "./routes/chat.js";

async function start() {
  await getDb();
  await runMigrations();

  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Onboarding
  app.use("/api/onboarding", onboardingRouter);

  // Teammate management
  app.use("/api/teammate", teammateRouter);

  // Core work
  app.use("/api/queue", touchQueueRouter);
  app.use("/api/contacts", contactsRouter);
  app.use("/api/activity", activityRouter);
  app.use("/api/standup", standupRouter);
  app.use("/api/trigger", triggerRouter);

  // Knowledge + sandbox chat (kept)
  app.use("/api/knowledge", knowledgeRouter);
  app.use("/api/chat", chatRouter);

  app.listen(config.port, () => {
    console.log(`Vaigence API running on http://localhost:${config.port}`);
  });
}

start().catch(console.error);
