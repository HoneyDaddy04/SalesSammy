import { Resend } from "resend";
import { ChannelPlugin, SendResult } from "./types.js";
import { config } from "../config/env.js";

export class EmailPlugin implements ChannelPlugin {
  name = "Email (Resend)";
  channelType = "email";
  private resend: Resend | null = null;
  private fromEmail = config.resendFromEmail;

  async connect(credentials: Record<string, unknown>) {
    // Use per-org API key if provided, otherwise fall back to platform key
    const apiKey = (credentials.resend_api_key as string) || config.resendApiKey;
    const from = (credentials.from_email as string) || config.resendFromEmail;
    if (!apiKey) throw new Error("No Resend API key configured");
    this.resend = new Resend(apiKey);
    this.fromEmail = from;
  }

  async disconnect() {
    this.resend = null;
  }

  async send(to: string, content: string, metadata?: Record<string, unknown>): Promise<SendResult> {
    if (!this.resend) {
      // Auto-connect with platform key if not explicitly connected
      if (config.resendApiKey) {
        this.resend = new Resend(config.resendApiKey);
      } else {
        return { messageId: "", status: "failed", error: "Email not configured — add RESEND_API_KEY" };
      }
    }

    try {
      const subject = (metadata?.subject as string) || extractSubject(content);
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        text: content,
      });

      if (error) {
        console.error("[EMAIL] Send failed:", error);
        return { messageId: "", status: "failed", error: error.message };
      }

      console.log(`[EMAIL] Sent to ${to} | ID: ${data?.id}`);
      return { messageId: data?.id || `email-${Date.now()}`, status: "sent" };
    } catch (err: any) {
      console.error("[EMAIL] Send error:", err.message);
      return { messageId: "", status: "failed", error: err.message };
    }
  }

  async testConnection() {
    if (!this.resend && config.resendApiKey) {
      this.resend = new Resend(config.resendApiKey);
    }
    if (!this.resend) return { ok: false, error: "No API key" };
    try {
      // Resend doesn't have a dedicated test endpoint, so we verify the key works
      // by listing domains (free tier has at least the onboarding domain)
      await this.resend.domains.list();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  isConnected() { return !!this.resend; }
}

/** Extract a reasonable subject line from the message content */
function extractSubject(content: string): string {
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length <= 60) return firstLine;
  return firstLine.slice(0, 57) + "...";
}
