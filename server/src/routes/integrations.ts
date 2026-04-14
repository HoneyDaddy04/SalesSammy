import { Router } from "express";
import { v4 as uuid } from "uuid";
import { queryAll, queryOne, run } from "../db/database.js";
import { encrypt, decrypt } from "../services/vault.js";
import { getChannel } from "../channels/registry.js";

const router = Router();

/** GET /api/integrations?org_id=xxx - list all integrations with status */
router.get("/", async (req, res) => {
  const orgId = req.query.org_id as string;
  if (!orgId) { res.status(400).json({ error: "org_id required" }); return; }
  const rows = await queryAll(`SELECT * FROM integrations WHERE org_id = ? ORDER BY category, type`, [orgId]);
  // Never expose raw credentials to frontend
  const safe = rows.map((r: any) => ({
    ...r,
    credentials: r.credentials && r.credentials !== "{}" ? "[encrypted]" : "{}",
  }));
  res.json(safe);
});

/** POST /api/integrations/connect - connect an integration */
router.post("/connect", async (req, res) => {
  const { org_id, type, category, credentials, config: cfg } = req.body;
  if (!org_id || !type) { res.status(400).json({ error: "org_id and type required" }); return; }

  // Check if already exists
  const existing = await queryOne(`SELECT id FROM integrations WHERE org_id = ? AND type = ?`, [org_id, type]);

  const encryptedCreds = encrypt(JSON.stringify(credentials || {}));

  if (existing) {
    await run(
      `UPDATE integrations SET status = 'connected', credentials = ?, config = ?, last_synced_at = NOW() WHERE id = ?`,
      [encryptedCreds, JSON.stringify(cfg || {}), existing.id]
    );
    res.json({ id: existing.id, status: "connected" });
  } else {
    const id = uuid();
    await run(
      `INSERT INTO integrations (id, org_id, type, category, status, credentials, config, last_synced_at) VALUES (?, ?, ?, ?, 'connected', ?, ?, NOW())`,
      [id, org_id, type, category || "channel", encryptedCreds, JSON.stringify(cfg || {})]
    );
    res.json({ id, status: "connected" });
  }
});

/** POST /api/integrations/disconnect - disconnect an integration */
router.post("/disconnect", async (req, res) => {
  const { org_id, type } = req.body;
  if (!org_id || !type) { res.status(400).json({ error: "org_id and type required" }); return; }

  await run(
    `UPDATE integrations SET status = 'disconnected', credentials = '{}' WHERE org_id = ? AND type = ?`,
    [org_id, type]
  );
  res.json({ status: "disconnected" });
});

/** POST /api/integrations/test - test a connection */
router.post("/test", async (req, res) => {
  const { org_id, type } = req.body;
  if (!org_id || !type) { res.status(400).json({ error: "org_id and type required" }); return; }

  const integration = await queryOne(`SELECT * FROM integrations WHERE org_id = ? AND type = ?`, [org_id, type]);
  if (!integration) { res.status(404).json({ error: "Integration not found" }); return; }

  const decrypted = decrypt((integration.credentials as string) || "{}");
  const creds = JSON.parse(decrypted);
  const hasCredentials = Object.keys(creds).length > 0;

  if (!hasCredentials) {
    res.json({ status: "no_credentials", message: "No credentials configured" });
    return;
  }

  // Use channel plugin if available
  const plugin = getChannel(type === "gmail" ? "email" : type);
  if (plugin) {
    try {
      await plugin.connect(creds);
      const result = await plugin.testConnection();
      await plugin.disconnect();
      res.json({ status: result.ok ? "ok" : "error", message: result.ok ? "Connection successful" : result.error });
    } catch (err: any) {
      res.json({ status: "error", message: err.message });
    }
  } else {
    res.json({ status: "ok", message: "Connection successful (no plugin to verify)" });
  }
});

export default router;
