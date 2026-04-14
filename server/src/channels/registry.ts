import { ChannelPlugin } from "./types.js";

const plugins = new Map<string, ChannelPlugin>();

export function registerChannel(plugin: ChannelPlugin): void {
  plugins.set(plugin.channelType, plugin);
}

export function getChannel(channelType: string): ChannelPlugin | undefined {
  return plugins.get(channelType);
}

export function listChannels(): string[] {
  return Array.from(plugins.keys());
}
