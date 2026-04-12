import type { TriggerConfig, WorkTarget } from "../types/index.js";

/**
 * Trigger evaluators. Each one scans a data source and returns
 * work targets that match the trigger condition.
 *
 * In production, these call real APIs (HubSpot, Zendesk, Mixpanel).
 * For now, they return mock data to demonstrate the flow.
 */

type TriggerEvaluator = (params: Record<string, unknown>) => Promise<WorkTarget[]>;

const evaluators: Record<string, TriggerEvaluator> = {
  // --- Sales triggers ---

  async idle_lead(params) {
    const days = (params.threshold_days as number) || 3;
    // TODO: Query HubSpot for leads where last_activity > days ago
    // Mock: return leads that haven't been contacted
    return [
      {
        id: `lead-${Date.now()}`,
        type: "lead",
        name: "Sarah Chen",
        email: "sarah@acmecorp.com",
        company: "Acme Corp",
        metadata: { deal_stage: "proposal", last_contact: daysAgo(days + 1), deal_value: "$12,000" },
      },
    ];
  },

  async no_reply(params) {
    const days = (params.threshold_days as number) || 5;
    // TODO: Query email/CRM for sent messages with no reply
    return [
      {
        id: `lead-${Date.now()}`,
        type: "lead",
        name: "James Obi",
        email: "james@startupxyz.com",
        company: "StartupXYZ",
        metadata: { deal_stage: "negotiation", last_contact: daysAgo(days + 2), messages_sent: 3 },
      },
    ];
  },

  async deal_stalled(params) {
    const days = (params.threshold_days as number) || 7;
    // TODO: Query CRM for deals stuck in stage for > days
    return [];
  },

  // --- Support triggers ---

  async sla_breach(params) {
    const warningMin = (params.warning_minutes as number) || 30;
    // TODO: Query Zendesk for tickets approaching SLA
    return [
      {
        id: `ticket-${Date.now()}`,
        type: "ticket",
        name: "Maria Santos",
        email: "maria@bigclient.com",
        company: "BigClient Ltd",
        metadata: { ticket_id: "TKT-501", subject: "Login issues since update", priority: "high", opened: new Date().toISOString(), minutes_open: warningMin + 5 },
      },
    ];
  },

  async stale_ticket(params) {
    const days = (params.threshold_days as number) || 2;
    // TODO: Query Zendesk for tickets with no update in > days
    return [];
  },

  async negative_sentiment(_params) {
    // TODO: Analyze recent ticket messages for negative sentiment
    return [];
  },

  // --- Success triggers ---

  async usage_drop(params) {
    const dropPercent = (params.drop_percent as number) || 30;
    const periodDays = (params.period_days as number) || 14;
    // TODO: Query Mixpanel for users with significant usage decline
    return [
      {
        id: `cust-${Date.now()}`,
        type: "customer",
        name: "David Mensah",
        email: "david@growthco.io",
        company: "GrowthCo",
        metadata: { plan: "Pro", logins_current: 2, logins_previous: 15, drop_percent: 87, period_days: periodDays, unused_features: ["automations", "api", "reports"] },
      },
    ];
  },

  async inactive_user(params) {
    const days = (params.threshold_days as number) || 7;
    // TODO: Query analytics for users with 0 logins in > days
    return [];
  },

  async onboarding_stalled(params) {
    // TODO: Query for users who haven't completed onboarding steps
    return [];
  },
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/**
 * Run a single trigger and return discovered work targets.
 */
export async function evaluateTrigger(trigger: TriggerConfig): Promise<WorkTarget[]> {
  const evaluator = evaluators[trigger.type];
  if (!evaluator) {
    console.warn(`No evaluator for trigger type: ${trigger.type}`);
    return [];
  }
  return evaluator(trigger.params);
}
