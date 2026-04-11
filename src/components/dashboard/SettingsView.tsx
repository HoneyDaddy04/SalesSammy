import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Shield,
  CreditCard,
  Users,
  Globe,
  Palette,
  Webhook,
  Database,
  FileText,
  Key,
  Mail,
  MessageCircle,
  Phone,
  Briefcase,
  LogOut,
  ChevronRight,
  Check,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SettingsViewProps {
  onBack: () => void;
}

type SettingsSection =
  | "main"
  | "team"
  | "notifications"
  | "security"
  | "billing"
  | "integrations"
  | "branding"
  | "data"
  | "api";

// Persist settings to localStorage
const SETTINGS_KEY = "vaigence_settings";

function loadSettings(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveSetting(key: string, value: unknown) {
  const current = loadSettings();
  current[key] = value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
}

function getSetting<T>(key: string, fallback: T): T {
  const current = loadSettings();
  return (current[key] as T) ?? fallback;
}

const SettingsView = ({ onBack }: SettingsViewProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");

  const sections = [
    { id: "team" as const, icon: Users, label: "Team & Permissions", desc: "Manage who can view and control agents" },
    { id: "notifications" as const, icon: Bell, label: "Notifications", desc: "Configure alerts for agent activity and errors" },
    { id: "security" as const, icon: Shield, label: "Security & Compliance", desc: "Data access policies and encryption settings" },
    { id: "billing" as const, icon: CreditCard, label: "Billing & Usage", desc: "Plan details, invoices, and usage metrics" },
    { id: "integrations" as const, icon: Globe, label: "Integrations", desc: "Manage connected services and channels" },
    { id: "branding" as const, icon: Palette, label: "Brand & Voice", desc: "Customize your AI teammates' tone and appearance" },
    { id: "data" as const, icon: Database, label: "Data & Storage", desc: "Conversation logs, exports, and retention policies" },
    { id: "api" as const, icon: Webhook, label: "API & Webhooks", desc: "Developer tools, API keys, and webhook endpoints" },
  ];

  if (activeSection !== "main") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveSection("main")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Settings
        </button>
        {activeSection === "team" && <TeamSettings />}
        {activeSection === "notifications" && <NotificationSettings />}
        {activeSection === "security" && <SecuritySettings />}
        {activeSection === "billing" && <BillingSettings />}
        {activeSection === "integrations" && <IntegrationsSettings />}
        {activeSection === "branding" && <BrandingSettings />}
        {activeSection === "data" && <DataSettings />}
        {activeSection === "api" && <ApiSettings />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Overview
      </button>

      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your Vaigence platform</p>
      </div>

      <div className="space-y-3">
        {sections.map((section, i) => (
          <motion.button
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setActiveSection(section.id)}
            className="w-full rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <section.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">{section.label}</h3>
                <p className="text-sm text-muted-foreground">{section.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <button className="flex items-center gap-3 text-sm text-destructive hover:text-destructive/80 transition-colors">
          <LogOut className="w-4 h-4" /> Log out of Vaigence
        </button>
      </div>
    </div>
  );
};

/* ========= Shared components ========= */

const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
  <div className="mb-6">
    <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
  </div>
);

const SettingRow = ({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
    <div className="pr-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ settingKey, enabled = false }: { settingKey: string; enabled?: boolean }) => {
  const [on, setOn] = useState(() => getSetting(settingKey, enabled));
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        saveSetting(settingKey, next);
        toast({ description: `Setting ${next ? "enabled" : "disabled"}` });
      }}
      className="text-primary"
    >
      {on ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
    </button>
  );
};

const Badge = ({ text, variant = "default" }: { text: string; variant?: "default" | "success" | "warning" }) => (
  <span
    className={cn(
      "text-[10px] font-medium px-2 py-0.5 rounded-full",
      variant === "success" && "bg-success/10 text-success",
      variant === "warning" && "bg-warning/10 text-warning",
      variant === "default" && "bg-secondary text-secondary-foreground"
    )}
  >
    {text}
  </span>
);

const EditableText = ({ settingKey, fallback, desc }: { settingKey: string; fallback: string; desc?: string }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => getSetting(settingKey, fallback));
  const { toast } = useToast();

  const save = () => {
    saveSetting(settingKey, value);
    setEditing(false);
    toast({ description: "Saved" });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="h-8 w-48 text-sm"
          autoFocus
        />
        <Button variant="ghost" size="sm" onClick={save} className="h-8 px-2"><Check className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-8 px-2"><X className="w-3.5 h-3.5" /></Button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors">
      {value}
      <Pencil className="w-3 h-3 text-muted-foreground" />
    </button>
  );
};

const Dropdown = ({ settingKey, options, fallback }: { settingKey: string; options: string[]; fallback: string }) => {
  const [value, setValue] = useState(() => getSetting(settingKey, fallback));
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
      >
        {value} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setValue(opt);
                  saveSetting(settingKey, opt);
                  setOpen(false);
                  toast({ description: `Changed to ${opt}` });
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors",
                  value === opt && "text-primary font-medium"
                )}
              >
                {value === opt && <Check className="w-3 h-3 inline mr-1.5" />}
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* --- Team & Permissions --- */
const TeamSettings = () => (
  <div>
    <SectionHeader title="Team & Permissions" desc="Manage team members and their access levels" />
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Team Members</h3>
      {[
        { name: "Chidi Okafor", email: "chidi@company.com", role: "Owner", status: "Active" },
        { name: "Aisha Mohammed", email: "aisha@company.com", role: "Admin", status: "Active" },
        { name: "Tunde Bakare", email: "tunde@company.com", role: "Viewer", status: "Invited" },
      ].map((member) => (
        <div key={member.email} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
          <div>
            <p className="text-sm font-medium text-foreground">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge text={member.role} />
            <Badge text={member.status} variant={member.status === "Active" ? "success" : "warning"} />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="mt-4 gap-1.5">
        <Users className="w-3.5 h-3.5" /> Invite Member
      </Button>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">Role Permissions</h3>
      {[
        { role: "Owner", perms: "Full access - billing, agents, settings, team management" },
        { role: "Admin", perms: "Manage agents, view analytics, configure integrations" },
        { role: "Editor", perms: "Edit agent configurations, view conversations and analytics" },
        { role: "Viewer", perms: "View-only access to dashboard and analytics" },
      ].map((r) => (
        <div key={r.role} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
          <Badge text={r.role} />
          <p className="text-xs text-muted-foreground">{r.perms}</p>
        </div>
      ))}
    </div>
  </div>
);

/* --- Notifications --- */
const NotificationSettings = () => (
  <div>
    <SectionHeader title="Notifications" desc="Configure how you receive alerts from your AI teammates" />
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Email Notifications</h3>
      <SettingRow label="Daily summary report" desc="Receive a daily digest of all agent activity"><Toggle settingKey="notif_daily" enabled /></SettingRow>
      <SettingRow label="Weekly performance report" desc="Weekly metrics across all teammates"><Toggle settingKey="notif_weekly" enabled /></SettingRow>
      <SettingRow label="Agent errors & failures" desc="Immediate alert when an automation fails"><Toggle settingKey="notif_errors" enabled /></SettingRow>
      <SettingRow label="New conversation alerts" desc="Notify on first conversation from new leads"><Toggle settingKey="notif_new_convo" /></SettingRow>
      <SettingRow label="SLA breach warnings" desc="Alert when support tickets approach SLA limits"><Toggle settingKey="notif_sla" enabled /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Slack Notifications</h3>
      <SettingRow label="Connected workspace" desc="vaigence-team.slack.com"><Badge text="Connected" variant="success" /></SettingRow>
      <SettingRow label="Sales alerts channel" desc="#sales-alerts"><Toggle settingKey="slack_sales" enabled /></SettingRow>
      <SettingRow label="Support escalations" desc="#support-escalations"><Toggle settingKey="slack_support" enabled /></SettingRow>
      <SettingRow label="Churn risk alerts" desc="#success-alerts"><Toggle settingKey="slack_churn" enabled /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-2">SMS Notifications</h3>
      <SettingRow label="Critical errors only" desc="SMS for system-down or critical failures"><Toggle settingKey="sms_critical" /></SettingRow>
      <SettingRow label="Phone number" desc="+234 812 xxx xxxx"><EditableText settingKey="sms_phone" fallback="+234 812 xxx xxxx" /></SettingRow>
    </div>
  </div>
);

/* --- Security --- */
const SecuritySettings = () => (
  <div>
    <SectionHeader title="Security & Compliance" desc="Protect your data and manage access policies" />
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Authentication</h3>
      <SettingRow label="Two-factor authentication (2FA)" desc="Add an extra layer of security to your account"><Toggle settingKey="sec_2fa" /></SettingRow>
      <SettingRow label="Single Sign-On (SSO)" desc="Configure SAML or OAuth SSO for your team"><Button variant="outline" size="sm">Configure</Button></SettingRow>
      <SettingRow label="Session timeout" desc="Auto-logout after inactivity"><Dropdown settingKey="sec_timeout" options={["15 minutes", "30 minutes", "1 hour", "4 hours"]} fallback="30 minutes" /></SettingRow>
      <SettingRow label="Login history" desc="View recent sign-ins and devices"><Button variant="outline" size="sm">View Logs</Button></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Data Protection</h3>
      <SettingRow label="Data encryption" desc="All data encrypted at rest and in transit"><Badge text="AES-256" variant="success" /></SettingRow>
      <SettingRow label="Data residency" desc="Where your data is stored"><Dropdown settingKey="sec_residency" options={["EU (Frankfurt)", "US (Virginia)", "AF (Lagos)"]} fallback="EU (Frankfurt)" /></SettingRow>
      <SettingRow label="PII redaction" desc="Auto-redact personal info from conversation logs"><Toggle settingKey="sec_pii" enabled /></SettingRow>
      <SettingRow label="Data retention period" desc="How long conversation data is kept"><Dropdown settingKey="sec_retention" options={["30 days", "60 days", "90 days", "1 year"]} fallback="90 days" /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-2">Audit & Compliance</h3>
      <SettingRow label="Audit logs" desc="Track all actions taken by team members and agents"><Button variant="outline" size="sm">View Audit Log</Button></SettingRow>
      <SettingRow label="GDPR compliance" desc="Data subject access and deletion requests"><Badge text="Compliant" variant="success" /></SettingRow>
      <SettingRow label="Export compliance report" desc="Download compliance documentation"><Button variant="outline" size="sm">Export</Button></SettingRow>
    </div>
  </div>
);

/* --- Billing --- */
const BillingSettings = () => (
  <div>
    <SectionHeader title="Billing & Usage" desc="Manage your subscription, view invoices, and track usage" />

    <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Scale Plan</h3>
          <p className="text-sm text-muted-foreground">3 AI teammates - 2,000 conversations/month</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-foreground">₦200,000</p>
          <p className="text-xs text-muted-foreground">/month</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="text-lg font-display font-bold text-foreground">3/3</p>
          <p className="text-[10px] text-muted-foreground">Teammates</p>
        </div>
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="text-lg font-display font-bold text-foreground">1,247</p>
          <p className="text-[10px] text-muted-foreground">Conversations used</p>
        </div>
        <div className="rounded-lg bg-background p-3 text-center">
          <p className="text-lg font-display font-bold text-foreground">753</p>
          <p className="text-[10px] text-muted-foreground">Remaining</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden mb-2">
        <div className="h-full rounded-full bg-primary" style={{ width: "62%" }} />
      </div>
      <p className="text-xs text-muted-foreground">62% of monthly conversations used - Resets Apr 30, 2026</p>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Extra Conversation Charges</h3>
      <SettingRow label="Rate per extra conversation" desc="Charged when you exceed your plan's included conversations"><span className="text-sm font-medium text-foreground">₦250</span></SettingRow>
      <SettingRow label="Extra conversations this month" desc="Beyond included 2,000"><span className="text-sm font-medium text-foreground">0</span></SettingRow>
      <SettingRow label="Auto-purchase limit" desc="Max extra conversations before pausing"><Dropdown settingKey="billing_auto_limit" options={["100 conversations", "250 conversations", "500 conversations", "Unlimited"]} fallback="500 conversations" /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Payment Method</h3>
      <SettingRow label="Card on file" desc="Visa ending in 4242"><Button variant="outline" size="sm">Update</Button></SettingRow>
      <SettingRow label="Billing email"><EditableText settingKey="billing_email" fallback="billing@company.com" /></SettingRow>
      <SettingRow label="Currency" desc="Nigerian Naira (NGN)"><Badge text="₦ NGN" /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">Recent Invoices</h3>
      {[
        { date: "Mar 2026", amount: "₦200,000", status: "Paid" },
        { date: "Feb 2026", amount: "₦212,500", status: "Paid" },
        { date: "Jan 2026", amount: "₦200,000", status: "Paid" },
      ].map((inv) => (
        <div key={inv.date} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{inv.date}</p>
              <p className="text-xs text-muted-foreground">{inv.amount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge text={inv.status} variant="success" />
            <Button variant="ghost" size="sm" className="text-xs gap-1"><ExternalLink className="w-3 h-3" /> PDF</Button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* --- Integrations --- */
const IntegrationsSettings = () => {
  const initialIntegrations = [
    { category: "Messaging Channels", items: [
      { name: "WhatsApp Business", defaultStatus: "connected", icon: MessageCircle, color: "text-green-600" },
      { name: "Telegram", defaultStatus: "connected", icon: MessageCircle, color: "text-blue-500" },
      { name: "Slack", defaultStatus: "connected", icon: Briefcase, color: "text-purple-500" },
      { name: "Facebook Messenger", defaultStatus: "disconnected", icon: MessageCircle, color: "text-blue-600" },
      { name: "SMS (Twilio)", defaultStatus: "connected", icon: Phone, color: "text-emerald-600" },
      { name: "Email (SMTP)", defaultStatus: "connected", icon: Mail, color: "text-orange-500" },
      { name: "Website Chat Widget", defaultStatus: "connected", icon: Globe, color: "text-primary" },
    ]},
    { category: "Google Workspace", items: [
      { name: "Google Calendar", defaultStatus: "connected", icon: Globe, color: "text-blue-600" },
      { name: "Google Sheets", defaultStatus: "connected", icon: Globe, color: "text-green-600" },
      { name: "Google Drive", defaultStatus: "connected", icon: Globe, color: "text-yellow-600" },
      { name: "Google Docs", defaultStatus: "disconnected", icon: Globe, color: "text-blue-500" },
      { name: "Google Meet", defaultStatus: "disconnected", icon: Globe, color: "text-green-500" },
      { name: "Gmail", defaultStatus: "connected", icon: Mail, color: "text-red-500" },
    ]},
    { category: "CRM & Sales", items: [
      { name: "HubSpot CRM", defaultStatus: "connected", icon: Globe, color: "text-orange-500" },
      { name: "Salesforce", defaultStatus: "disconnected", icon: Globe, color: "text-blue-500" },
      { name: "Pipedrive", defaultStatus: "disconnected", icon: Globe, color: "text-green-600" },
      { name: "Apollo.io", defaultStatus: "connected", icon: Globe, color: "text-purple-500" },
      { name: "LinkedIn Sales Navigator", defaultStatus: "connected", icon: Globe, color: "text-blue-700" },
    ]},
    { category: "Support & Helpdesk", items: [
      { name: "Zendesk", defaultStatus: "connected", icon: Globe, color: "text-green-600" },
      { name: "Intercom", defaultStatus: "connected", icon: Globe, color: "text-blue-500" },
      { name: "Freshdesk", defaultStatus: "connected", icon: Globe, color: "text-green-500" },
    ]},
    { category: "Analytics & Data", items: [
      { name: "Mixpanel", defaultStatus: "connected", icon: Globe, color: "text-purple-600" },
      { name: "Stripe Billing", defaultStatus: "connected", icon: Globe, color: "text-purple-500" },
      { name: "Google Analytics", defaultStatus: "disconnected", icon: Globe, color: "text-orange-500" },
    ]},
    { category: "Automation & Workflow", items: [
      { name: "n8n", defaultStatus: "connected", icon: Webhook, color: "text-orange-600" },
      { name: "Make (Integromat)", defaultStatus: "connected", icon: Webhook, color: "text-purple-600" },
      { name: "Zapier", defaultStatus: "disconnected", icon: Webhook, color: "text-orange-500" },
      { name: "Calendly", defaultStatus: "connected", icon: Globe, color: "text-blue-500" },
    ]},
    { category: "Knowledge & Docs", items: [
      { name: "Notion", defaultStatus: "connected", icon: Globe, color: "text-foreground" },
      { name: "Typeform", defaultStatus: "connected", icon: Globe, color: "text-purple-500" },
    ]},
  ];

  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const saved = getSetting<Record<string, string>>("integration_statuses", {});
    const defaults: Record<string, string> = {};
    initialIntegrations.forEach((g) =>
      g.items.forEach((item) => {
        defaults[item.name] = saved[item.name] ?? item.defaultStatus;
      })
    );
    return defaults;
  });

  const { toast } = useToast();

  const toggleConnection = useCallback((name: string) => {
    setStatuses((prev) => {
      const current = prev[name];
      const next = current === "connected" ? "disconnected" : "connected";
      const updated = { ...prev, [name]: next };
      saveSetting("integration_statuses", updated);
      toast({ description: `${name} ${next === "connected" ? "connected" : "disconnected"}` });
      return updated;
    });
  }, [toast]);

  return (
    <div>
      <SectionHeader title="Integrations" desc="Connect your tools and channels to power your AI teammates" />
      <div className="space-y-4">
        {initialIntegrations.map((group) => (
          <div key={group.category} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">{group.category}</h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const status = statuses[item.name] || item.defaultStatus;
                return (
                  <div key={item.name} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4", item.color)} />
                      <p className="text-sm text-foreground">{item.name}</p>
                    </div>
                    <div>
                      {status === "connected" ? (
                        <button onClick={() => toggleConnection(item.name)} className="flex items-center gap-1">
                          <Badge text="Connected" variant="success" />
                        </button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toggleConnection(item.name)}>Connect</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* --- Branding --- */
const BrandingSettings = () => (
  <div>
    <SectionHeader title="Brand & Voice" desc="Customize how your AI teammates communicate" />
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Communication Tone</h3>
      <SettingRow label="Default tone" desc="Applied to all teammates unless overridden"><Dropdown settingKey="brand_default_tone" options={["Professional", "Friendly", "Casual"]} fallback="Professional" /></SettingRow>
      <SettingRow label="Kofi (Sales) tone" desc="Sales-specific communication style"><Dropdown settingKey="brand_sales_tone" options={["Professional", "Friendly", "Casual"]} fallback="Professional" /></SettingRow>
      <SettingRow label="Amara (Support) tone" desc="Support-specific communication style"><Dropdown settingKey="brand_support_tone" options={["Professional", "Friendly", "Casual"]} fallback="Friendly" /></SettingRow>
      <SettingRow label="Zuri (Success) tone" desc="Success-specific communication style"><Dropdown settingKey="brand_success_tone" options={["Professional", "Friendly", "Casual"]} fallback="Professional" /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Brand Identity</h3>
      <SettingRow label="Company name" desc="Used in agent signatures and communications"><EditableText settingKey="brand_company" fallback="Vaigence Demo Co." /></SettingRow>
      <SettingRow label="Logo" desc="Displayed in chat widgets and emails"><Button variant="outline" size="sm">Upload</Button></SettingRow>
      <SettingRow label="Brand colors" desc="Primary color for chat widgets"><div className="w-6 h-6 rounded-full bg-primary border border-border" /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-2">Response Settings</h3>
      <SettingRow label="Auto-greet visitors" desc="Send a welcome message when visitors arrive"><Toggle settingKey="brand_autogreet" enabled /></SettingRow>
      <SettingRow label="Include agent name" desc="Show AI teammate name in responses"><Toggle settingKey="brand_agentname" enabled /></SettingRow>
      <SettingRow label="Signature line" desc="Appended to email responses"><Toggle settingKey="brand_signature" /></SettingRow>
      <SettingRow label="Language" desc="Primary language for responses"><Dropdown settingKey="brand_language" options={["English", "French", "Pidgin English", "Yoruba", "Hausa", "Igbo"]} fallback="English" /></SettingRow>
      <SettingRow label="Fallback language" desc="When customer's language isn't detected"><Dropdown settingKey="brand_fallback_lang" options={["English", "French", "Pidgin English"]} fallback="English" /></SettingRow>
    </div>
  </div>
);

/* --- Data & Storage --- */
const DataSettings = () => (
  <div>
    <SectionHeader title="Data & Storage" desc="Manage conversation logs, exports, and data retention" />
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Conversation Data</h3>
      <SettingRow label="Total conversations stored" desc="Across all teammates"><span className="text-sm font-medium text-foreground">40,494</span></SettingRow>
      <SettingRow label="Storage used" desc="Conversation logs and attachments"><span className="text-sm font-medium text-foreground">2.3 GB</span></SettingRow>
      <SettingRow label="Data retention" desc="Auto-delete after this period"><Dropdown settingKey="data_retention" options={["30 days", "60 days", "90 days", "6 months", "1 year"]} fallback="90 days" /></SettingRow>
      <SettingRow label="Auto-archive" desc="Archive conversations older than 30 days"><Toggle settingKey="data_autoarchive" enabled /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-2">Exports</h3>
      <SettingRow label="Export all conversations" desc="Download as CSV or JSON"><Button variant="outline" size="sm">Export</Button></SettingRow>
      <SettingRow label="Export analytics" desc="Download performance metrics"><Button variant="outline" size="sm">Export</Button></SettingRow>
      <SettingRow label="Scheduled exports" desc="Auto-export weekly reports to email"><Toggle settingKey="data_scheduled_export" /></SettingRow>
    </div>
  </div>
);

/* --- API & Webhooks --- */
const ApiSettings = () => (
  <div>
    <SectionHeader title="API & Webhooks" desc="Developer tools for integrating with Vaigence" />
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">API Keys</h3>
      {[
        { name: "Production", key: "vgn_live_****...k9f2", created: "Jan 15, 2026" },
        { name: "Staging", key: "vgn_test_****...m3x1", created: "Feb 8, 2026" },
      ].map((k) => (
        <div key={k.name} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{k.name}</p>
            </div>
            <p className="text-xs text-muted-foreground font-mono ml-6">{k.key}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{k.created}</p>
            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">Revoke</Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="mt-3 gap-1.5">
        <Key className="w-3.5 h-3.5" /> Generate New Key
      </Button>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Webhooks</h3>
      <SettingRow label="New conversation" desc="POST when a new conversation starts"><Toggle settingKey="webhook_new_convo" enabled /></SettingRow>
      <SettingRow label="Conversation resolved" desc="POST when a conversation is closed"><Toggle settingKey="webhook_resolved" enabled /></SettingRow>
      <SettingRow label="Lead qualified" desc="POST when Kofi qualifies a new lead"><Toggle settingKey="webhook_lead" /></SettingRow>
      <SettingRow label="Churn alert" desc="POST when Zuri detects churn risk"><Toggle settingKey="webhook_churn" /></SettingRow>
      <SettingRow label="Webhook URL"><EditableText settingKey="webhook_url" fallback="https://your-api.com/webhooks/vaigence" /></SettingRow>
    </div>

    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-2">API Documentation</h3>
      <p className="text-sm text-muted-foreground mb-3">Access the full Vaigence API reference to build custom integrations.</p>
      <Button variant="outline" size="sm" className="gap-1.5">
        <ExternalLink className="w-3.5 h-3.5" /> View API Docs
      </Button>
    </div>
  </div>
);

export default SettingsView;
