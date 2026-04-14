import { Router, raw } from "express";
import crypto from "crypto";
import { queryOne, run } from "../db/database.js";
import { config } from "../config/env.js";

const router = Router();

const PLANS: Record<string, { amount: number; limit: number }> = {
  starter: { amount: 2900, limit: 500 },
  growth: { amount: 14900, limit: 2000 },
  scale: { amount: 49900, limit: 10000 },
};

const PAYSTACK_API = "https://api.paystack.co";

function paystackHeaders() {
  return {
    Authorization: `Bearer ${config.paystackSecretKey}`,
    "Content-Type": "application/json",
  };
}

/** POST /api/billing/initialize — Start a Paystack transaction */
router.post("/initialize", async (req, res) => {
  const { org_id, plan, email } = req.body;
  if (!org_id || !plan || !email) {
    res.status(400).json({ error: "org_id, plan, and email required" });
    return;
  }

  const planConfig = PLANS[plan];
  if (!planConfig) {
    res.status(400).json({ error: "Invalid plan. Must be starter, growth, or scale" });
    return;
  }

  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: paystackHeaders(),
      body: JSON.stringify({
        email,
        amount: planConfig.amount * 100, // Paystack expects kobo/cents
        metadata: { org_id, plan },
      }),
    });

    const data = await response.json() as any;
    if (!response.ok) {
      console.error("Paystack initialize error:", data);
      res.status(502).json({ error: "Failed to initialize payment" });
      return;
    }

    res.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err: any) {
    console.error("Paystack initialize error:", err.message);
    res.status(502).json({ error: "Failed to initialize payment" });
  }
});

/** POST /api/billing/webhook — Paystack webhook (signature-verified) */
router.post("/webhook", raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["x-paystack-signature"] as string;
  if (!signature) {
    res.status(400).json({ error: "Missing signature" });
    return;
  }

  const body = typeof req.body === "string" ? req.body : req.body.toString();
  const hash = crypto
    .createHmac("sha512", config.paystackSecretKey)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { metadata, customer, reference } = event.data;
    const orgId = metadata?.org_id;
    const plan = metadata?.plan;

    if (orgId && plan) {
      const planConfig = PLANS[plan];
      await run(
        `UPDATE subscriptions SET plan = $1, status = 'active', touches_limit = $2, price_monthly = $3, paystack_reference = $4, paystack_customer_email = $5 WHERE org_id = $6`,
        [plan, planConfig.limit, planConfig.amount, reference, customer?.email, orgId]
      );
    }
  }

  res.sendStatus(200);
});

/** GET /api/billing/subscription?org_id=xxx — Current subscription */
router.get("/subscription", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) {
    res.status(400).json({ error: "org_id required" });
    return;
  }

  const sub = await queryOne(`SELECT * FROM subscriptions WHERE org_id = $1`, [orgId]);
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

/** GET /api/billing — Alias for subscription (backward compat) */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) {
    res.status(400).json({ error: "org_id required" });
    return;
  }

  const sub = await queryOne(`SELECT * FROM subscriptions WHERE org_id = $1`, [orgId]);
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

/** POST /api/billing/cancel — Cancel subscription */
router.post("/cancel", async (req, res) => {
  const { org_id } = req.body;
  if (!org_id) {
    res.status(400).json({ error: "org_id required" });
    return;
  }

  await run(
    `UPDATE subscriptions SET status = 'cancelled' WHERE org_id = $1`,
    [org_id]
  );

  res.json({ status: "cancelled" });
});

export default router;
