import { runAgent } from "../engine/agent.js";
import type { InboundMessage, OutboundMessage, ChannelType } from "../types/index.js";

type ChannelSender = (message: OutboundMessage) => Promise<void>;

const channelSenders: Partial<Record<ChannelType, ChannelSender>> = {};

/**
 * Register a channel's send function.
 * Each channel connector calls this on startup.
 */
export function registerChannel(channel: ChannelType, sender: ChannelSender) {
  channelSenders[channel] = sender;
}

/**
 * Route an inbound message through the agent engine and send the response
 * back via the originating channel.
 */
export async function handleInboundMessage(
  message: InboundMessage
): Promise<{ response: string; conversationId: string }> {
  // Run through agent engine
  const result = await runAgent(message);

  // Send response back through the channel
  const sender = channelSenders[message.channel];
  if (sender) {
    await sender({
      channel: message.channel,
      customer_id: message.customer_id,
      content: result.response,
      conversation_id: result.conversationId,
    });
  }

  return result;
}
