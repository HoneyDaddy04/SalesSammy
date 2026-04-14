export interface ResearchContext {
  contactSummary: string;
  previousMessages: { role: "sent" | "received"; content: string; channel: string; date: string }[];
  webInsights: string[];
  knowledgeBaseHits: string[];
  patternInsights: string[];
  contactMemory: string[];
}

export interface DraftResult {
  content: string;
  researchContext: string;
  channel: string;
}

export interface AgentInterface {
  research(orgId: string, contactId: string): Promise<ResearchContext>;
  draft(orgId: string, contactId: string, context: ResearchContext, angle: string, channel: string, touchIndex: number): Promise<DraftResult>;
  classifyReply(orgId: string, replyContent: string, contactId: string): Promise<{ classification: string; routedAction: string }>;
  saveMemory(orgId: string, contactId: string, key: string, value: string): Promise<void>;
  getMemory(orgId: string, contactId: string): Promise<string[]>;
}

// Factory function - swap implementation here
// To swap: change this import to langchain-agent, n8n-agent, etc.
import { ClaudeAgent } from "./claude-agent.js";

export function createAgent(): AgentInterface {
  return new ClaudeAgent();
}
