import { ChannelPlugin, SendResult } from "./types.js";

export class LinkedInPlugin implements ChannelPlugin {
  name = "LinkedIn";
  channelType = "linkedin";
  private connected = false;

  async connect(credentials: Record<string, unknown>) {
    // TODO: Initialize LinkedIn Messaging API
    this.connected = true;
  }

  async disconnect() { this.connected = false; }

  async send(to: string, content: string): Promise<SendResult> {
    if (!this.connected) return { messageId: "", status: "failed", error: "Not connected" };
    console.log(`[LINKEDIN] To: ${to} | ${content.substring(0, 60)}...`);
    return { messageId: `li-${Date.now()}`, status: "sent" };
  }

  async testConnection() { return { ok: this.connected }; }
  isConnected() { return this.connected; }
}
