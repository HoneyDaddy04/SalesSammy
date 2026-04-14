export interface SendResult {
  messageId: string;
  status: "sent" | "queued" | "failed";
  error?: string;
}

export interface ChannelPlugin {
  /** Display name (e.g. "Gmail", "WhatsApp Business") */
  name: string;
  /** Maps to ChannelType (e.g. "email", "whatsapp") */
  channelType: string;
  /** Initialize with decrypted credentials */
  connect(credentials: Record<string, unknown>): Promise<void>;
  /** Tear down connection */
  disconnect(): Promise<void>;
  /** Send a message to a recipient */
  send(to: string, content: string, metadata?: Record<string, unknown>): Promise<SendResult>;
  /** Verify credentials are valid */
  testConnection(): Promise<{ ok: boolean; error?: string }>;
  /** Whether connect() has been called successfully */
  isConnected(): boolean;
}
