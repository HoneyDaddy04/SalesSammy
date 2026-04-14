import { Router } from "express";
import { queryOne, run } from "../db/database.js";

const router = Router();

/** GET /api/billing?org_id=xxx - current plan and usage */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }

  const sub = await queryOne(`SELECT * FROM subscriptions WHERE org_id = ?`, [orgId]);
  if (!sub) {
    res.json({
      plan: "starter",
      status: "active",
      touches_limit: 500,
      touches_used: 0,
      price_monthly: 0,
      billing_cycle_start: null,
    });
    return;
  }

  res.json(sub);
});

/** POST /api/billing/upgrade - change plan */
router.post("/upgrade", async (req, res) => {
  const { org_id, plan } = req.body;
  if (!org_id || !plan) { res.status(400).json({ error: "org_id and plan required" }); return; }

  const limits: Record<string, { limit: number; price: number }> = {
    starter: { limit: 500, price: 5000 },
    growth: { limit: 2000, price: 15000 },
    scale: { limit: 10000, price: 50000 },
  };

  const planConfig = limits[plan];
  if (!planConfig) { res.status(400).json({ error: "Invalid plan" }); return; }

  await run(
    `UPDATE subscriptions SET plan = ?, touches_limit = ?, price_monthly = ? WHERE org_id = ?`,
    [plan, planConfig.limit, planConfig.price, org_id]
  );

  res.json({ status: "upgraded", plan, touches_limit: planConfig.limit });
});

export default router;
