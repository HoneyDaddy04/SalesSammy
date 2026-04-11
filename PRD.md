# Vaigence AI Teammates — Product Requirements Document

**Version:** 1.0
**Date:** April 10, 2026
**Author:** Product
**Status:** Draft

---

## 1. Overview

Vaigence is a B2B SaaS platform that deploys AI agents ("AI Teammates") to handle customer-facing conversations across sales, support, and customer success functions. The platform provides instant, 24/7 responses across multiple communication channels, turning every customer conversation into a revenue opportunity.

### 1.1 Problem Statement

- 30–50% of leads never get a follow-up
- 78% of customers buy from the first responder
- Average business response time is 42 hours; customer expectation is 10 minutes
- 88% of customers won't return after a poor experience
- Leads contacted within 5 minutes are 21× more likely to convert

### 1.2 Solution

Three specialized AI agents that respond in under 60 seconds, operate 24/7, achieve 96% lead qualification accuracy, and deliver 3× revenue impact. Users sign up, configure their agents, deploy across channels, and manage everything from a centralized dashboard.

---

## 2. User Personas

| Persona | Description |
|---------|-------------|
| **Sales Leader** | Needs faster lead response, higher qualification rates, pipeline visibility |
| **Support Manager** | Needs reduced ticket resolution time, higher CSAT, SLA compliance |
| **CS Leader** | Needs churn prevention, onboarding automation, expansion revenue |
| **Business Owner (SMB)** | Needs all three — can't afford dedicated teams for each function |

### 2.1 Target Industries

- E-commerce
- SaaS / Tech
- Professional Services
- Any customer-facing business

---

## 3. Product Architecture

The platform consists of four primary surfaces:

1. **Marketing Site** (Landing Page)
2. **Onboarding Flow** (4-step wizard)
3. **Operations Dashboard** (agent management & analytics)
4. **Settings & Configuration**

---

## 4. The AI Teammates

### 4.1 Kofi — Sales Agent

**Title:** Senior Sales Development Representative
**Department:** Sales | **Reports To:** VP of Sales

**Bio:** Kofi ensures no lead goes cold. He captures every inbound inquiry within seconds, qualifies prospects against your ICP, and books meetings before competitors even respond. Every conversation is a revenue opportunity.

**Key Metrics:**
- 2× pipeline increase
- +35% close rate
- $284K revenue influenced
- 99.8% uptime

**Core Tasks:**

| Task | Frequency | Impact |
|------|-----------|--------|
| Respond to inbound leads | Real-time | 21× higher conversion |
| Qualify prospects against ICP | Per lead | 40% fewer wasted demos |
| Send outreach sequences | 3× daily | 2× pipeline growth |
| Book meetings | On demand | 28 hrs saved/mo |
| Log conversations to CRM | Real-time | 98% data accuracy |
| Follow up on stalled deals | Hourly | 15% win-back rate |
| Generate pipeline reports | Daily | Clear visibility |

**Skills:** Lead Qualification, Email Copywriting, Meeting Booking, Pipeline Management, Follow-up Sequences

**Certifications:** HubSpot Sales Certified, LinkedIn Sales Navigator Expert, Salesforce Admin

**Connected Data Sources:**

| Source | Type | Status |
|--------|------|--------|
| HubSpot CRM | CRM | Connected |
| LinkedIn Sales Navigator | Prospecting | Connected |
| Gmail / Google Workspace | Email | Connected |
| Calendly | Scheduling | Connected |
| WhatsApp Business | Messaging | Connected |
| Apollo.io | Data Enrichment | Connected |
| Slack | Internal Comms | Connected |
| Google Sheets | Reporting | Connected |

**Processes:**

1. **Inbound Lead Capture & Response** (Real-time, Optimized)
   - Capture lead from form/chat/WhatsApp → Enrich with company data → Score against ICP → Send instant personalized reply → Book meeting or route to rep

2. **Outbound Prospecting Cycle** (Daily, Optimized)
   - Build target account list → Research decision makers → Craft personalized sequences → Execute multi-channel outreach → Track engagement & follow up

3. **Deal Follow-up & Nurture** (Hourly, Needs Review)
   - Monitor pipeline stages → Send timely follow-ups → Re-engage cold leads → Share relevant content → Alert reps on hot signals

**Automations:**

| # | Automation | Category | Trigger | Success Rate | ROI | Time Saved/Mo | Cost/Mo |
|---|-----------|----------|---------|-------------|-----|---------------|---------|
| 1 | Instant Lead Response & Qualification | Lead Response | Real-time | 96% | 14.2× | 62 hrs | $120 |
| 2 | Personalized Email Outreach & Follow-ups | Outreach | Scheduled 3×/day | 89% | 18.5× | 80 hrs | $85 |
| 3 | CRM Auto-Logging & Enrichment | Data Management | Real-time | 98% | 22.1× | 45 hrs | $65 |
| 4 | Meeting Booking & Calendar Management | Scheduling | On-demand | 91% | 8.9× | 28 hrs | $45 |
| 5 | Pipeline Reporting & Deal Alerts | Analytics | Daily 8am | 97% | 11.3× | 20 hrs | $35 |

**Automation Details:**

1. **Instant Lead Response & Qualification** — Responds to every inbound lead within 60 seconds. Qualifies based on firmographics, engagement signals, and ICP fit. Routes hot leads to reps instantly. (Avg time: 2.3s, Error rate: 0.4%)

2. **Personalized Email Outreach & Follow-ups** — Sends personalized sequences based on prospect behavior. Handles replies, answers questions, and books meetings automatically. (Avg time: 1.8s, Error rate: 1.2%)

3. **CRM Auto-Logging & Enrichment** — Auto-logs every conversation, call, and email to CRM. Enriches contacts with company data, tech stack, and social profiles. (Avg time: 0.9s, Error rate: 0.2%)

4. **Meeting Booking & Calendar Management** — Handles scheduling back-and-forth. Sends calendar invites, reminders, and pre-meeting briefs. Reschedules automatically when needed. (Avg time: 3s, Error rate: 0.8%)

5. **Pipeline Reporting & Deal Alerts** — Generates daily pipeline reports with win probability. Flags stalled deals and suggests next-best-actions for reps. (Avg time: 4.5s, Error rate: 0.1%)

---

### 4.2 Amara — Support Agent

**Title:** Senior Customer Support Specialist
**Department:** Support | **Reports To:** Head of Support

**Bio:** Amara handles every support conversation with speed and empathy. She resolves tickets instantly with knowledge base answers, escalates what she can't fix, and ensures no customer waits more than 10 minutes for a response.

**Key Metrics:**
- 94% CSAT score
- 0.8s average response time
- 1,820 tickets resolved/week
- 99.9% uptime

**Core Tasks:**

| Task | Frequency | Impact |
|------|-----------|--------|
| Triage incoming tickets | Real-time | 90 hrs saved/mo |
| Auto-resolve common issues | Real-time | 65% auto-resolution |
| Reply on WhatsApp & live chat | Real-time | 0.8s avg response |
| Escalate complex tickets | As needed | 50% faster resolution |
| Monitor SLA compliance | Continuous | 96% SLA adherence |
| Send CSAT surveys | Post-interaction | 94% CSAT score |
| Update knowledge base | Weekly | Self-service ↑ 30% |

**Skills:** Ticket Resolution, Sentiment Analysis, Escalation Routing, Knowledge Base Management, Multi-channel Support

**Certifications:** Zendesk Support Certified, Intercom Product Expert, Freshdesk Pro

**Connected Data Sources:**

| Source | Type | Status |
|--------|------|--------|
| Zendesk | Support Tickets | Connected |
| Intercom | Live Chat | Connected |
| WhatsApp Business | Messaging | Connected |
| Notion Knowledge Base | Documentation | Connected |
| Slack | Internal Comms | Connected |
| Freshdesk | Helpdesk | Connected |
| Twilio | SMS/Voice | Syncing |
| Gmail | Email Support | Connected |

**Processes:**

1. **Ticket Lifecycle Management** (Real-time, Optimized)
   - Receive & classify ticket → Check KB for resolution → Auto-respond or escalate → Monitor resolution time → Send satisfaction survey

2. **Multi-Channel Triage** (Real-time, Optimized)
   - Monitor email, chat, WhatsApp, social → Unify conversations per customer → Prioritize by urgency & sentiment → Route to right team or auto-resolve → Log in helpdesk

3. **Escalation & Handoff Workflow** (As needed, New)
   - Detect complex or angry tickets → Prepare context summary for agent → Warm-handoff with full history → Monitor resolution by human → Follow up post-resolution

**Automations:**

| # | Automation | Category | Trigger | Success Rate | ROI | Time Saved/Mo | Cost/Mo |
|---|-----------|----------|---------|-------------|-----|---------------|---------|
| 1 | Instant Ticket Triage & Auto-Response | Support | Real-time | 93% | 24.1× | 90 hrs | $95 |
| 2 | WhatsApp & Live Chat Auto-Reply | Messaging | Real-time | 91% | 19.2× | 72 hrs | $80 |
| 3 | Knowledge Base Auto-Suggestions | Self-Service | Real-time | 85% | 10.2× | 40 hrs | $55 |
| 4 | CSAT Survey & Sentiment Tracking | Feedback | Post-interaction | 88% | 12.5× | 30 hrs | $40 |
| 5 | SLA Monitoring & Breach Alerts | Operations | Continuous | 96% | 8.7× | 15 hrs | $30 |

**Automation Details:**

1. **Instant Ticket Triage & Auto-Response** — Classifies incoming tickets by urgency and category. Auto-resolves common issues with KB articles. Escalates complex ones with full context. (Avg time: 1.2s, Error rate: 0.6%)

2. **WhatsApp & Live Chat Auto-Reply** — Responds instantly on WhatsApp and live chat. Answers FAQs, checks order status, and collects info before escalating to humans. (Avg time: 1.5s, Error rate: 0.8%)

3. **Knowledge Base Auto-Suggestions** — Monitors conversations and proactively suggests relevant KB articles. Creates draft articles from frequently resolved tickets. (Avg time: 2.8s, Error rate: 1.5%, Status: Learning)

4. **CSAT Survey & Sentiment Tracking** — Sends satisfaction surveys after every resolution. Analyzes sentiment from responses and flags detractors for immediate follow-up. (Avg time: 1.5s, Error rate: 0.8%)

5. **SLA Monitoring & Breach Alerts** — Tracks response and resolution times against SLAs. Sends alerts when tickets approach breach thresholds and auto-escalates. (Avg time: 0.5s, Error rate: 0.3%)

---

### 4.3 Zuri — Success Agent

**Title:** Senior Customer Success Manager
**Department:** Success | **Reports To:** Head of Customer Success

**Bio:** Zuri turns customers into advocates. She monitors onboarding progress, tracks product adoption, detects churn signals early, and proactively re-engages accounts — ensuring every customer stays, grows, and refers.

**Key Metrics:**
- 97% retention rate
- 3.2× expansion revenue
- 96% customer satisfaction
- 99.7% uptime

**Core Tasks:**

| Task | Frequency | Impact |
|------|-----------|--------|
| Run onboarding sequences | Per new customer | 40% faster activation |
| Monitor product adoption | Daily | Early churn detection |
| Predict churn risk | Daily | 92% prediction accuracy |
| Send NPS & health surveys | Post-milestone | 72 avg NPS score |
| Manage renewals | Weekly | 94% renewal rate |
| Identify upsell opportunities | Weekly | 3.2× expansion revenue |
| Re-engage dormant accounts | As needed | 15% reactivation rate |

**Skills:** Onboarding Design, Churn Prediction, Account Health Monitoring, Upsell Identification, Customer Advocacy

**Certifications:** Gainsight Certified, Totango Expert, HubSpot Service Hub

**Connected Data Sources:**

| Source | Type | Status |
|--------|------|--------|
| HubSpot CRM | Customer Data | Connected |
| Stripe Billing | Subscription Data | Connected |
| Mixpanel | Product Analytics | Connected |
| Intercom | In-app Messaging | Connected |
| Slack | Internal Comms | Connected |
| Calendly | Meeting Scheduling | Connected |
| Typeform | Surveys & NPS | Syncing |
| Google Sheets | Reporting | Connected |

**Processes:**

1. **Customer Onboarding Journey** (Per new customer, Optimized)
   - Trigger welcome email → Schedule kickoff call → Send setup guide → Monitor product adoption → 30-day health check

2. **Churn Prevention Workflow** (Daily, Optimized)
   - Monitor usage decline signals → Analyze support ticket sentiment → Flag at-risk accounts → Trigger retention campaign → Escalate to CSM if needed

3. **Expansion & Upsell Cycle** (Weekly, New)
   - Identify high-usage accounts → Detect feature upgrade signals → Prepare personalized offer → Coordinate with sales → Track conversion

**Automations:**

| # | Automation | Category | Trigger | Success Rate | ROI | Time Saved/Mo | Cost/Mo |
|---|-----------|----------|---------|-------------|-----|---------------|---------|
| 1 | Automated Onboarding Sequences | Onboarding | Event-driven | 95% | 16.8× | 55 hrs | $70 |
| 2 | Churn Prediction & Retention Alerts | Retention | Daily | 92% | 8.7× | 35 hrs | $110 |
| 3 | NPS & Health Score Tracking | Feedback | Post-milestone | 88% | 12.5× | 30 hrs | $40 |
| 4 | Renewal & Upsell Orchestration | Revenue | Weekly | 94% | 14.1× | 22 hrs | $60 |
| 5 | Customer Re-engagement Campaigns | Engagement | Weekly | 82% | 7.4× | 18 hrs | $45 |

**Automation Details:**

1. **Automated Onboarding Sequences** — Triggers personalized onboarding drips, in-app guides, and check-in calls based on customer segment and product usage milestones. (Avg time: 3.1s, Error rate: 0.3%)

2. **Churn Prediction & Retention Alerts** — Analyzes usage patterns, support history, and billing data to predict churn risk. Triggers retention campaigns and CSM alerts automatically. (Avg time: 8s, Error rate: 0.9%)

3. **NPS & Health Score Tracking** — Sends NPS surveys at key milestones. Calculates customer health scores from usage, support, and billing data. Flags detractors for immediate outreach. (Avg time: 1.5s, Error rate: 0.8%)

4. **Renewal & Upsell Orchestration** — Tracks subscription renewal dates and usage patterns. Sends timely renewal reminders and identifies upsell opportunities based on feature adoption. (Avg time: 5s, Error rate: 0.4%)

5. **Customer Re-engagement Campaigns** — Detects inactive or declining-usage accounts. Sends personalized re-engagement emails with helpful content, tips, and offers to bring them back. (Avg time: 2s, Error rate: 1.2%)

---

### 4.4 Future AI Teammates (Coming Soon)

| Name | Role | Key Tasks |
|------|------|-----------|
| **Ade** | Marketing Ops | Campaign analytics, Lead scoring, Content distribution, A/B testing |
| **Nkechi** | Onboarding Specialist | Welcome sequences, Product walkthroughs, Milestone tracking, Activation nudges |
| **Tunde** | Collections Agent | Invoice follow-ups, Payment reminders, Dispute resolution, Account reconciliation |
| **Fatima** | Research Analyst | Market intelligence, Competitor monitoring, Customer insights, Trend analysis |
| **Emeka** | Scheduling Coordinator | Appointment booking, Calendar management, Reminders & follow-ups, Timezone handling |
| **Amina** | Compliance Monitor | Policy enforcement, Audit logging, Risk flagging, Regulatory checks |

---

## 5. User Flows

### 5.1 Landing Page

**URL:** `/`

**Navigation:**
- Logo + "Vaigence" branding
- Nav links: Problem | Solution | Workforce | How It Works
- Actions: "Log in" (secondary), "Get Started" (primary)

**Sections (in order):**

1. **Hero**
   - Tagline: "AI teammates for customer conversations"
   - Headline: "Never lose a customer again"
   - Subheading: "AI teammates that turn every conversation into revenue. Always on, always responds, never drops the ball."
   - CTAs: "Start Free" (primary), "See Dashboard Demo" (secondary)
   - Stats bar: <60s response time | 24/7 always on | 96% qualification rate | 3× revenue impact

2. **Problem** (anchor: #problem)
   - Headline: "Customer conversations are broken"
   - 4 stat cards: 30-50% no follow-up | 78% first responder wins | 10 min expected reply | 88% won't return
   - Comparison: "The Reality" (42hr avg response) vs "The Opportunity" (21× conversion in 5 min)

3. **Solution** (anchor: #solution)
   - Headline: "Hire an AI teammate for your customer conversations"
   - 3 pillars: Captures every lead | Relentless follow-up | Handles support 24/7
   - Agent showcase cards for Kofi, Amara, and Zuri (details in Section 4)

4. **AI Workforce** (anchor: #workforce)
   - Headline: "A growing team of specialists"
   - Current 3 agents + 6 coming-soon agents (details in Section 4.4)

5. **How It Works** (anchor: #how-it-works)
   - Headline: "Live in days, not months"
   - 4 steps: Sign up → Configure → Deploy → Manage

6. **Channels**
   - Headline: "Wherever your customers are"
   - 7 channel cards: WhatsApp, Telegram, Slack, Facebook, Email, Website, SMS

7. **CTA Section**
   - Final call-to-action with "Get Started Free"

8. **Footer**
   - Logo + copyright

---

### 5.2 Onboarding Flow

**URL:** `/onboarding`

A guided 4-step wizard with sidebar navigation (desktop) and progress bar (mobile).

**Step 1 — Sign Up**

| Field | Type | Placeholder | Required |
|-------|------|-------------|----------|
| Name | Text input | "e.g. Chidi Okafor" | Yes |
| Work email | Email input | "chidi@company.com" | Yes |
| Company name | Text input | "e.g. TechFlow Inc." | Yes |
| Industry | Single-select cards | — | Yes |

Industry options:
- E-commerce
- SaaS / Tech
- Services
- Other

**Step 2 — Configure**

| Field | Type | Default | Required |
|-------|------|---------|----------|
| Agent selection | Multi-select cards | None | At least 1 |
| Brand tone | Single-select | Professional | Yes |

Agent options: Sales Agent, Support Agent, Success Agent (each card shows description, key stats, and 5 key tasks)

Brand tone options: Professional, Friendly, Casual

**Step 3 — Deploy**

| Field | Type | Default | Required |
|-------|------|---------|----------|
| Channel selection | Multi-select cards | Sandbox | At least 1 |

Channel options:

| Channel | Description | Color |
|---------|-------------|-------|
| Sandbox | Test in a safe environment first | Primary |
| WhatsApp | Connect via WhatsApp Business | Green |
| Telegram | Deploy to Telegram bot | Blue |
| Slack | Add to your Slack workspace | Purple |
| Facebook | Connect Messenger | Blue |
| Email | Handle email conversations | Orange |
| Website | Embed chat widget on your site | Primary |
| SMS | Send and receive text messages | Emerald |

When Sandbox is selected, show confirmation message indicating safe testing mode.

**Step 4 — Manage (Confirmation)**

Display deployment summary:
- Company name
- Selected agents (list)
- Selected channels (list)
- Selected brand tone
- CTA: "Go to Dashboard" → navigates to `/dashboard`

---

### 5.3 Operations Dashboard

**URL:** `/dashboard`

**Layout:** Fixed left sidebar (navigation) + scrollable main content area

#### 5.3.1 Sidebar

**Team section:**
- Overview
- Kofi · Sales (with colored status indicator)
- Amara · Support (with colored status indicator)
- Zuri · Success (with colored status indicator)

**Manage section:**
- Settings

**Bottom card — Usage:**
- Plan name: "Pro Plan"
- Usage: "3 agents · 40,494 conversations this month"
- Progress bar: 67% filled

#### 5.3.2 Overview View

**Header:** "Operations Dashboard" / "Your AI teammates at a glance"

**Top-level metrics (5 cards):**

| Metric | Value | Subtitle |
|--------|-------|----------|
| Active Agents | 3 | All online |
| Conversations | 40,494 | +12% this week |
| Avg Performance | 94% | +3% vs last month |
| Automations Active | 15 | 1 learning |
| Cost Saved/Mo | $55.4K | vs manual ops |

**Agent cards (3-column grid):**
Each card displays agent avatar, name, role, status, performance score, and key stats. Clicking navigates to agent detail view.

**Bottom section (2-column grid):**

- **Performance Chart** — 7-day area chart showing daily conversation volume per agent (Sales, Support, Success). Data:

| Day | Sales | Support | Success |
|-----|-------|---------|---------|
| Mon | 420 | 580 | 310 |
| Tue | 510 | 620 | 340 |
| Wed | 480 | 710 | 290 |
| Thu | 620 | 680 | 380 |
| Fri | 590 | 750 | 410 |
| Sat | 340 | 420 | 190 |
| Sun | 280 | 380 | 160 |

- **Activity Feed** — Aggregated recent activity from all 3 agents (up to 8 items). Each item shows: status icon, agent name (color-coded), action description, target, and timestamp.

#### 5.3.3 Agent Detail View

Each agent (Sales, Support, Success) has a dedicated detail view with the following sections:

1. **Profile Header Card**
   - Avatar (large), name, "Online" badge, title, bio
   - Department, Reports To, Hired Date
   - Stats: Jobs Done | Performance % | Uptime %
   - Progress bars: Onboarding Progress, Upskill Level (/5)

2. **Performance Metrics (2×2 grid)**
   - Tasks This Week
   - Avg Response Time
   - Cost Saved
   - Agent-specific metric: Revenue Influenced (Sales) | CSAT Score (Support) | Error Rate (Success)

3. **Key Tasks** — Cards showing task name, description, frequency, and impact (see agent sections above for full task lists)

4. **Skills & Certifications** — Two-column layout showing skill tags and certification badges

5. **Data Sources** — Grid of connected integrations showing name, type, and connection status (connected/syncing/error)

6. **Processes** — Workflow cards showing process name, status badge (optimized/needs-review/new), frequency, and step-by-step flow with arrows

7. **Automations** — Clickable cards showing:
   - Name + status badge (active/paused/learning/completed)
   - Category tag, ROI multiplier, time saved
   - Description
   - Stats: Jobs Done, Success %, Avg Time, Last Run
   - Clicking opens Automation Detail Modal

8. **Recent Activity** — Timestamped activity items with status icons

#### 5.3.4 Automation Detail Modal

Opens when clicking any automation card. Displays:

- Name + status badge + category tag
- Full description
- 4 stat boxes: Jobs Done, Success Rate, Avg Time, Error Rate
- 3 info cards: Est. Monthly Cost, Time Saved/Month, ROI Multiplier
- Tools & Integrations list
- Execution details: Trigger frequency, Last Run timestamp

#### 5.3.5 Settings View

5 configuration sections:

| Section | Description | Items |
|---------|-------------|-------|
| **Team & Permissions** | Manage who can view and control agents | Admin access, Role-based permissions, Audit logs |
| **Notifications** | Configure alerts for agent activity and errors | Email alerts, Slack notifications, SMS for critical errors |
| **Security & Compliance** | Data access policies and encryption settings | API key management, Data retention policy, SSO configuration |
| **Billing & Usage** | Plan details, invoices, and usage metrics | Current plan: Pro, 3/5 agent slots used, 40,494 jobs this month |
| **Integrations** | Manage connected services and API keys | 16 active connections, 3 pending setup, Webhook management |

---

### 5.4 404 Page

**URL:** `*` (any unmatched route)

Display a "Page Not Found" message with navigation back to the landing page.

---

## 6. Deployment Channels

The platform supports 8 deployment channels:

| Channel | Description |
|---------|-------------|
| **Sandbox** | Safe test environment for validating agent behavior before going live |
| **WhatsApp Business** | Direct messaging integration via WhatsApp Business API |
| **Telegram** | Bot deployment on Telegram |
| **Slack** | Workspace integration for internal/external use |
| **Facebook Messenger** | Social platform messaging integration |
| **Email** | Email-based conversation handling |
| **Website** | Embeddable chat widget for any website |
| **SMS** | Text message support via SMS providers |

---

## 7. Design Requirements

### 7.1 Typography
- **Display font:** Space Grotesk (weights 300–700) — used for headings and hero text
- **Body font:** Inter (weights 300–600) — used for body text and UI elements

### 7.2 Color System

**Base palette:**
- Primary: Dark navy/charcoal
- Secondary: Light gray
- Background: Very light gray
- Cards: White
- Borders: Medium gray

**Agent-specific colors (used consistently across all surfaces):**
- Kofi / Sales: Orange
- Amara / Support: Blue
- Zuri / Success: Green

**Status colors:**
- Success: Green
- Warning: Amber/Gold
- Error/Destructive: Red
- Info: Blue

### 7.3 UI Patterns
- Card-based layouts throughout
- Color-coded agent identification (borders, status dots, text accents)
- Smooth entrance animations with staggered delays
- Responsive design: mobile, tablet, desktop
- Dark/light theme support
- Default border radius: 12px
- Status badges: active (green), paused (yellow), learning (blue), completed (gray)

### 7.4 Responsive Behavior
- Sidebar collapses on mobile
- Grid layouts adapt: 1-col (mobile) → 2-col (tablet) → 3-5 col (desktop)
- Onboarding sidebar becomes top progress bar on mobile

---

## 8. Routing

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Marketing site with value prop, agents, and CTAs |
| `/onboarding` | Onboarding Wizard | 4-step guided setup flow |
| `/dashboard` | Operations Dashboard | Agent management, analytics, settings |
| `*` | 404 Not Found | Catch-all for invalid routes |

All routing is client-side. The "Get Started" and "Start Free" CTAs navigate to `/onboarding`. The onboarding completion CTA navigates to `/dashboard`.

---

## 9. Data Model Summary

### 9.1 Agent

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (sales, support, success) |
| name | string | Agent's name |
| role | string | Short role label |
| title | string | Full job title |
| bio | string | Agent biography/description |
| avatar | image | Agent profile image |
| colorVar | string | Agent color theme identifier |
| onboardingProgress | number (0-100) | Training completion percentage |
| totalJobs | number | Lifetime jobs completed |
| activeAutomations | number | Count of active automations |
| performance | number (0-100) | Overall performance score |
| upskillLevel | number (0-5) | Current training level |
| hiredDate | string | Date the agent was activated |
| department | string | Department name |
| reportingTo | string | Manager/supervisor |
| dataSources | DataSource[] | Connected integrations |
| automations | Automation[] | Configured automations |
| processes | Process[] | Defined workflows |
| metrics | AgentMetrics | Current performance data |
| recentActivity | ActivityItem[] | Recent action log |
| skills | string[] | Agent capabilities |
| certifications | string[] | Validated qualifications |
| tasks | Task[] | Core job responsibilities |

### 9.2 Automation

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Automation name |
| description | string | What it does |
| status | enum | active, paused, learning, completed |
| jobsDone | number | Total executions |
| successRate | number (0-100) | Success percentage |
| avgTime | string | Average execution duration |
| lastRun | string | Time since last execution |
| category | string | Functional category |
| estimatedMonthlyCost | string | Monthly cost estimate |
| timeSavedPerMonth | string | Hours saved per month |
| roiMultiplier | number | Return on investment multiplier |
| toolsUsed | string[] | Integration tools |
| triggerFrequency | string | How often it runs |
| errorRate | number | Error percentage |

### 9.3 Data Source

| Field | Type | Description |
|-------|------|-------------|
| name | string | Integration name |
| type | string | Category (CRM, Messaging, etc.) |
| status | enum | connected, syncing, error |

### 9.4 Process

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Process name |
| steps | string[] | Ordered workflow steps |
| frequency | string | How often it runs |
| owner | string | Responsible agent |
| status | enum | optimized, needs-review, new |

### 9.5 Agent Metrics

| Field | Type | Description |
|-------|------|-------------|
| tasksThisWeek | number | Weekly task count |
| avgResponseTime | string | Average response duration |
| customerSatisfaction | number (optional) | CSAT score |
| revenueInfluenced | string (optional) | Revenue attributed |
| ticketsResolved | number (optional) | Weekly ticket count |
| costSaved | string | Monthly cost savings |
| uptimePercent | number | Availability percentage |
| errorRate | number | Error percentage |

### 9.6 Activity Item

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| action | string | What happened |
| target | string | Who/what was affected |
| time | string | When it happened |
| status | enum | success, warning, error, info |

### 9.7 Task

| Field | Type | Description |
|-------|------|-------------|
| name | string | Task name |
| description | string | What the task does |
| frequency | string | How often it runs |
| impact | string | Measurable outcome |

---

## 10. Current State & Scope

### 10.1 What Exists Today (Frontend Only)
- Fully designed and implemented landing page
- Complete 4-step onboarding wizard (client-side only, no persistence)
- Full operations dashboard with overview and agent detail views
- All agent data is hardcoded/mock data
- No authentication or user management
- No backend API or database
- No real integrations with external services
- Settings page is display-only (non-functional)

### 10.2 What Needs to Be Built

**Backend & Infrastructure:**
- User authentication and session management
- User registration and account creation
- Database for users, organizations, agent configurations, and analytics
- API layer for all dashboard data (agents, automations, metrics, activity)
- Real-time data pipeline for agent activity and metrics

**Integrations:**
- OAuth flows for each data source (HubSpot, Zendesk, Stripe, etc.)
- Channel deployment infrastructure (WhatsApp Business API, Telegram Bot API, etc.)
- Webhook management for real-time event processing

**Agent Engine:**
- AI conversation engine powering each agent's responses
- Automation execution runtime
- Process orchestration
- Performance tracking and analytics collection

**Dashboard Enhancements:**
- Live data instead of mock data
- Real-time activity feeds via WebSocket or SSE
- Functional settings (team management, billing, notifications)
- Agent configuration editing (not just viewing)
- Automation creation, editing, pausing, and deletion

**Billing:**
- Subscription management (Pro plan, agent slot limits)
- Usage tracking and metering
- Payment processing

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Average lead response time | < 60 seconds |
| Lead qualification accuracy | ≥ 96% |
| Ticket auto-resolution rate | ≥ 65% |
| CSAT score | ≥ 94% |
| Customer retention rate | ≥ 97% |
| Agent uptime | ≥ 99.7% |
| Automation error rate | < 1.5% |
| Platform cost savings vs manual ops | ≥ $55K/mo per customer |

---

## 12. Open Questions

1. What is the pricing model? (per agent, per conversation, tiered plans?)
2. What are the plan tiers beyond Pro? What are the agent slot limits per tier?
3. How should the Sandbox environment work? Simulated conversations or real test data?
4. What is the escalation path when an AI agent can't handle a conversation?
5. What compliance/data residency requirements exist for different markets?
6. How should agent "learning" status work? What triggers the transition from learning to active?
7. What is the multi-tenancy model? Single org per account or multi-org?
8. How should the "coming soon" agents (Ade, Nkechi, Tunde, Fatima, Emeka, Amina) be prioritized?
9. What analytics/reporting do customers need beyond what's shown in the dashboard?
10. What is the SLA commitment for the platform itself?

---

*This document describes the product as designed. Implementation decisions regarding technology stack, infrastructure, and architecture are left to the engineering team.*
