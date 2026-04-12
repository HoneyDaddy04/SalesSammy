import { Router } from "express";
import { handleInboundMessage } from "../services/router.js";

const router = Router();

/**
 * POST /api/chat
 * Sandbox / web chat endpoint.
 * Accepts a message and returns the agent's response.
 */
router.post("/", async (req, res) => {
  const { org_id, agent_id, customer_id, message } = req.body;

  if (!org_id || !agent_id || !message) {
    res.status(400).json({ error: "Missing required fields: org_id, agent_id, message" });
    return;
  }

  try {
    const result = await handleInboundMessage({
      channel: "sandbox",
      org_id,
      agent_id,
      customer_id: customer_id || "anonymous-" + Date.now(),
      content: message,
    });

    res.json({
      response: result.response,
      conversation_id: result.conversationId,
    });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
