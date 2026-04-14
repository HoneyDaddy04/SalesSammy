import { ChannelPlugin, SendResult } from "./types.js";

export class WhatsAppPlugin implements ChannelPlugin {
  name = "WhatsApp Business";
  channelType = "whatsapp";
  private connected = false;

  async connect(credentials: Record<string, unknown>) {
    // TODO: Initialize WhatsApp Business API client
    this.connected = true;
  }

  async disconnect() { this.connected = false; }

  async send(to: string, content: string): Promise<SendResult> {
    if (!this.connected) return { messageId: "", status: "failed", error: "Not connected" };
    console.log(`[WHATSAPP] To: ${to} | ${content.substring(0, 60)}...`);
    return { messageId: `wa-${Date.now()}`, status: "sent" };
  }

  async testConnection() { return { ok: this.connected }; }
  isConnected() { return this.connected; }
}
