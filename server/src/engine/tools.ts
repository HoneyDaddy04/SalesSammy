import Anthropic from "@anthropic-ai/sdk";

// Tool definitions that agents can use.
// Each tool is defined as a Claude API tool schema + an execute function.

export interface ToolDefinition {
  schema: Anthropic.Tool;
  execute: (input: Record<string, unknown>) => Promise<string>;
}

// --- Sales Agent Tools ---

const lookup_lead: ToolDefinition = {
  schema: {
    name: "lookup_lead",
    description:
      "Look up a lead or prospect in the CRM by name or email. Returns their company, role, deal stage, and recent activity.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Name or email of the lead to search for",
        },
      },
      required: ["query"],
    },
  },
  async execute(input) {
    // TODO: Replace with real HubSpot/CRM API call
    return JSON.stringify({
      name: input.query,
      company: "Acme Corp",
      role: "Head of Operations",
      deal_stage: "Evaluation",
      last_activity: "Viewed pricing page 2 days ago",
      lead_score: 72,
    });
  },
};

const schedule_meeting: ToolDefinition = {
  schema: {
    name: "schedule_meeting",
    description:
      "Schedule a meeting with a prospect. Creates a calendar event and sends an invite.",
    input_schema: {
      type: "object" as const,
      properties: {
        attendee_email: { type: "string", description: "Email of the person to meet with" },
        topic: { type: "string", description: "Meeting topic or agenda" },
        preferred_time: { type: "string", description: "Preferred time (e.g., 'tomorrow afternoon', 'next Tuesday 2pm')" },
      },
      required: ["attendee_email", "topic"],
    },
  },
  async execute(input) {
    // TODO: Replace with Calendly/Google Calendar API
    return JSON.stringify({
      status: "scheduled",
      meeting_link: "https://meet.example.com/abc123",
      time: input.preferred_time || "Next available slot: Tomorrow 2:00 PM",
    });
  },
};

const send_followup: ToolDefinition = {
  schema: {
    name: "send_followup",
    description: "Send a follow-up email to a prospect after a conversation.",
    input_schema: {
      type: "object" as const,
      properties: {
        to_email: { type: "string", description: "Recipient email" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body content" },
      },
      required: ["to_email", "subject", "body"],
    },
  },
  async execute(input) {
    // TODO: Replace with email API (SendGrid, Gmail, etc.)
    return JSON.stringify({ status: "sent", to: input.to_email });
  },
};

// --- Support Agent Tools ---

const check_order_status: ToolDefinition = {
  schema: {
    name: "check_order_status",
    description: "Check the status of a customer's order by order ID or customer email.",
    input_schema: {
      type: "object" as const,
      properties: {
        order_id: { type: "string", description: "Order ID to look up" },
        customer_email: { type: "string", description: "Customer email (alternative to order ID)" },
      },
      required: [],
    },
  },
  async execute(input) {
    // TODO: Replace with Stripe/order management API
    return JSON.stringify({
      order_id: input.order_id || "ORD-4821",
      status: "shipped",
      tracking: "1Z999AA10123456784",
      estimated_delivery: "2026-04-15",
      items: ["Pro Plan - Annual"],
    });
  },
};

const create_ticket: ToolDefinition = {
  schema: {
    name: "create_ticket",
    description: "Create a support ticket for an issue that needs further investigation.",
    input_schema: {
      type: "object" as const,
      properties: {
        subject: { type: "string", description: "Ticket subject" },
        description: { type: "string", description: "Detailed description of the issue" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Ticket priority" },
        customer_email: { type: "string", description: "Customer's email" },
      },
      required: ["subject", "description", "priority"],
    },
  },
  async execute(input) {
    // TODO: Replace with Zendesk/ticketing API
    return JSON.stringify({
      ticket_id: "TKT-" + Math.floor(Math.random() * 10000),
      status: "created",
      priority: input.priority,
    });
  },
};

const process_refund: ToolDefinition = {
  schema: {
    name: "process_refund",
    description: "Process a refund for a customer. Checks eligibility and initiates the refund.",
    input_schema: {
      type: "object" as const,
      properties: {
        order_id: { type: "string", description: "Order ID to refund" },
        reason: { type: "string", description: "Reason for refund" },
        amount: { type: "number", description: "Refund amount (leave empty for full refund)" },
      },
      required: ["order_id", "reason"],
    },
  },
  async execute(input) {
    // TODO: Replace with Stripe refund API
    return JSON.stringify({
      refund_id: "REF-" + Math.floor(Math.random() * 10000),
      order_id: input.order_id,
      status: "processing",
      estimated_days: 3,
    });
  },
};

const search_knowledge: ToolDefinition = {
  schema: {
    name: "search_knowledge",
    description: "Search the company knowledge base for relevant articles, FAQs, and documentation.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  async execute(input) {
    // TODO: Replace with vector search against knowledge_chunks table
    return JSON.stringify({
      results: [
        { title: "Refund Policy", snippet: "Full refunds within 30 days of purchase. After 30 days, store credit.", relevance: 0.92 },
        { title: "Billing FAQ", snippet: "You can manage your subscription from Settings > Billing.", relevance: 0.78 },
      ],
    });
  },
};

// --- Success Agent Tools ---

const check_usage_metrics: ToolDefinition = {
  schema: {
    name: "check_usage_metrics",
    description: "Check a customer's product usage metrics and engagement data.",
    input_schema: {
      type: "object" as const,
      properties: {
        customer_id: { type: "string", description: "Customer ID or email" },
        period: { type: "string", description: "Time period (e.g., 'last_7_days', 'last_30_days')" },
      },
      required: ["customer_id"],
    },
  },
  async execute(input) {
    // TODO: Replace with Mixpanel/analytics API
    return JSON.stringify({
      customer: input.customer_id,
      period: input.period || "last_30_days",
      logins: 23,
      features_used: ["dashboard", "reports", "integrations"],
      unused_features: ["automations", "api"],
      health_score: 78,
      trend: "stable",
    });
  },
};

const log_crm_note: ToolDefinition = {
  schema: {
    name: "log_crm_note",
    description: "Log a note in the CRM against a customer record.",
    input_schema: {
      type: "object" as const,
      properties: {
        customer_id: { type: "string", description: "Customer ID" },
        note: { type: "string", description: "Note content" },
      },
      required: ["customer_id", "note"],
    },
  },
  async execute(input) {
    // TODO: Replace with CRM API
    return JSON.stringify({ status: "logged", customer: input.customer_id });
  },
};

const schedule_checkin: ToolDefinition = {
  schema: {
    name: "schedule_checkin",
    description: "Schedule a check-in call with a customer.",
    input_schema: {
      type: "object" as const,
      properties: {
        customer_email: { type: "string", description: "Customer email" },
        topic: { type: "string", description: "Check-in topic" },
        preferred_time: { type: "string", description: "Preferred time" },
      },
      required: ["customer_email", "topic"],
    },
  },
  async execute(input) {
    // TODO: Replace with calendar API
    return JSON.stringify({
      status: "scheduled",
      with: input.customer_email,
      time: input.preferred_time || "Next available: Thursday 10:00 AM",
    });
  },
};

// --- Tool Registry ---

const allTools: Record<string, ToolDefinition> = {
  lookup_lead,
  schedule_meeting,
  send_followup,
  check_order_status,
  create_ticket,
  process_refund,
  search_knowledge,
  check_usage_metrics,
  log_crm_note,
  schedule_checkin,
};

export function getToolsForAgent(toolNames: string[]): ToolDefinition[] {
  return toolNames.map((name) => allTools[name]).filter(Boolean);
}

export function getToolSchemas(toolNames: string[]): Anthropic.Tool[] {
  return getToolsForAgent(toolNames).map((t) => t.schema);
}

export function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const tool = allTools[name];
  if (!tool) return Promise.resolve(`Error: Unknown tool "${name}"`);
  return tool.execute(input);
}
