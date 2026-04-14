import type { ResearchStep, WorkTarget } from "../types/index.js";
import { searchKnowledge } from "./memory.js";

/**
 * Research steps. Each step gathers context about a work target
 * so the agent can make an informed decision about what to do.
 *
 * In production, these call real APIs. For now, mock data.
 */

type Researcher = (target: WorkTarget, orgId: string) => Promise<string>;

const researchers: Record<ResearchStep, Researcher> = {
  async contact_profile(target) {
    // TODO: Enrich from Apollo, LinkedIn, etc.
    return `${target.name} is at ${target.company || "unknown company"}. Email: ${target.email || "unknown"}. ${target.metadata.deal_stage ? `Deal stage: ${target.metadata.deal_stage}.` : ""} ${target.metadata.plan ? `Plan: ${target.metadata.plan}.` : ""}`;
  },

  async company_info(target) {
    // TODO: Company enrichment API
    const company = target.company || "Unknown";
    return `${company} — details not yet enriched. Connect a company data source to get industry, size, funding info.`;
  },

  async past_conversations(target) {
    // TODO: Pull from conversation history / CRM notes
    const lastContact = target.metadata.last_contact;
    return lastContact
      ? `Last contact with ${target.name}: ${lastContact}. ${target.metadata.messages_sent ? `${target.metadata.messages_sent} messages sent.` : ""}`
      : `No previous conversation history found for ${target.name}.`;
  },

  async knowledge_base(_target, orgId) {
    // Search knowledge base for relevant info
    const targetType = _target.type;
    const query = targetType === "ticket"
      ? ((_target.metadata.subject as string) || _target.name)
      : _target.company || _target.name;

    const results = await searchKnowledge(orgId, query);
    return results.length > 0
      ? `Relevant knowledge:\n${results.join("\n")}`
      : "No relevant knowledge base articles found.";
  },

  async usage_metrics(target) {
    // TODO: Pull from Mixpanel/analytics
    const meta = target.metadata;
    if (meta.logins_current !== undefined) {
      return `Usage: ${meta.logins_current} logins in current period vs ${meta.logins_previous} previously (${meta.drop_percent}% drop). Unused features: ${(meta.unused_features as string[])?.join(", ") || "none tracked"}.`;
    }
    return `No usage metrics available for ${target.name}.`;
  },

  async ticket_history(target) {
    // TODO: Pull from Zendesk
    const meta = target.metadata;
    return `Ticket: ${meta.ticket_id || "unknown"} — "${meta.subject || "no subject"}". Priority: ${meta.priority || "normal"}. Opened: ${meta.opened || "unknown"}.`;
  },
};

/**
 * Run research steps and return combined context string.
 */
export async function runResearch(
  steps: ResearchStep[],
  target: WorkTarget,
  orgId: string
): Promise<string> {
  const results: string[] = [];

  for (const step of steps) {
    const researcher = researchers[step];
    if (!researcher) {
      console.warn(`No researcher for step: ${step}`);
      continue;
    }
    const result = await researcher(target, orgId);
    if (result) results.push(result);
  }

  return results.join("\n\n");
}
