import { ChannelPlugin, SendResult } from "./types.js";
import { config } from "../config/env.js";

/**
 * WhatsApp Cloud API integration.
 * Uses Meta's official API: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Setup:
 * 1. Create a Meta Business Account
 * 2. Create an app at developers.facebook.com
 * 3. Add WhatsApp product to your app
 * 4. Get a permanent token + phone number ID
 * 5. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env
 */

const WA_API_BASE = "https://graph.facebook.com/v21.0";

export class WhatsAppPlugin implements ChannelPlugin {
  name = "WhatsApp Business";
  channelType = "whatsapp";
  private token: string = "";
  private phoneNumberId: string = "";

  async connect(credentials: Record<string, unknown>) {
    this.token = (credentials.whatsapp_token as string) || config.whatsappToken;
    this.phoneNumberId = (credentials.whatsapp_phone_id as string) || config.whatsappPhoneId;
    if (!this.token || !this.phoneNumberId) {
      throw new Error("WhatsApp not configured — need WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID");
    }
  }

  async disconnect() {
    this.token = "";
    this.phoneNumberId = "";
  }

  async send(to: string, content: string): Promise<SendResult> {
    // Auto-connect with platform keys if not explicitly connected
    if (!this.token) {
      this.token = config.whatsappToken;
      this.phoneNumberId = config.whatsappPhoneId;
    }

    if (!this.token || !this.phoneNumberId) {
      return { messageId: "", status: "failed", error: "WhatsApp not configured" };
    }

    // Normalize phone number: remove spaces, dashes, ensure + prefix
    const phone = normalizePhone(to);

    try {
      const res = await fetch(`${WA_API_BASE}/${this.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { body: content },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        console.error("[WHATSAPP] Send failed:", errMsg);
        return { messageId: "", status: "failed", error: errMsg };
      }

      const messageId = data?.messages?.[0]?.id || `wa-${Date.now()}`;
      console.log(`[WHATSAPP] Sent to ${phone} | ID: ${messageId}`);
      return { messageId, status: "sent" };
    } catch (err: any) {
      console.error("[WHATSAPP] Send error:", err.message);
      return { messageId: "", status: "failed", error: err.message };
    }
  }

  async testConnection() {
    const token = this.token || config.whatsappToken;
    const phoneId = this.phoneNumberId || config.whatsappPhoneId;
    if (!token || !phoneId) return { ok: false, error: "Not configured" };

    try {
      const res = await fetch(`${WA_API_BASE}/${phoneId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) return { ok: true };
      const data = await res.json();
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  isConnected() { return !!(this.token && this.phoneNumberId); }
}

/** Normalize a phone number for WhatsApp API (must be E.164 without +) */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "");
}
