import { ChannelPlugin, SendResult } from "./types.js";

export class SmsPlugin implements ChannelPlugin {
  name = "SMS (Twilio)";
  channelType = "sms";
  private connected = false;

  async connect(credentials: Record<string, unknown>) {
    // TODO: Initialize Twilio client
    this.connected = true;
  }

  async disconnect() { this.connected = false; }

  async send(to: string, content: string): Promise<SendResult> {
    if (!this.connected) return { messageId: "", status: "failed", error: "Not connected" };
    console.log(`[SMS] To: ${to} | ${content.substring(0, 60)}...`);
    return { messageId: `sms-${Date.now()}`, status: "sent" };
  }

  async testConnection() { return { ok: this.connected }; }
  isConnected() { return this.connected; }
}
