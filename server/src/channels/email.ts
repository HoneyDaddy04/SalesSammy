import { ChannelPlugin, SendResult } from "./types.js";

export class EmailPlugin implements ChannelPlugin {
  name = "Gmail";
  channelType = "email";
  private connected = false;
  private credentials: Record<string, unknown> = {};

  async connect(credentials: Record<string, unknown>) {
    this.credentials = credentials;
    // TODO: Initialize Gmail API client (OAuth2) with credentials
    this.connected = true;
  }

  async disconnect() {
    this.credentials = {};
    this.connected = false;
  }

  async send(to: string, content: string, metadata?: Record<string, unknown>): Promise<SendResult> {
    if (!this.connected) return { messageId: "", status: "failed", error: "Not connected" };
    // TODO: Send via Gmail API
    console.log(`[EMAIL] To: ${to} | ${content.substring(0, 60)}...`);
    return { messageId: `email-${Date.now()}`, status: "sent" };
  }

  async testConnection() {
    // TODO: Call Gmail API to verify token
    return { ok: this.connected };
  }

  isConnected() { return this.connected; }
}
