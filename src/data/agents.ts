export type AutomationStatus = "active" | "paused" | "learning" | "completed";

export interface Automation {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  jobsDone: number;
  successRate: number;
  avgTime: string;
  lastRun: string;
  category: string;
  estimatedMonthlyCost: string;
  timeSavedPerMonth: string;
  roiMultiplier: number;
  toolsUsed: string[];
  triggerFrequency: string;
  errorRate: number;
}

export interface Process {
  id: string;
  name: string;
  steps: string[];
  frequency: string;
  owner: string;
  status: "optimized" | "needs-review" | "new";
}

export interface AgentMetrics {
  tasksThisWeek: number;
  avgResponseTime: string;
  customerSatisfaction?: number;
  revenueInfluenced?: string;
  ticketsResolved?: number;
  costSaved: string;
  uptimePercent: number;
  errorRate: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  target: string;
  time: string;
  status: "success" | "warning" | "error" | "info";
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  title: string;
  bio: string;
  avatar: string;
  colorVar: string;
  glowClass: string;
  icon: string;
  onboardingProgress: number;
  totalJobs: number;
  activeAutomations: number;
  performance: number;
  upskillLevel: number;
  hiredDate: string;
  department: string;
  reportingTo: string;
  dataSources: { name: string; type: string; status: "connected" | "syncing" | "error" }[];
  automations: Automation[];
  processes: Process[];
  metrics: AgentMetrics;
  recentActivity: ActivityItem[];
  skills: string[];
  certifications: string[];
  tasks: { name: string; description: string; frequency: string; impact: string }[];
}

import salesAvatar from "@/assets/agent-sales.jpg";
import supportAvatar from "@/assets/agent-support.jpg";
import successAvatar from "@/assets/agent-success.jpg";

export const agents: Agent[] = [
  {
    id: "sales",
    name: "Kofi",
    role: "Sales Agent",
    title: "Senior Sales Development Representative",
    bio: "Kofi ensures no lead goes cold. He captures every inbound inquiry within seconds, qualifies prospects against your ICP, and books meetings before competitors even respond. Every conversation is a revenue opportunity.",
    avatar: salesAvatar,
    colorVar: "agent-sales",
    glowClass: "glow-sales",
    icon: "TrendingUp",
    onboardingProgress: 92,
    totalJobs: 12847,
    activeAutomations: 5,
    performance: 94,
    upskillLevel: 4,
    hiredDate: "Jan 15, 2024",
    department: "Sales",
    reportingTo: "VP of Sales",
    skills: ["Lead Qualification", "Email Copywriting", "Meeting Booking", "Pipeline Management", "Follow-up Sequences"],
    certifications: ["Follow-ups", "Customer Outreach", "Order Tracking"],
    dataSources: [
      { name: "HubSpot CRM", type: "CRM", status: "connected" },
      { name: "LinkedIn Sales Navigator", type: "Prospecting", status: "connected" },
      { name: "Gmail / Google Workspace", type: "Email", status: "connected" },
      { name: "Calendly", type: "Scheduling", status: "connected" },
      { name: "WhatsApp Business", type: "Messaging", status: "connected" },
      { name: "Apollo.io", type: "Data Enrichment", status: "connected" },
      { name: "Slack", type: "Internal Comms", status: "connected" },
      { name: "Google Sheets", type: "Reporting", status: "connected" },
    ],
    metrics: {
      tasksThisWeek: 1840,
      avgResponseTime: "1.4s",
      revenueInfluenced: "₦142M",
      costSaved: "₦9.1M/mo",
      uptimePercent: 99.8,
      errorRate: 0.3,
    },
    processes: [
      { id: "sp1", name: "Inbound Lead Capture & Response", steps: ["Capture lead from form/chat/WhatsApp", "Enrich with company data", "Score against ICP", "Send instant personalized reply", "Book meeting or route to rep"], frequency: "Real-time", owner: "Kofi", status: "optimized" },
      { id: "sp2", name: "Outbound Prospecting Cycle", steps: ["Build target account list", "Research decision makers", "Craft personalized sequences", "Execute multi-channel outreach", "Track engagement & follow up"], frequency: "Daily", owner: "Kofi", status: "optimized" },
      { id: "sp3", name: "Deal Follow-up & Nurture", steps: ["Monitor pipeline stages", "Send timely follow-ups", "Re-engage cold leads", "Share relevant content", "Alert reps on hot signals"], frequency: "Hourly", owner: "Kofi", status: "needs-review" },
    ],
    automations: [
      {
        id: "s1", name: "Instant Lead Response & Qualification", description: "Responds to every inbound lead within 60 seconds. Qualifies based on firmographics, engagement signals, and ICP fit. Routes hot leads to reps instantly.",
        status: "active", jobsDone: 3420, successRate: 96, avgTime: "2.3s", lastRun: "2 min ago", category: "Lead Response",
        estimatedMonthlyCost: "₦60,000", timeSavedPerMonth: "62 hrs", roiMultiplier: 14.2,
        toolsUsed: ["n8n", "HubSpot API", "Clearbit"], triggerFrequency: "Real-time", errorRate: 0.4,
      },
      {
        id: "s2", name: "Personalized Email Outreach & Follow-ups", description: "Sends personalized sequences based on prospect behavior. Handles replies, answers questions, and books meetings automatically.",
        status: "active", jobsDone: 4215, successRate: 89, avgTime: "1.8s", lastRun: "5 min ago", category: "Outreach",
        estimatedMonthlyCost: "₦42,500", timeSavedPerMonth: "80 hrs", roiMultiplier: 18.5,
        toolsUsed: ["Make", "Gmail API", "OpenAI"], triggerFrequency: "Scheduled (3x/day)", errorRate: 1.2,
      },
      {
        id: "s3", name: "CRM Auto-Logging & Enrichment", description: "Auto-logs every conversation, call, and email to CRM. Enriches contacts with company data, tech stack, and social profiles.",
        status: "active", jobsDone: 2890, successRate: 98, avgTime: "0.9s", lastRun: "1 min ago", category: "Data Management",
        estimatedMonthlyCost: "₦32,500", timeSavedPerMonth: "45 hrs", roiMultiplier: 22.1,
        toolsUsed: ["n8n", "HubSpot API", "Apollo.io"], triggerFrequency: "Real-time", errorRate: 0.2,
      },
      {
        id: "s4", name: "Meeting Booking & Calendar Management", description: "Handles scheduling back-and-forth. Sends calendar invites, reminders, and pre-meeting briefs. Reschedules automatically when needed.",
        status: "active", jobsDone: 1122, successRate: 91, avgTime: "3s", lastRun: "23 min ago", category: "Scheduling",
        estimatedMonthlyCost: "₦22,500", timeSavedPerMonth: "28 hrs", roiMultiplier: 8.9,
        toolsUsed: ["Make", "Calendly API", "Gmail API"], triggerFrequency: "On-demand", errorRate: 0.8,
      },
      {
        id: "s5", name: "Pipeline Reporting & Deal Alerts", description: "Generates daily pipeline reports with win probability. Flags stalled deals and suggests next-best-actions for reps.",
        status: "active", jobsDone: 1200, successRate: 97, avgTime: "4.5s", lastRun: "1 hr ago", category: "Analytics",
        estimatedMonthlyCost: "₦17,500", timeSavedPerMonth: "20 hrs", roiMultiplier: 11.3,
        toolsUsed: ["n8n", "HubSpot API", "Google Sheets"], triggerFrequency: "Daily 8am", errorRate: 0.1,
      },
    ],
    recentActivity: [
      { id: "a1", action: "Qualified lead", target: "TechFlow Inc.", time: "2 min ago", status: "success" },
      { id: "a2", action: "Sent follow-up", target: "sarah@acmecorp.com", time: "5 min ago", status: "success" },
      { id: "a3", action: "Enriched contact", target: "340 new records", time: "12 min ago", status: "info" },
      { id: "a4", action: "Booked meeting", target: "Demo with CloudSync", time: "23 min ago", status: "success" },
      { id: "a5", action: "Pipeline alert", target: "3 deals at risk", time: "1 hr ago", status: "warning" },
    ],
    tasks: [
      { name: "Respond to inbound leads", description: "Reply to every new inquiry within 60 seconds with a personalized message", frequency: "Real-time", impact: "21× higher conversion" },
      { name: "Qualify prospects against ICP", description: "Score leads by firmographics, engagement, and fit criteria", frequency: "Per lead", impact: "40% fewer wasted demos" },
      { name: "Send outreach sequences", description: "Craft and deliver multi-touch email sequences to target accounts", frequency: "3× daily", impact: "2× pipeline growth" },
      { name: "Book meetings", description: "Handle scheduling back-and-forth and send calendar invites with pre-meeting briefs", frequency: "On demand", impact: "28 hrs saved/mo" },
      { name: "Log conversations to CRM", description: "Auto-log every email, call, and chat to HubSpot with enriched contact data", frequency: "Real-time", impact: "98% data accuracy" },
      { name: "Follow up on stalled deals", description: "Re-engage cold leads and flag at-risk deals with next-best-action suggestions", frequency: "Hourly", impact: "15% win-back rate" },
      { name: "Generate pipeline reports", description: "Produce daily pipeline summaries with win probability and deal velocity", frequency: "Daily", impact: "Clear visibility" },
    ],
  },
  {
    id: "support",
    name: "Amara",
    role: "Support Agent",
    title: "Senior Customer Support Specialist",
    bio: "Amara handles every support conversation with speed and empathy. She resolves tickets instantly with knowledge base answers, escalates what she can't fix, and ensures no customer waits more than 10 minutes for a response.",
    avatar: supportAvatar,
    colorVar: "agent-support",
    glowClass: "glow-support",
    icon: "HeadphonesIcon",
    onboardingProgress: 88,
    totalJobs: 18432,
    activeAutomations: 5,
    performance: 91,
    upskillLevel: 3,
    hiredDate: "Feb 3, 2024",
    department: "Support",
    reportingTo: "Head of Support",
    skills: ["Ticket Resolution", "Sentiment Analysis", "Escalation Routing", "Knowledge Base Management", "Multi-channel Support"],
    certifications: ["Customer Replies", "Complaint Handling", "FAQ Answers"],
    dataSources: [
      { name: "Zendesk", type: "Support Tickets", status: "connected" },
      { name: "Intercom", type: "Live Chat", status: "connected" },
      { name: "WhatsApp Business", type: "Messaging", status: "connected" },
      { name: "Notion Knowledge Base", type: "Documentation", status: "connected" },
      { name: "Slack", type: "Internal Comms", status: "connected" },
      { name: "Freshdesk", type: "Helpdesk", status: "connected" },
      { name: "Twilio", type: "SMS/Voice", status: "syncing" },
      { name: "Gmail", type: "Email Support", status: "connected" },
    ],
    metrics: {
      tasksThisWeek: 2640,
      avgResponseTime: "0.8s",
      customerSatisfaction: 94,
      ticketsResolved: 1820,
      costSaved: "₦11.2M/mo",
      uptimePercent: 99.9,
      errorRate: 0.5,
    },
    processes: [
      { id: "sp1", name: "Ticket Lifecycle Management", steps: ["Receive & classify ticket", "Check KB for resolution", "Auto-respond or escalate", "Monitor resolution time", "Send satisfaction survey"], frequency: "Real-time", owner: "Amara", status: "optimized" },
      { id: "sp2", name: "Multi-Channel Triage", steps: ["Monitor email, chat, WhatsApp, social", "Unify conversations per customer", "Prioritize by urgency & sentiment", "Route to right team or auto-resolve", "Log in helpdesk"], frequency: "Real-time", owner: "Amara", status: "optimized" },
      { id: "sp3", name: "Escalation & Handoff Workflow", steps: ["Detect complex or angry tickets", "Prepare context summary for agent", "Warm-handoff with full history", "Monitor resolution by human", "Follow up post-resolution"], frequency: "As needed", owner: "Amara", status: "new" },
    ],
    automations: [
      {
        id: "su1", name: "Instant Ticket Triage & Auto-Response", description: "Classifies incoming tickets by urgency and category. Auto-resolves common issues with KB articles. Escalates complex ones with full context.",
        status: "active", jobsDone: 6230, successRate: 93, avgTime: "1.2s", lastRun: "30 sec ago", category: "Support",
        estimatedMonthlyCost: "₦47,500", timeSavedPerMonth: "90 hrs", roiMultiplier: 24.1,
        toolsUsed: ["n8n", "Zendesk API", "OpenAI"], triggerFrequency: "Real-time", errorRate: 0.6,
      },
      {
        id: "su2", name: "WhatsApp & Live Chat Auto-Reply", description: "Responds instantly on WhatsApp and live chat. Answers FAQs, checks order status, and collects info before escalating to humans.",
        status: "active", jobsDone: 4890, successRate: 91, avgTime: "1.5s", lastRun: "1 min ago", category: "Messaging",
        estimatedMonthlyCost: "₦40,000", timeSavedPerMonth: "72 hrs", roiMultiplier: 19.2,
        toolsUsed: ["Make", "WhatsApp Business API", "Intercom"], triggerFrequency: "Real-time", errorRate: 0.8,
      },
      {
        id: "su3", name: "Knowledge Base Auto-Suggestions", description: "Monitors conversations and proactively suggests relevant KB articles. Creates draft articles from frequently resolved tickets.",
        status: "learning", jobsDone: 3012, successRate: 85, avgTime: "2.8s", lastRun: "3 min ago", category: "Self-Service",
        estimatedMonthlyCost: "₦27,500", timeSavedPerMonth: "40 hrs", roiMultiplier: 10.2,
        toolsUsed: ["LangChain", "Notion API", "OpenAI Embeddings"], triggerFrequency: "Real-time", errorRate: 1.5,
      },
      {
        id: "su4", name: "CSAT Survey & Sentiment Tracking", description: "Sends satisfaction surveys after every resolution. Analyzes sentiment from responses and flags detractors for immediate follow-up.",
        status: "active", jobsDone: 2100, successRate: 88, avgTime: "1.5s", lastRun: "15 min ago", category: "Feedback",
        estimatedMonthlyCost: "₦20,000", timeSavedPerMonth: "30 hrs", roiMultiplier: 12.5,
        toolsUsed: ["n8n", "Typeform API", "Slack Webhooks"], triggerFrequency: "Post-interaction", errorRate: 0.8,
      },
      {
        id: "su5", name: "SLA Monitoring & Breach Alerts", description: "Tracks response and resolution times against SLAs. Sends alerts when tickets approach breach thresholds and auto-escalates.",
        status: "active", jobsDone: 2200, successRate: 96, avgTime: "0.5s", lastRun: "5 min ago", category: "Operations",
        estimatedMonthlyCost: "₦15,000", timeSavedPerMonth: "15 hrs", roiMultiplier: 8.7,
        toolsUsed: ["n8n", "Zendesk API", "Slack API"], triggerFrequency: "Continuous", errorRate: 0.3,
      },
    ],
    recentActivity: [
      { id: "b1", action: "Auto-resolved ticket", target: "#TK-8923", time: "30 sec ago", status: "success" },
      { id: "b2", action: "WhatsApp reply sent", target: "+234 812 xxx xxxx", time: "1 min ago", status: "success" },
      { id: "b3", action: "CSAT collected", target: "Score: 4.7/5", time: "15 min ago", status: "success" },
      { id: "b4", action: "KB article suggested", target: "API Rate Limits", time: "3 min ago", status: "info" },
      { id: "b5", action: "SLA breach alert", target: "2 tickets approaching", time: "30 min ago", status: "warning" },
    ],
    tasks: [
      { name: "Triage incoming tickets", description: "Classify tickets by urgency, category, and sentiment for instant routing", frequency: "Real-time", impact: "90 hrs saved/mo" },
      { name: "Auto-resolve common issues", description: "Match queries against knowledge base and resolve without human intervention", frequency: "Real-time", impact: "65% auto-resolution" },
      { name: "Reply on WhatsApp & live chat", description: "Respond instantly to customer messages on WhatsApp, Intercom, and web chat", frequency: "Real-time", impact: "0.8s avg response" },
      { name: "Escalate complex tickets", description: "Prepare context summaries and warm-handoff to human agents with full history", frequency: "As needed", impact: "50% faster resolution" },
      { name: "Monitor SLA compliance", description: "Track response and resolution times, alert teams before SLA breaches", frequency: "Continuous", impact: "96% SLA adherence" },
      { name: "Send CSAT surveys", description: "Trigger satisfaction surveys post-resolution and flag detractors for follow-up", frequency: "Post-interaction", impact: "94% CSAT score" },
      { name: "Update knowledge base", description: "Suggest new KB articles from frequently resolved tickets", frequency: "Weekly", impact: "Self-service ↑ 30%" },
    ],
  },
  {
    id: "success",
    name: "Zuri",
    role: "Success Agent",
    title: "Senior Customer Success Manager",
    bio: "Zuri turns customers into advocates. She monitors onboarding progress, tracks product adoption, detects churn signals early, and proactively re-engages accounts - ensuring every customer stays, grows, and refers.",
    avatar: successAvatar,
    colorVar: "agent-success",
    glowClass: "glow-success",
    icon: "Heart",
    onboardingProgress: 85,
    totalJobs: 9215,
    activeAutomations: 5,
    performance: 97,
    upskillLevel: 3,
    hiredDate: "Mar 1, 2024",
    department: "Success",
    reportingTo: "Head of Customer Success",
    skills: ["Onboarding Design", "Churn Prediction", "Account Health Monitoring", "Upsell Identification", "Customer Advocacy"],
    certifications: ["Check-ins", "Repeat Customer Tracking", "Feedback Collection"],
    dataSources: [
      { name: "HubSpot CRM", type: "Customer Data", status: "connected" },
      { name: "Stripe Billing", type: "Subscription Data", status: "connected" },
      { name: "Mixpanel", type: "Product Analytics", status: "connected" },
      { name: "Intercom", type: "In-app Messaging", status: "connected" },
      { name: "Slack", type: "Internal Comms", status: "connected" },
      { name: "Calendly", type: "Meeting Scheduling", status: "connected" },
      { name: "Typeform", type: "Surveys & NPS", status: "syncing" },
      { name: "Google Sheets", type: "Reporting", status: "connected" },
    ],
    metrics: {
      tasksThisWeek: 1320,
      avgResponseTime: "2.1s",
      customerSatisfaction: 96,
      costSaved: "₦7.4M/mo",
      uptimePercent: 99.7,
      errorRate: 0.2,
    },
    processes: [
      { id: "cp1", name: "Customer Onboarding Journey", steps: ["Trigger welcome email", "Schedule kickoff call", "Send setup guide", "Monitor product adoption", "30-day health check"], frequency: "Per new customer", owner: "Zuri", status: "optimized" },
      { id: "cp2", name: "Churn Prevention Workflow", steps: ["Monitor usage decline signals", "Analyze support ticket sentiment", "Flag at-risk accounts", "Trigger retention campaign", "Escalate to CSM if needed"], frequency: "Daily", owner: "Zuri", status: "optimized" },
      { id: "cp3", name: "Expansion & Upsell Cycle", steps: ["Identify high-usage accounts", "Detect feature upgrade signals", "Prepare personalized offer", "Coordinate with sales", "Track conversion"], frequency: "Weekly", owner: "Zuri", status: "new" },
    ],
    automations: [
      {
        id: "c1", name: "Automated Onboarding Sequences", description: "Triggers personalized onboarding drips, in-app guides, and check-in calls based on customer segment and product usage milestones.",
        status: "active", jobsDone: 2890, successRate: 95, avgTime: "3.1s", lastRun: "8 min ago", category: "Onboarding",
        estimatedMonthlyCost: "₦35,000", timeSavedPerMonth: "55 hrs", roiMultiplier: 16.8,
        toolsUsed: ["Make", "Intercom API", "Twilio"], triggerFrequency: "Event-driven", errorRate: 0.3,
      },
      {
        id: "c2", name: "Churn Prediction & Retention Alerts", description: "Analyzes usage patterns, support history, and billing data to predict churn risk. Triggers retention campaigns and CSM alerts automatically.",
        status: "active", jobsDone: 2200, successRate: 92, avgTime: "8s", lastRun: "30 min ago", category: "Retention",
        estimatedMonthlyCost: "₦55,000", timeSavedPerMonth: "35 hrs", roiMultiplier: 8.7,
        toolsUsed: ["n8n", "Mixpanel API", "Stripe API"], triggerFrequency: "Daily", errorRate: 0.9,
      },
      {
        id: "c3", name: "NPS & Health Score Tracking", description: "Sends NPS surveys at key milestones. Calculates customer health scores from usage, support, and billing data. Flags detractors for immediate outreach.",
        status: "active", jobsDone: 1800, successRate: 88, avgTime: "1.5s", lastRun: "15 min ago", category: "Feedback",
        estimatedMonthlyCost: "₦20,000", timeSavedPerMonth: "30 hrs", roiMultiplier: 12.5,
        toolsUsed: ["n8n", "Typeform API", "HubSpot API"], triggerFrequency: "Post-milestone", errorRate: 0.8,
      },
      {
        id: "c4", name: "Renewal & Upsell Orchestration", description: "Tracks subscription renewal dates and usage patterns. Sends timely renewal reminders and identifies upsell opportunities based on feature adoption.",
        status: "active", jobsDone: 1125, successRate: 94, avgTime: "5s", lastRun: "2 hr ago", category: "Revenue",
        estimatedMonthlyCost: "₦30,000", timeSavedPerMonth: "22 hrs", roiMultiplier: 14.1,
        toolsUsed: ["Make", "Stripe API", "HubSpot API"], triggerFrequency: "Weekly", errorRate: 0.4,
      },
      {
        id: "c5", name: "Customer Re-engagement Campaigns", description: "Detects inactive or declining-usage accounts. Sends personalized re-engagement emails with helpful content, tips, and offers to bring them back.",
        status: "active", jobsDone: 1200, successRate: 82, avgTime: "2s", lastRun: "1 hr ago", category: "Engagement",
        estimatedMonthlyCost: "₦22,500", timeSavedPerMonth: "18 hrs", roiMultiplier: 7.4,
        toolsUsed: ["n8n", "Intercom API", "OpenAI"], triggerFrequency: "Weekly", errorRate: 1.2,
      },
    ],
    recentActivity: [
      { id: "d1", action: "Onboarding started", target: "CloudSync Ltd", time: "8 min ago", status: "info" },
      { id: "d2", action: "Churn alert", target: "2 accounts flagged", time: "30 min ago", status: "warning" },
      { id: "d3", action: "NPS collected", target: "Score: 72", time: "1 hr ago", status: "success" },
      { id: "d4", action: "Renewal reminder sent", target: "TechFlow Inc.", time: "2 hr ago", status: "success" },
      { id: "d5", action: "Re-engagement sent", target: "5 dormant accounts", time: "3 hr ago", status: "info" },
    ],
    tasks: [
      { name: "Run onboarding sequences", description: "Trigger personalized welcome emails, in-app guides, and kickoff scheduling", frequency: "Per new customer", impact: "40% faster activation" },
      { name: "Monitor product adoption", description: "Track feature usage and milestone completion across customer accounts", frequency: "Daily", impact: "Early churn detection" },
      { name: "Predict churn risk", description: "Analyze usage decline, support sentiment, and billing patterns to flag at-risk accounts", frequency: "Daily", impact: "92% prediction accuracy" },
      { name: "Send NPS & health surveys", description: "Trigger NPS at key milestones and calculate customer health scores", frequency: "Post-milestone", impact: "72 avg NPS score" },
      { name: "Manage renewals", description: "Track renewal dates, send reminders, and coordinate with billing", frequency: "Weekly", impact: "94% renewal rate" },
      { name: "Identify upsell opportunities", description: "Detect high-usage accounts and feature upgrade signals for expansion", frequency: "Weekly", impact: "3.2× expansion revenue" },
      { name: "Re-engage dormant accounts", description: "Trigger retention campaigns for accounts showing declining activity", frequency: "As needed", impact: "15% reactivation rate" },
    ],
  },
];
