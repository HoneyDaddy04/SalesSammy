import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import { config } from "../config/env.js";
import { run, queryOne } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
const router = Router();

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  const user = data.user;
  if (!user) {
    res.status(400).json({ error: "Signup failed" });
    return;
  }

  // Create org + user profile
  const orgId = uuid();
  const orgName = name ? `${name}'s Organization` : `${email}'s Organization`;
  await run(
    `INSERT INTO organizations (id, name) VALUES (?, ?) ON CONFLICT DO NOTHING`,
    [orgId, orgName]
  );
  await run(
    `INSERT INTO user_profiles (id, email, name, org_id, role) VALUES (?, ?, ?, ?, 'owner') ON CONFLICT DO NOTHING`,
    [user.id, email, name || "", orgId]
  );

  res.json({
    user: { id: user.id, email: user.email },
    org_id: orgId,
    access_token: data.session?.access_token || null,
    refresh_token: data.session?.refresh_token || null,
  });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  // Look up user profile to get org_id
  const profile = await queryOne(
    `SELECT org_id FROM user_profiles WHERE id = ?`,
    [data.user.id]
  );

  res.json({
    user: { id: data.user.id, email: data.user.email },
    org_id: profile?.org_id || null,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

// POST /api/auth/logout
router.post("/logout", async (_req: Request, res: Response) => {
  // Client-side token removal is sufficient; optionally call signOut
  await supabase.auth.signOut();
  res.json({ status: "ok" });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const profile = await queryOne(
    `SELECT id, email, name, org_id, role, created_at FROM user_profiles WHERE id = ?`,
    [req.user!.id]
  );
  if (!profile) {
    res.status(404).json({ error: "User profile not found" });
    return;
  }
  res.json(profile);
});

export default router;
