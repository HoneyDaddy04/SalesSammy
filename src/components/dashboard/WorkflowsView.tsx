import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Shield, ChevronDown, ChevronUp, Loader2, Brain, Check, Edit3, Save, X, MessageSquare, Settings2, ChevronRight, Plus, Import, RotateCw, Reply, Award, Mail, Database, Filter, FileText, Bell, UserCheck, Search, Eye, Send, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { API_BASE, ORG_KEY } from "@/lib/constants";

interface Sequence { id: string; template_key: string; name: string; description: string; touches: string; active: number; }
interface Contact { id: string; sequence_id: string; status: string; }

// ── Step configuration ──

interface StepConfig {
  name: string;
  desc: string;
  icon: typeof Mail;
  connectedTo?: string;
  configLabel?: string;
  configValue?: string;
  configOptions?: string[];
}

interface WorkflowDef {
  id: string;
  name: string;
  desc: string;
  icon: typeof Import;
  frequency: string;
  active: boolean;
  steps: StepConfig[];
}

const makeWorkflows = (integrations: any[], sequences: Sequence[]): WorkflowDef[] => {
  const connectedSources = integrations
    .filter(i => i.category === "lead_source" && i.status === "connected")
    .map(i => i.type === "csv" ? "CSV Upload" : i.type === "google_sheets" ? "Google Sheets" : i.type === "hubspot" ? "HubSpot" : i.type);
  const connectedChannels = integrations
    .filter(i => i.category === "channel" && i.status === "connected")
    .map(i => i.type === "gmail" ? "Gmail" : i.type === "whatsapp" ? "WhatsApp" : i.type === "linkedin" ? "LinkedIn DM" : i.type);
  const allSources = ["CSV Upload", "Google Sheets", "HubSpot", "Salesforce", "Pipedrive", "Airtable", "Shopify"];
  const allChannels = ["Gmail", "Outlook", "WhatsApp", "LinkedIn DM", "SMS (Twilio)", "Telegram"];
  const seqNames = sequences.map(s => s.name);

  return [
    {
      id: "lead_intake", name: "Lead Intake", desc: "New contacts imported from any source get assigned to a sequence and their first touch gets scheduled.",
      icon: Import, frequency: "On import", active: true,
      steps: [
        { name: "Import from source", desc: "Pull contacts from a connected lead source", icon: Database,
          connectedTo: connectedSources.join(", ") || "None connected",
          configLabel: "Sources", configValue: connectedSources.join(", ") || "Not set",
          configOptions: allSources },
        { name: "Deduplicate", desc: "Match by email. Skip if contact already exists in pipeline", icon: Filter,
          connectedTo: "Built-in", configLabel: "Match by", configValue: "Email address",
          configOptions: ["Email address", "Email + phone", "Email + company name"] },
        { name: "Assign sequence", desc: "Place contact into a follow-up sequence", icon: FileText,
          connectedTo: seqNames[0] || "Cold Outbound",
          configLabel: "Default sequence", configValue: seqNames[0] || "Cold Outbound",
          configOptions: seqNames.length > 0 ? seqNames : ["Cold Outbound", "Abandoned Cart", "Inbound Lead", "Re-engagement", "Post-Conversion", "Stalled Lead Revival"] },
        { name: "Schedule first touch", desc: "Queue the first message based on sequence timing", icon: Clock,
          connectedTo: "Immediate", configLabel: "Timing", configValue: "Within 5 minutes of import",
          configOptions: ["Within 5 minutes of import", "Within 1 hour", "Next business day morning", "Custom delay"] },
        { name: "Activate", desc: "Mark contact as active and start the sequence", icon: Check,
          connectedTo: "Automatic" },
      ],
    },
    {
      id: "follow_up", name: "Follow-Up Sequence", desc: "Scans for leads with due touches, researches them, drafts a personalized message, and queues it for your approval.",
      icon: RotateCw, frequency: "Every 30 min", active: true,
      steps: [
        { name: "Check due contacts", desc: "Find contacts whose next touch is due now", icon: Search,
          connectedTo: "Built-in", configLabel: "Check interval", configValue: "Every 30 minutes",
          configOptions: ["Every 15 minutes", "Every 30 minutes", "Every hour", "Every 2 hours"] },
        { name: "Research lead", desc: "Pull context from CRM, LinkedIn, prior emails, and knowledge base", icon: Eye,
          connectedTo: [
            ...integrations.filter(i => i.category === "context" && i.status === "connected").map(i => i.type === "gmail_read" ? "Gmail (Read)" : i.type),
            "Knowledge Base",
          ].join(", ") || "Knowledge Base",
          configLabel: "Context sources", configValue: "Gmail threads, Knowledge Base" },
        { name: "Draft personalized message", desc: "Write a unique message in your voice using lead context and sequence angle", icon: FileText,
          connectedTo: "Sammy AI",
          configLabel: "Voice", configValue: "Your captured voice samples" },
        { name: "Queue for approval", desc: "Draft lands in your approval queue for review", icon: Bell,
          connectedTo: "Dashboard", configLabel: "Notification", configValue: "Dashboard + email digest",
          configOptions: ["Dashboard only", "Dashboard + email digest", "Dashboard + email + push", "Email only"] },
        { name: "Send on approve", desc: "Once you approve or edit, send via the assigned channel", icon: Send,
          connectedTo: connectedChannels.join(", ") || "None connected",
          configLabel: "Channels", configValue: connectedChannels.join(", ") || "Not set",
          configOptions: allChannels },
        { name: "Log and advance", desc: "Record the touch, update CRM, advance to next step in sequence", icon: Database,
          connectedTo: "Built-in + CRM sync" },
      ],
    },
    {
      id: "reply_handling", name: "Reply Handling", desc: "When a lead replies, Sammy classifies intent and either drafts a response, escalates to you, or pauses the sequence.",
      icon: Reply, frequency: "Real-time", active: true,
      steps: [
        { name: "Detect inbound reply", desc: "Monitor connected channels for incoming messages from active contacts", icon: Mail,
          connectedTo: connectedChannels.join(", ") || "None connected",
          configLabel: "Monitoring", configValue: connectedChannels.join(", ") || "Not set",
          configOptions: allChannels },
        { name: "Classify intent", desc: "Determine if reply is positive, question, objection, or opt-out", icon: Brain,
          connectedTo: "Sammy AI",
          configLabel: "Classifications", configValue: "Positive, Question, Objection, Opt-out, Hostile" },
        { name: "Draft response or escalate", desc: "For questions/positive: draft reply. For objections: draft or escalate. For hostile/opt-out: escalate immediately.", icon: UserCheck,
          connectedTo: "Rules-based + AI",
          configLabel: "Escalation contact", configValue: "You (owner)" },
        { name: "Queue for approval", desc: "Response draft lands in your queue. Hostile/opt-out triggers immediate notification.", icon: Bell,
          connectedTo: "Dashboard", configLabel: "Urgent alerts", configValue: "Email + push",
          configOptions: ["Dashboard only", "Email + push", "SMS alert", "All channels"] },
      ],
    },
    {
      id: "autonomy_graduation", name: "Autonomy Graduation", desc: "After enough approvals with low edit distance, Sammy earns the ability to send certain message types without asking.",
      icon: Award, frequency: "After milestones", active: false,
      steps: [
        { name: "Track approval count", desc: "Count how many messages of each type you have approved", icon: Database,
          connectedTo: "Built-in", configLabel: "Current count", configValue: "0 first-touches, 0 follow-ups" },
        { name: "Measure edit distance", desc: "Track how much you change drafts before approving. Less editing = higher trust.", icon: Eye,
          connectedTo: "Built-in", configLabel: "Threshold", configValue: "Less than 20% edit rate",
          configOptions: ["Less than 10% edit rate", "Less than 20% edit rate", "Less than 30% edit rate"] },
        { name: "Propose graduation", desc: "When milestones are met, Sammy proposes auto-sending that message type", icon: Award,
          connectedTo: "Dashboard notification" },
        { name: "You approve", desc: "You decide whether to grant auto-send permission for that type", icon: UserCheck,
          connectedTo: "Your decision" },
        { name: "Auto-send that type", desc: "Messages of that type send automatically. You can revoke anytime.", icon: Send,
          connectedTo: "Controlled by you" },
      ],
    },
  ];
};

// ── Available workflow types you can add ──
const addableWorkflows = [
  { id: "lead_intake", name: "Lead Intake", desc: "Import > Deduplicate > Assign > Schedule > Activate", icon: Import },
  { id: "follow_up", name: "Follow-Up Sequence", desc: "Check due > Research > Draft > Approve > Send", icon: RotateCw },
  { id: "reply_handling", name: "Reply Handling", desc: "Detect reply > Classify > Draft/Escalate > Approve", icon: Reply },
  { id: "autonomy_graduation", name: "Autonomy Graduation", desc: "Track approvals > Measure edits > Propose > Grant", icon: Award },
  { id: "lead_scoring", name: "Lead Scoring", desc: "Score leads based on engagement, fit, and signals", icon: Search },
  { id: "meeting_booking", name: "Meeting Booking", desc: "When lead is ready, send calendar link and confirm", icon: Clock },
];

// ── Sequence templates by business type ──
interface SequenceTouch {
  day_offset: number;
  angle: string;
  channel_tier: string;
  hint: string;
}

interface SequenceTemplate {
  name: string;
  desc: string;
  touches: SequenceTouch[];
  channels: string[];
}

interface BusinessCategory {
  type: string;
  desc: string;
  templates: SequenceTemplate[];
}

const angleLabels: Record<string, string> = {
  trigger_event: "Lead with strongest trigger signal", value_add: "Share something useful, no ask",
  different_angle: "Try a new angle or channel", permission_to_close: "Soft close: 'bad timing?'",
  revival: "Only if a new trigger emerges",
};
const tierLabels: Record<string, string> = { primary: "Primary channel", secondary: "Secondary channel", tertiary: "Tertiary channel" };

const sequenceTemplates: BusinessCategory[] = [
  {
    type: "SaaS / Tech", desc: "Software companies selling to businesses",
    templates: [
      { name: "Cold Outbound (B2B)", desc: "Classic multi-touch outreach for cold prospects. 5 touches over 18 days.", channels: ["Email", "LinkedIn"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "Reference a specific signal: funding, hiring, social post" },
          { day_offset: 3, angle: "value_add", channel_tier: "primary", hint: "Share something useful (guide, stat, insight), no ask" },
          { day_offset: 7, angle: "different_angle", channel_tier: "secondary", hint: "Try LinkedIn or a new framing. Mention a case study" },
          { day_offset: 12, angle: "permission_to_close", channel_tier: "primary", hint: "Soft close: 'bad timing? no worries, just say the word'" },
          { day_offset: 18, angle: "revival", channel_tier: "secondary", hint: "Only if a new trigger emerges. Otherwise let it rest" },
        ] },
      { name: "Free Trial Activation", desc: "Nurture trial signups toward activation. 4 touches over 12 days.", channels: ["Email"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "Welcome + quick-start guide. Get them to first value" },
          { day_offset: 3, angle: "value_add", channel_tier: "primary", hint: "Highlight the one feature that hooks most users" },
          { day_offset: 7, angle: "different_angle", channel_tier: "primary", hint: "Share a case study of a similar company" },
          { day_offset: 12, angle: "permission_to_close", channel_tier: "primary", hint: "Trial ending soon. Offer a call or extend" },
        ] },
      { name: "Inbound Demo Follow-Up", desc: "After someone requests a demo. 4 touches over 10 days.", channels: ["Email", "LinkedIn", "WhatsApp"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "Confirm the demo, share prep material" },
          { day_offset: 1, angle: "value_add", channel_tier: "secondary", hint: "Pre-demo: share a relevant resource about their pain point" },
          { day_offset: 3, angle: "different_angle", channel_tier: "primary", hint: "Post-demo recap with key points and next steps" },
          { day_offset: 10, angle: "permission_to_close", channel_tier: "primary", hint: "ROI breakdown or decision nudge" },
        ] },
    ],
  },
  {
    type: "E-Commerce / DTC", desc: "Online stores and direct-to-consumer brands",
    templates: [
      { name: "Abandoned Cart Recovery", desc: "Recover lost sales from cart abandoners. 3 touches in 3 days.", channels: ["Email", "SMS", "WhatsApp"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "Reminder: 'You left something behind'. Show the product" },
          { day_offset: 1, angle: "value_add", channel_tier: "secondary", hint: "Social proof: reviews, 'X people bought this today'" },
          { day_offset: 3, angle: "permission_to_close", channel_tier: "primary", hint: "Last chance + small discount or free shipping" },
        ] },
      { name: "Post-Purchase Upsell", desc: "Cross-sell after a purchase. 4 touches over 14 days.", channels: ["Email", "SMS"],
        touches: [
          { day_offset: 2, angle: "value_add", channel_tier: "primary", hint: "Usage tips for what they just bought" },
          { day_offset: 5, angle: "different_angle", channel_tier: "primary", hint: "Complementary product suggestion" },
          { day_offset: 10, angle: "trigger_event", channel_tier: "primary", hint: "Ask for a review" },
          { day_offset: 14, angle: "value_add", channel_tier: "secondary", hint: "Loyalty reward or referral offer" },
        ] },
      { name: "VIP Customer Nurture", desc: "Keep high-value customers engaged. 3 touches over 21 days.", channels: ["Email", "WhatsApp"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "Welcome to VIP. Exclusive early access" },
          { day_offset: 7, angle: "value_add", channel_tier: "secondary", hint: "Personal shopper check-in on WhatsApp" },
          { day_offset: 21, angle: "different_angle", channel_tier: "primary", hint: "Birthday/anniversary surprise or special offer" },
        ] },
    ],
  },
  {
    type: "Professional Services", desc: "Agencies, consultancies, and service firms",
    templates: [
      { name: "Cold Outbound (Services)", desc: "Relationship-first outreach. 5 touches over 21 days.", channels: ["Email", "LinkedIn"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "Reference a trigger: new role, expansion, industry shift" },
          { day_offset: 5, angle: "value_add", channel_tier: "primary", hint: "Share an insight or framework, no pitch" },
          { day_offset: 10, angle: "different_angle", channel_tier: "secondary", hint: "Try LinkedIn. Reference a mutual connection" },
          { day_offset: 16, angle: "permission_to_close", channel_tier: "primary", hint: "Offer a free 15-min consultation" },
          { day_offset: 21, angle: "revival", channel_tier: "primary", hint: "Only if new trigger. Otherwise close gracefully" },
        ] },
      { name: "Referral Activation", desc: "Turn happy clients into referral sources. 3 touches over 14 days.", channels: ["Email", "WhatsApp"],
        touches: [
          { day_offset: 0, angle: "value_add", channel_tier: "primary", hint: "Thank you + ask for NPS or testimonial" },
          { day_offset: 7, angle: "different_angle", channel_tier: "primary", hint: "Would you be open to a quick case study?" },
          { day_offset: 14, angle: "trigger_event", channel_tier: "secondary", hint: "Know anyone who might benefit? Referral reward" },
        ] },
    ],
  },
  {
    type: "Real Estate", desc: "Agents, brokerages, and property managers",
    templates: [
      { name: "New Listing Alert", desc: "Notify matching buyers. 4 touches over 10 days.", channels: ["Email", "WhatsApp", "SMS"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "New property matching their criteria. Photos + key details" },
          { day_offset: 2, angle: "value_add", channel_tier: "secondary", hint: "Virtual tour invite or neighborhood info" },
          { day_offset: 5, angle: "different_angle", channel_tier: "primary", hint: "Schedule a viewing. 'Slots filling up this weekend'" },
          { day_offset: 10, angle: "permission_to_close", channel_tier: "secondary", hint: "Price update or urgency: 'other offers coming in'" },
        ] },
      { name: "Seller Lead Nurture", desc: "Convert homeowners considering selling. 4 touches over 14 days.", channels: ["Email", "SMS"],
        touches: [
          { day_offset: 0, angle: "trigger_event", channel_tier: "primary", hint: "Free market report for their area" },
          { day_offset: 4, angle: "value_add", channel_tier: "primary", hint: "Estimated home value based on recent sales" },
          { day_offset: 8, angle: "different_angle", channel_tier: "secondary", hint: "Success story: 'We sold this home in 5 days'" },
          { day_offset: 14, angle: "permission_to_close", channel_tier: "primary", hint: "Free consultation offer. No commitment" },
        ] },
    ],
  },
];

type MainTab = "workflows" | "templates";

const WorkflowsView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teammate, setTeammate] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRules, setEditingRules] = useState(false);
  const [escalationRules, setEscalationRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [saving, setSaving] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("workflows");
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>("lead_intake");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [customizePrompt, setCustomizePrompt] = useState("");
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editingTiming, setEditingTiming] = useState(false);
  const [timingRulesList, setTimingRulesList] = useState([
    "Never send within 24 hours of previous touch on same channel",
    "Respect lead's timezone. Business hours on their side",
    "No weekends or regional holidays",
    "Back off after silence (extend gaps after 2+ unopened touches)",
    "Accelerate after engagement (open, click, reaction)",
    "Avoid Friday afternoons and Monday mornings for B2B",
  ]);
  const [newTimingRule, setNewTimingRule] = useState("");
  const [expandedSeq, setExpandedSeq] = useState<string | null>(null);
  const [activatingTemplate, setActivatingTemplate] = useState<string | null>(null);
  const [savingCustomize, setSavingCustomize] = useState(false);
  const [stepConfigEdits, setStepConfigEdits] = useState<Record<string, string[]>>({});

  // Escape key to close add menu
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAddMenu) setShowAddMenu(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showAddMenu]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/sequences`).then(r => r.json()).catch(() => []),
      orgId ? fetch(`${API_BASE}/api/contacts?org_id=${orgId}`).then(r => r.json()).catch(() => []) : Promise.resolve([]),
      orgId ? fetch(`${API_BASE}/api/teammate?org_id=${orgId}`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
      orgId ? fetch(`${API_BASE}/api/integrations?org_id=${orgId}`).then(r => r.json()).catch(() => []) : Promise.resolve([]),
    ]).then(([s, c, t, intg]) => {
      setSequences(s); setContacts(c); setTeammate(t); setIntegrations(intg);
      if (t?.guardrails) {
        try { setEscalationRules(JSON.parse(t.guardrails)); } catch {}
      }
    }).catch(() => { toast.error("Failed to load workflows"); }).finally(() => setLoading(false));
  }, [orgId]);

  const saveRules = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/teammate`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, guardrails: escalationRules }),
      });
      setEditingRules(false);
      toast.success("Rules saved");
    } catch (err) { toast.error("Failed to save rules"); } finally { setSaving(false); }
  };

  const activateTemplate = async (tmpl: SequenceTemplate) => {
    const tmplKey = `custom_${tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    setActivatingTemplate(tmpl.name);
    try {
      const res = await fetch(`${API_BASE}/api/sequences`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_key: tmplKey, name: tmpl.name, description: tmpl.desc, touches: tmpl.touches }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to activate template");
        return;
      }
      toast.success(`"${tmpl.name}" sequence activated`);
      // Reload sequences
      const updated = await fetch(`${API_BASE}/api/sequences`).then(r => r.json()).catch(() => []);
      setSequences(updated);
    } catch { toast.error("Failed to activate template"); } finally { setActivatingTemplate(null); }
  };

  const applyCustomization = async (workflowId: string, prompt: string) => {
    if (!prompt.trim()) return;
    setSavingCustomize(true);
    try {
      // Use the teammate chat endpoint to process and persist the instruction
      const res = await fetch(`${API_BASE}/api/teammate/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, message: `Workflow "${workflowId}" adjustment: ${prompt}` }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.response?.substring(0, 100) || "Customization applied");
      setCustomizePrompt("");
    } catch { toast.error("Failed to apply customization"); } finally { setSavingCustomize(false); }
  };

  const saveStepConfig = async (workflowId: string, stepIndex: number, selectedOptions: string[]) => {
    try {
      await fetch(`${API_BASE}/api/teammate/workflow-config`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, workflow_id: workflowId, config: { [`step_${stepIndex}`]: selectedOptions } }),
      });
      toast.success("Step configuration saved");
      setEditingStep(null);
    } catch { toast.error("Failed to save step config"); }
  };

  const toggleStepOption = (stepKey: string, option: string, currentValue: string) => {
    const current = stepConfigEdits[stepKey] || currentValue.split(", ").filter(Boolean);
    const updated = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
    setStepConfigEdits({ ...stepConfigEdits, [stepKey]: updated });
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2"><div className="h-7 w-36 rounded bg-muted" /><div className="h-4 w-80 rounded bg-muted" /></div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse">
          <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-4 w-1/4 rounded bg-muted" /><div className="h-3 w-2/3 rounded bg-muted" /></div><div className="h-4 w-16 rounded bg-muted" /></div>
        </div>
      ))}
    </div>
  );

  const workflows = makeWorkflows(integrations, sequences);

  const autonomySteps = [
    { label: "Shadow mode (current)", desc: "Every message needs your approval", active: true },
    { label: "After 20 first-touches approved", desc: "First-touch emails send automatically", active: false },
    { label: "After 20 follow-ups approved", desc: "Follow-up emails send automatically", active: false },
    { label: "After 20 simple replies approved", desc: "Simple reply responses send automatically", active: false },
    { label: "Full autonomy", desc: "Everything except escalations sends automatically", active: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Workflows</h2>
          <p className="text-sm text-muted-foreground mt-1">How Sammy operates. Every step, every source, every tool. Click any step to inspect or configure it.</p>
        </div>
      </div>

      {/* Main Tabs + Add button */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1">
          <button onClick={() => setMainTab("workflows")}
            className={cn("flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              mainTab === "workflows" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            Active Workflows
          </button>
          <button onClick={() => setMainTab("templates")}
            className={cn("flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              mainTab === "templates" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            Sequence Templates
          </button>
        </div>
        {mainTab === "workflows" && (
          <div className="relative -mb-px">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs mb-2" onClick={() => setShowAddMenu(!showAddMenu)}>
              <Plus className="w-3.5 h-3.5" /> Add Workflow
            </Button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-border bg-card shadow-lg z-50 py-2">
                  {addableWorkflows.map((aw) => {
                    const already = workflows.some(w => w.id === aw.id);
                    return (
                      <button key={aw.id} disabled={already}
                        onClick={() => setShowAddMenu(false)}
                        className={cn("w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                          already ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary/50 cursor-pointer"
                        )}>
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <aw.icon className="w-4 h-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{aw.name}</p>
                          <p className="text-[10px] text-muted-foreground">{aw.desc}</p>
                        </div>
                        {already && <span className="text-[9px] text-muted-foreground ml-auto">Active</span>}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── TAB 1: ACTIVE WORKFLOWS ─── */}
      {mainTab === "workflows" && (
        <div className="space-y-8">
          {/* Workflow Cards */}
          <div className="space-y-4">
            {workflows.map((wf) => {
              const isExpanded = expandedWorkflow === wf.id;
              const Icon = wf.icon;

              return (
                <motion.div key={wf.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

                  <button onClick={() => setExpandedWorkflow(isExpanded ? null : wf.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-semibold text-foreground">{wf.name}</h4>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full",
                          wf.active ? "text-success bg-success/10" : "text-muted-foreground bg-secondary"
                        )}>{wf.active ? "Active" : "Planned"}</span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{wf.frequency}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{wf.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{wf.steps.length} steps</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border overflow-hidden">
                        <div className="px-5 py-4 space-y-0">
                          {wf.steps.map((step, i) => {
                            const stepKey = `${wf.id}-${i}`;
                            const isStepExpanded = expandedStep === stepKey;
                            const isStepEditing = editingStep === stepKey;
                            const StepIcon = step.icon;

                            return (
                              <div key={i}>
                                <div
                                  onClick={() => setExpandedStep(isStepExpanded ? null : stepKey)}
                                  className={cn(
                                    "flex items-start gap-3 py-3 cursor-pointer rounded-lg px-2 -mx-2 transition-colors",
                                    isStepExpanded ? "bg-secondary/30" : "hover:bg-secondary/20"
                                  )}>
                                  <div className="flex flex-col items-center pt-0.5">
                                    <div className={cn(
                                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                      wf.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                                    )}>
                                      {i + 1}
                                    </div>
                                    {i < wf.steps.length - 1 && <div className="w-0.5 h-5 bg-border mt-1" />}
                                  </div>
                                  <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 mt-0.5">
                                    <StepIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-foreground">{step.name}</p>
                                      {step.connectedTo && step.connectedTo !== "Built-in" && step.connectedTo !== "Automatic" && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/80 font-medium truncate max-w-[200px]">
                                          {step.connectedTo}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                                  </div>
                                  <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-2 transition-transform", isStepExpanded && "rotate-90")} />
                                </div>

                                <AnimatePresence>
                                  {isStepExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden">
                                      <div className="ml-12 pl-3 border-l-2 border-primary/20 py-3 space-y-3">
                                        {step.configLabel && (
                                          <div className="flex items-start gap-3">
                                            <span className="text-[10px] text-muted-foreground w-24 shrink-0 pt-0.5">{step.configLabel}</span>
                                            <div className="flex-1">
                                              {isStepEditing && step.configOptions ? (
                                                <div className="space-y-2">
                                                  <div className="flex flex-wrap gap-1.5">
                                                    {step.configOptions.map((opt) => {
                                                      const selected = stepConfigEdits[stepKey] || (step.configValue || "").split(", ").filter(Boolean);
                                                      const isActive = selected.includes(opt);
                                                      return (
                                                        <button key={opt}
                                                          onClick={(e) => { e.stopPropagation(); toggleStepOption(stepKey, opt, step.configValue || ""); }}
                                                          className={cn("text-[10px] px-2.5 py-1 rounded-lg border transition-colors",
                                                            isActive ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/30"
                                                          )}>
                                                          {opt}
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button size="sm" className="h-7 text-[10px]" onClick={(e) => {
                                                      e.stopPropagation();
                                                      const selected = stepConfigEdits[stepKey] || (step.configValue || "").split(", ").filter(Boolean);
                                                      saveStepConfig(wf.id, i, selected);
                                                      const copy = { ...stepConfigEdits }; delete copy[stepKey]; setStepConfigEdits(copy);
                                                    }}>Save</Button>
                                                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={(e) => {
                                                      e.stopPropagation(); setEditingStep(null);
                                                      const copy = { ...stepConfigEdits }; delete copy[stepKey]; setStepConfigEdits(copy);
                                                    }}>Cancel</Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <p className="text-xs text-foreground">{step.configValue}</p>
                                                  {step.configOptions && (
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingStep(stepKey); }}
                                                      className="text-[9px] text-primary hover:text-primary/80 flex items-center gap-0.5">
                                                      <Settings2 className="w-2.5 h-2.5" /> Change
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {step.connectedTo && (
                                          <div className="flex items-start gap-3">
                                            <span className="text-[10px] text-muted-foreground w-24 shrink-0 pt-0.5">Connected to</span>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              {step.connectedTo.split(", ").map((tool) => (
                                                <span key={tool} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">{tool}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        <div className="pt-2 border-t border-border/30">
                                          <div className="flex gap-2">
                                            <Input value={customizePrompt} onChange={(e) => setCustomizePrompt(e.target.value)}
                                              placeholder="Tell Sammy how to change this step..."
                                              className="flex-1 h-7 text-[11px]"
                                              onClick={(e) => e.stopPropagation()}
                                              onKeyDown={(e) => { if (e.key === "Enter" && customizePrompt.trim()) { applyCustomization(wf.id, customizePrompt); } }} />
                                            <Button size="sm" className="h-7 text-[10px] gap-1" disabled={savingCustomize || !customizePrompt.trim()}
                                              onClick={(e) => { e.stopPropagation(); applyCustomization(wf.id, customizePrompt); }}>
                                              {savingCustomize ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <MessageSquare className="w-2.5 h-2.5" />} Apply
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Operating Rules */}
          <div>
            <div className="mb-5">
              <h3 className="font-display text-xl font-bold text-foreground">Operating Rules</h3>
              <p className="text-sm text-muted-foreground">Safety guardrails, timing rules, and how Sammy earns autonomy.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Guardrails - all editable, no separate "system" section */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-destructive" />
                    <h4 className="font-display font-semibold text-foreground text-sm">Guardrails</h4>
                  </div>
                  {editingRules ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingRules(false)} aria-label="Cancel" className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                      <button onClick={saveRules} disabled={saving} className="text-primary text-[10px] font-medium">{saving ? "..." : "Save"}</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingRules(true)} className="text-[10px] text-primary flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
                  )}
                </div>
                <div className="px-5 py-3 space-y-2 max-h-64 overflow-y-auto">
                  {editingRules ? (
                    <>
                      {escalationRules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Input value={rule} onChange={(e) => { const n = [...escalationRules]; n[i] = e.target.value; setEscalationRules(n); }} className="flex-1 h-7 text-xs" />
                          <button onClick={() => setEscalationRules(escalationRules.filter((_, j) => j !== i))} aria-label="Remove rule" className="text-destructive"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5">
                        <Input value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Add rule..." className="flex-1 h-7 text-xs"
                          onKeyDown={(e) => { if (e.key === "Enter" && newRule.trim()) { setEscalationRules([...escalationRules, newRule.trim()]); setNewRule(""); } }} />
                      </div>
                    </>
                  ) : (
                    <>
                      {escalationRules.map((rule, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                          <p className="text-xs text-foreground">{rule}</p>
                        </div>
                      ))}
                      {escalationRules.length === 0 && <p className="text-xs text-muted-foreground">No guardrails set. Click Edit to add rules.</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Timing - editable */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <h4 className="font-display font-semibold text-foreground text-sm">Timing Rules</h4>
                  </div>
                  {editingTiming ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingTiming(false)} aria-label="Cancel" className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingTiming(false)} className="text-primary text-[10px] font-medium">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingTiming(true)} className="text-[10px] text-primary flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
                  )}
                </div>
                <div className="px-5 py-3 space-y-2 max-h-64 overflow-y-auto">
                  {editingTiming ? (
                    <>
                      {timingRulesList.map((rule, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Input value={rule} onChange={(e) => { const n = [...timingRulesList]; n[i] = e.target.value; setTimingRulesList(n); }} className="flex-1 h-7 text-xs" />
                          <button onClick={() => setTimingRulesList(timingRulesList.filter((_, j) => j !== i))} aria-label="Remove timing rule" className="text-destructive"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5">
                        <Input value={newTimingRule} onChange={(e) => setNewTimingRule(e.target.value)} placeholder="Add rule..." className="flex-1 h-7 text-xs"
                          onKeyDown={(e) => { if (e.key === "Enter" && newTimingRule.trim()) { setTimingRulesList([...timingRulesList, newTimingRule.trim()]); setNewTimingRule(""); } }} />
                      </div>
                    </>
                  ) : (
                    timingRulesList.map((rule, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">{rule}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Autonomy */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <h4 className="font-display font-semibold text-foreground text-sm">Autonomy Ladder</h4>
                </div>
                <div className="px-5 py-3 space-y-3">
                  <p className="text-[10px] text-muted-foreground">Sammy starts in shadow mode. As you approve messages and Sammy learns your style, she earns the right to send on her own.</p>
                  {autonomySteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                        step.active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}>
                        {step.active ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      <div>
                        <p className={cn("text-xs", step.active ? "text-foreground font-medium" : "text-muted-foreground")}>{step.label}</p>
                        <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SEQUENCE TEMPLATES ─── */}
      {mainTab === "templates" && (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">Outreach sequence playbooks organized by business type. Each defines the touches, angles, channels, and timing that Sammy's Follow-Up workflow will execute.</p>

          {sequenceTemplates.map((biz) => (
            <div key={biz.type}>
              <div className="mb-4">
                <h3 className="font-display font-semibold text-foreground text-lg">{biz.type}</h3>
                <p className="text-xs text-muted-foreground">{biz.desc}</p>
              </div>

              <div className="space-y-3">
                {biz.templates.map((tmpl) => {
                  const tmplKey = `${biz.type}-${tmpl.name}`;
                  const isExpanded = expandedSeq === tmplKey;
                  const duration = tmpl.touches[tmpl.touches.length - 1]?.day_offset || 0;

                  return (
                    <motion.div key={tmpl.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

                      <button onClick={() => setExpandedSeq(isExpanded ? null : tmplKey)}
                        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{tmpl.touches.length}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-foreground">{tmpl.name}</h4>
                            {tmpl.channels.map((ch) => (
                              <span key={ch} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 font-medium">{ch}</span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{tmpl.desc}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-display font-bold text-foreground">{duration}d</p>
                            <p className="text-[10px] text-muted-foreground">duration</p>
                          </div>
                          <Button variant="outline" size="sm" className="text-xs gap-1.5"
                            disabled={activatingTemplate === tmpl.name}
                            onClick={(e) => { e.stopPropagation(); activateTemplate(tmpl); }}>
                            {activatingTemplate === tmpl.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Use
                          </Button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border overflow-hidden">
                            <div className="px-5 py-4">
                              {tmpl.touches.map((touch, i) => (
                                <div key={i} className="flex items-start gap-4 mb-4 last:mb-0">
                                  <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                                    </div>
                                    {i < tmpl.touches.length - 1 && <div className="w-0.5 h-8 bg-border mt-1" />}
                                  </div>
                                  <div className="flex-1 pt-0.5">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-sm text-foreground font-medium">{angleLabels[touch.angle] || touch.angle}</p>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{tierLabels[touch.channel_tier] || touch.channel_tier}</span>
                                      <span className="text-[10px] text-muted-foreground">{touch.day_offset === 0 ? "Immediately" : `Day ${touch.day_offset}`}</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground italic">{touch.hint}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowsView;
