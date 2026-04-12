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
    title: "Your Sales Teammate",
    bio: "Kofi replies to every customer message instantly, checks if they're a good fit for your business, and books meetings for your team. No message goes unanswered.",
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
    reportingTo: "Sales Lead",
    skills: ["Checking New Leads", "Writing Emails", "Booking Meetings", "Tracking Sales", "Sending Follow-ups"],
    certifications: ["Follow-ups", "Customer Outreach", "Order Tracking"],
    dataSources: [
      { name: "HubSpot CRM", type: "CRM", status: "connected" },
      { name: "LinkedIn Sales Navigator", type: "Prospecting", status: "connected" },
      { name: "Gmail / Google Workspace", type: "Email", status: "connected" },
      { name: "Calendly", type: "Scheduling", status: "connected" },
      { name: "WhatsApp Business", type: "Messaging", status: "connected" },
      { name: "Apollo.io", type: "Contact Info", status: "connected" },
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
      { id: "sp1", name: "Reply to New Customers", steps: ["Pick up message from form/chat/WhatsApp", "Look up customer details", "Check if they're a good fit", "Send a quick personal reply", "Book a meeting or pass to your team"], frequency: "Instant", owner: "Kofi", status: "optimized" },
      { id: "sp2", name: "Reach Out to New People", steps: ["Build a list of people to contact", "Find the right person to talk to", "Write personal messages", "Send messages across channels", "Track replies & follow up"], frequency: "Daily", owner: "Kofi", status: "optimized" },
      { id: "sp3", name: "Follow Up on Open Deals", steps: ["Check on ongoing deals", "Send timely follow-ups", "Re-contact quiet leads", "Share helpful info", "Alert your team on hot leads"], frequency: "Hourly", owner: "Kofi", status: "needs-review" },
    ],
    automations: [
      {
        id: "s1", name: "Instant Reply to New Customers", description: "Replies to every new message within 60 seconds. Checks if they match your ideal customer and sends interested ones to your team right away.",
        status: "active", jobsDone: 3420, successRate: 96, avgTime: "2.3s", lastRun: "2 min ago", category: "New Customers",
        estimatedMonthlyCost: "₦60,000", timeSavedPerMonth: "62 hrs", roiMultiplier: 14.2,
        toolsUsed: ["n8n", "HubSpot API", "Clearbit"], triggerFrequency: "Real-time", errorRate: 0.4,
      },
      {
        id: "s2", name: "Send Emails & Follow Up", description: "Sends personal emails based on what the customer did. Handles replies, answers questions, and books meetings automatically.",
        status: "active", jobsDone: 4215, successRate: 89, avgTime: "1.8s", lastRun: "5 min ago", category: "Outreach",
        estimatedMonthlyCost: "₦42,500", timeSavedPerMonth: "80 hrs", roiMultiplier: 18.5,
        toolsUsed: ["Make", "Gmail API", "OpenAI"], triggerFrequency: "Scheduled (3x/day)", errorRate: 1.2,
      },
      {
        id: "s3", name: "Save All Conversations Automatically", description: "Saves every conversation, call, and email to your system. Adds customer details like company info and social profiles.",
        status: "active", jobsDone: 2890, successRate: 98, avgTime: "0.9s", lastRun: "1 min ago", category: "Record Keeping",
        estimatedMonthlyCost: "₦32,500", timeSavedPerMonth: "45 hrs", roiMultiplier: 22.1,
        toolsUsed: ["n8n", "HubSpot API", "Apollo.io"], triggerFrequency: "Real-time", errorRate: 0.2,
      },
      {
        id: "s4", name: "Book Meetings & Manage Calendar", description: "Handles the back-and-forth of scheduling. Sends calendar invites, reminders, and meeting notes. Reschedules when needed.",
        status: "active", jobsDone: 1122, successRate: 91, avgTime: "3s", lastRun: "23 min ago", category: "Scheduling",
        estimatedMonthlyCost: "₦22,500", timeSavedPerMonth: "28 hrs", roiMultiplier: 8.9,
        toolsUsed: ["Make", "Calendly API", "Gmail API"], triggerFrequency: "On-demand", errorRate: 0.8,
      },
      {
        id: "s5", name: "Daily Sales Reports & Alerts", description: "Creates daily sales reports showing which deals are likely to close. Flags stuck deals and suggests what to do next.",
        status: "active", jobsDone: 1200, successRate: 97, avgTime: "4.5s", lastRun: "1 hr ago", category: "Reports",
        estimatedMonthlyCost: "₦17,500", timeSavedPerMonth: "20 hrs", roiMultiplier: 11.3,
        toolsUsed: ["n8n", "HubSpot API", "Google Sheets"], triggerFrequency: "Daily 8am", errorRate: 0.1,
      },
    ],
    recentActivity: [
      { id: "a1", action: "Checked new lead", target: "TechFlow Inc.", time: "2 min ago", status: "success" },
      { id: "a2", action: "Sent follow-up", target: "sarah@acmecorp.com", time: "5 min ago", status: "success" },
      { id: "a3", action: "Updated contacts", target: "340 new records", time: "12 min ago", status: "info" },
      { id: "a4", action: "Booked meeting", target: "Demo with CloudSync", time: "23 min ago", status: "success" },
      { id: "a5", action: "Sales alert", target: "3 deals need attention", time: "1 hr ago", status: "warning" },
    ],
    tasks: [
      { name: "Reply to new customers", description: "Reply to every new message within 60 seconds with a personal response", frequency: "Instant", impact: "21× more sales" },
      { name: "Check if leads are a good fit", description: "Look at each new lead and decide if they match your ideal customer", frequency: "Per lead", impact: "40% less wasted time" },
      { name: "Send emails & messages", description: "Write and send personal email sequences to potential customers", frequency: "3× daily", impact: "2× more sales" },
      { name: "Book meetings", description: "Handle scheduling back-and-forth and send calendar invites with meeting notes", frequency: "On demand", impact: "28 hrs saved/mo" },
      { name: "Save conversations", description: "Automatically save every email, call, and chat with customer details", frequency: "Instant", impact: "98% accuracy" },
      { name: "Follow up on quiet deals", description: "Re-contact leads who went quiet and flag deals that need attention", frequency: "Hourly", impact: "15% win-back rate" },
      { name: "Create sales reports", description: "Send daily sales summaries showing which deals are moving and which are stuck", frequency: "Daily", impact: "Clear visibility" },
    ],
  },
  {
    id: "support",
    name: "Amara",
    role: "Support Agent",
    title: "Your Support Teammate",
    bio: "Amara answers customer questions instantly. She solves common problems on her own, gets your team involved when needed, and makes sure no customer waits more than 10 minutes for a reply.",
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
    reportingTo: "Support Lead",
    skills: ["Solving Tickets", "Detecting Unhappy Customers", "Passing to Your Team", "Managing FAQs", "Replying Across Channels"],
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
      { id: "sp1", name: "Handle Customer Tickets", steps: ["Receive & sort the ticket", "Check FAQs for an answer", "Reply automatically or pass to team", "Track how fast it's resolved", "Ask if customer is happy"], frequency: "Instant", owner: "Amara", status: "optimized" },
      { id: "sp2", name: "Reply Across All Channels", steps: ["Watch email, chat, WhatsApp, social", "Group messages by customer", "Handle urgent ones first", "Reply or pass to the right person", "Save in helpdesk"], frequency: "Instant", owner: "Amara", status: "optimized" },
      { id: "sp3", name: "Pass Tough Issues to Your Team", steps: ["Spot tricky or frustrated messages", "Prepare a summary for your team", "Hand off with full conversation history", "Track if the team resolved it", "Follow up after it's fixed"], frequency: "As needed", owner: "Amara", status: "new" },
    ],
    automations: [
      {
        id: "su1", name: "Sort & Reply to Tickets Instantly", description: "Sorts incoming tickets by urgency. Answers common questions automatically. Passes tricky ones to your team with full details.",
        status: "active", jobsDone: 6230, successRate: 93, avgTime: "1.2s", lastRun: "30 sec ago", category: "Support",
        estimatedMonthlyCost: "₦47,500", timeSavedPerMonth: "90 hrs", roiMultiplier: 24.1,
        toolsUsed: ["n8n", "Zendesk API", "OpenAI"], triggerFrequency: "Real-time", errorRate: 0.6,
      },
      {
        id: "su2", name: "WhatsApp & Live Chat Auto-Reply", description: "Replies instantly on WhatsApp and live chat. Answers common questions, checks order status, and collects info before passing to your team.",
        status: "active", jobsDone: 4890, successRate: 91, avgTime: "1.5s", lastRun: "1 min ago", category: "Messaging",
        estimatedMonthlyCost: "₦40,000", timeSavedPerMonth: "72 hrs", roiMultiplier: 19.2,
        toolsUsed: ["Make", "WhatsApp Business API", "Intercom"], triggerFrequency: "Real-time", errorRate: 0.8,
      },
      {
        id: "su3", name: "Suggest Answers from Your FAQs", description: "Watches conversations and suggests helpful FAQ answers. Creates new FAQ drafts from questions that keep coming up.",
        status: "learning", jobsDone: 3012, successRate: 85, avgTime: "2.8s", lastRun: "3 min ago", category: "Self-Service",
        estimatedMonthlyCost: "₦27,500", timeSavedPerMonth: "40 hrs", roiMultiplier: 10.2,
        toolsUsed: ["LangChain", "Notion API", "OpenAI Embeddings"], triggerFrequency: "Real-time", errorRate: 1.5,
      },
      {
        id: "su4", name: "Ask Customers if They're Happy", description: "Sends a quick satisfaction check after every resolved issue. Flags unhappy customers so you can follow up right away.",
        status: "active", jobsDone: 2100, successRate: 88, avgTime: "1.5s", lastRun: "15 min ago", category: "Feedback",
        estimatedMonthlyCost: "₦20,000", timeSavedPerMonth: "30 hrs", roiMultiplier: 12.5,
        toolsUsed: ["n8n", "Typeform API", "Slack Webhooks"], triggerFrequency: "Post-interaction", errorRate: 0.8,
      },
      {
        id: "su5", name: "Response Time Alerts", description: "Tracks how fast you're replying to customers. Sends alerts when tickets are taking too long and passes them to your team.",
        status: "active", jobsDone: 2200, successRate: 96, avgTime: "0.5s", lastRun: "5 min ago", category: "Operations",
        estimatedMonthlyCost: "₦15,000", timeSavedPerMonth: "15 hrs", roiMultiplier: 8.7,
        toolsUsed: ["n8n", "Zendesk API", "Slack API"], triggerFrequency: "Continuous", errorRate: 0.3,
      },
    ],
    recentActivity: [
      { id: "b1", action: "Solved ticket", target: "#TK-8923", time: "30 sec ago", status: "success" },
      { id: "b2", action: "WhatsApp reply sent", target: "+234 812 xxx xxxx", time: "1 min ago", status: "success" },
      { id: "b3", action: "Customer rating collected", target: "Score: 4.7/5", time: "15 min ago", status: "success" },
      { id: "b4", action: "FAQ answer suggested", target: "API Rate Limits", time: "3 min ago", status: "info" },
      { id: "b5", action: "Slow reply alert", target: "2 tickets need attention", time: "30 min ago", status: "warning" },
    ],
    tasks: [
      { name: "Sort incoming tickets", description: "Sort tickets by urgency so the most important ones get handled first", frequency: "Instant", impact: "90 hrs saved/mo" },
      { name: "Answer common questions", description: "Check FAQs and solve common problems without needing a human", frequency: "Instant", impact: "65% solved automatically" },
      { name: "Reply on WhatsApp & live chat", description: "Respond instantly to customer messages on WhatsApp and web chat", frequency: "Instant", impact: "0.8s avg response" },
      { name: "Pass tough issues to your team", description: "Prepare a summary and hand off to your team with the full conversation", frequency: "As needed", impact: "50% faster fix" },
      { name: "Watch reply times", description: "Track how fast tickets are being answered and alert your team if things slow down", frequency: "Always on", impact: "96% on-time replies" },
      { name: "Ask if customers are happy", description: "Send a quick rating after every resolved issue and flag unhappy customers", frequency: "After each fix", impact: "94% happy customers" },
      { name: "Update your FAQs", description: "Suggest new FAQ answers from questions that keep coming up", frequency: "Weekly", impact: "30% more self-service" },
    ],
  },
  {
    id: "success",
    name: "Zuri",
    role: "Success Agent",
    title: "Your Customer Success Teammate",
    bio: "Zuri keeps your customers happy and coming back. She guides new customers through setup, watches for signs they might leave, and reminds inactive ones why they chose you.",
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
    reportingTo: "Customer Success Lead",
    skills: ["Welcoming New Customers", "Spotting Customers Who Might Leave", "Checking Customer Happiness", "Finding Upgrade Opportunities", "Building Customer Loyalty"],
    certifications: ["Check-ins", "Repeat Customer Tracking", "Feedback Collection"],
    dataSources: [
      { name: "HubSpot CRM", type: "Customer Data", status: "connected" },
      { name: "Stripe Billing", type: "Subscription Data", status: "connected" },
      { name: "Mixpanel", type: "Product Analytics", status: "connected" },
      { name: "Intercom", type: "In-app Messaging", status: "connected" },
      { name: "Slack", type: "Internal Comms", status: "connected" },
      { name: "Calendly", type: "Meeting Scheduling", status: "connected" },
      { name: "Typeform", type: "Surveys & Ratings", status: "syncing" },
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
      { id: "cp1", name: "Welcome New Customers", steps: ["Send welcome email", "Schedule intro call", "Send setup guide", "Check if they're using the product", "30-day check-in"], frequency: "Per new customer", owner: "Zuri", status: "optimized" },
      { id: "cp2", name: "Keep Customers from Leaving", steps: ["Watch for customers using less", "Check if they've had complaints", "Flag customers who might leave", "Send them helpful messages", "Get your team involved if needed"], frequency: "Daily", owner: "Zuri", status: "optimized" },
      { id: "cp3", name: "Find Upgrade Opportunities", steps: ["Find customers using a lot", "Spot ones who could use more features", "Prepare a personal offer", "Coordinate with sales", "Track if they upgrade"], frequency: "Weekly", owner: "Zuri", status: "new" },
    ],
    automations: [
      {
        id: "c1", name: "Welcome & Guide New Customers", description: "Sends welcome messages, setup guides, and check-in calls to new customers based on where they are in getting started.",
        status: "active", jobsDone: 2890, successRate: 95, avgTime: "3.1s", lastRun: "8 min ago", category: "Onboarding",
        estimatedMonthlyCost: "₦35,000", timeSavedPerMonth: "55 hrs", roiMultiplier: 16.8,
        toolsUsed: ["Make", "Intercom API", "Twilio"], triggerFrequency: "When needed", errorRate: 0.3,
      },
      {
        id: "c2", name: "Spot Customers Who Might Leave", description: "Watches how customers use your product, their support history, and billing to spot who might leave. Sends win-back messages and alerts your team.",
        status: "active", jobsDone: 2200, successRate: 92, avgTime: "8s", lastRun: "30 min ago", category: "Retention",
        estimatedMonthlyCost: "₦55,000", timeSavedPerMonth: "35 hrs", roiMultiplier: 8.7,
        toolsUsed: ["n8n", "Mixpanel API", "Stripe API"], triggerFrequency: "Daily", errorRate: 0.9,
      },
      {
        id: "c3", name: "Collect Customer Ratings & Feedback", description: "Sends rating surveys at key moments. Checks how happy customers are based on their usage, support history, and payments. Flags unhappy ones for follow-up.",
        status: "active", jobsDone: 1800, successRate: 88, avgTime: "1.5s", lastRun: "15 min ago", category: "Feedback",
        estimatedMonthlyCost: "₦20,000", timeSavedPerMonth: "30 hrs", roiMultiplier: 12.5,
        toolsUsed: ["n8n", "Typeform API", "HubSpot API"], triggerFrequency: "At key moments", errorRate: 0.8,
      },
      {
        id: "c4", name: "Renewal Reminders & Upgrade Offers", description: "Tracks when subscriptions are due for renewal. Sends timely reminders and finds customers who could benefit from upgrading.",
        status: "active", jobsDone: 1125, successRate: 94, avgTime: "5s", lastRun: "2 hr ago", category: "Revenue",
        estimatedMonthlyCost: "₦30,000", timeSavedPerMonth: "22 hrs", roiMultiplier: 14.1,
        toolsUsed: ["Make", "Stripe API", "HubSpot API"], triggerFrequency: "Weekly", errorRate: 0.4,
      },
      {
        id: "c5", name: "Win Back Inactive Customers", description: "Finds customers who stopped using your product. Sends personal messages with tips, helpful content, and offers to bring them back.",
        status: "active", jobsDone: 1200, successRate: 82, avgTime: "2s", lastRun: "1 hr ago", category: "Engagement",
        estimatedMonthlyCost: "₦22,500", timeSavedPerMonth: "18 hrs", roiMultiplier: 7.4,
        toolsUsed: ["n8n", "Intercom API", "OpenAI"], triggerFrequency: "Weekly", errorRate: 1.2,
      },
    ],
    recentActivity: [
      { id: "d1", action: "Welcome started", target: "CloudSync Ltd", time: "8 min ago", status: "info" },
      { id: "d2", action: "At-risk alert", target: "2 customers might leave", time: "30 min ago", status: "warning" },
      { id: "d3", action: "Rating collected", target: "Score: 72", time: "1 hr ago", status: "success" },
      { id: "d4", action: "Renewal reminder sent", target: "TechFlow Inc.", time: "2 hr ago", status: "success" },
      { id: "d5", action: "Win-back message sent", target: "5 inactive customers", time: "3 hr ago", status: "info" },
    ],
    tasks: [
      { name: "Welcome new customers", description: "Send welcome emails, setup guides, and schedule intro calls", frequency: "Per new customer", impact: "40% faster setup" },
      { name: "Check if customers are using your product", description: "Track which features customers use and where they get stuck", frequency: "Daily", impact: "Catch problems early" },
      { name: "Spot customers who might leave", description: "Watch for customers using less, having complaints, or not logging in", frequency: "Daily", impact: "92% accuracy" },
      { name: "Collect customer ratings", description: "Send rating surveys at key moments and track overall customer happiness", frequency: "At key moments", impact: "72 avg rating" },
      { name: "Handle renewals", description: "Track renewal dates, send reminders, and follow up with billing", frequency: "Weekly", impact: "94% renewal rate" },
      { name: "Find upgrade opportunities", description: "Find customers who use a lot and might benefit from a bigger plan", frequency: "Weekly", impact: "3.2× more revenue" },
      { name: "Win back inactive customers", description: "Send helpful messages to customers who haven't been active lately", frequency: "As needed", impact: "15% come back" },
    ],
  },
];
