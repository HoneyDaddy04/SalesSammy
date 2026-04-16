import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Link2, Unlink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  GmailIcon, OutlookIcon, WhatsAppIcon, InstagramIcon, LinkedInIcon,
  TwilioIcon, TelegramIcon, CsvIcon, GoogleSheetsIcon, HubSpotIcon,
  SalesforceIcon, PipedriveIcon, AirtableIcon, ShopifyIcon,
  IntercomIcon, GoogleCalendarIcon, CalendlyIcon, CalComIcon,
} from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { API_BASE, ORG_KEY } from "@/lib/constants";

interface DbIntegration {
  id: string; type: string; category: string; status: string; last_synced_at: string | null;
}

interface IntegrationDef {
  type: string;
  name: string;
  desc: string;
  category: "channel" | "lead_source" | "context" | "calendar";
  color: string;       // bg color class
  textColor: string;   // text color class
  initials: string;    // 1-2 letter brand abbreviation shown in colored circle
  icon?: React.FC<{ className?: string }>;
  available: boolean;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

// Full catalog of all integrations, with brand colors
const ALL_INTEGRATIONS: IntegrationDef[] = [
  // Channels
  { type: "gmail", name: "Gmail", desc: "Send follow-up emails from your Gmail account", category: "channel", color: "bg-red-500/10", textColor: "text-red-600", initials: "G", icon: GmailIcon, available: true,
    fields: [{ key: "email", label: "Gmail address", placeholder: "you@gmail.com" }, { key: "app_password", label: "App password", placeholder: "xxxx xxxx xxxx xxxx", type: "password" }] },
  { type: "outlook", name: "Outlook", desc: "Send emails via Microsoft Outlook", category: "channel", color: "bg-blue-600/10", textColor: "text-blue-600", initials: "O", icon: OutlookIcon, available: true,
    fields: [{ key: "email", label: "Email", placeholder: "you@outlook.com" }, { key: "app_password", label: "App password", placeholder: "xxxx xxxx xxxx xxxx", type: "password" }] },
  { type: "whatsapp", name: "WhatsApp Business", desc: "Follow up with leads via WhatsApp", category: "channel", color: "bg-green-500/10", textColor: "text-green-600", initials: "W", icon: WhatsAppIcon, available: true,
    fields: [{ key: "phone", label: "Business phone", placeholder: "+234 xxx xxx xxxx" }, { key: "api_key", label: "API key", placeholder: "Your WhatsApp Business API key", type: "password" }] },
  { type: "instagram", name: "Instagram DMs", desc: "Send DMs to leads on Instagram", category: "channel", color: "bg-pink-500/10", textColor: "text-pink-600", initials: "IG", icon: InstagramIcon, available: false, fields: [] },
  { type: "linkedin", name: "LinkedIn DM", desc: "Reach out to prospects on LinkedIn", category: "channel", color: "bg-blue-700/10", textColor: "text-blue-700", initials: "in", icon: LinkedInIcon, available: false, fields: [] },
  { type: "sms", name: "SMS (Twilio)", desc: "Send text messages to leads", category: "channel", color: "bg-red-400/10", textColor: "text-red-500", initials: "T", icon: TwilioIcon, available: false, fields: [] },
  { type: "telegram", name: "Telegram", desc: "Message leads on Telegram", category: "channel", color: "bg-sky-500/10", textColor: "text-sky-600", initials: "TG", icon: TelegramIcon, available: false, fields: [] },

  // Lead Sources
  { type: "csv", name: "CSV Upload", desc: "Upload a spreadsheet of contacts", category: "lead_source", color: "bg-emerald-500/10", textColor: "text-emerald-600", initials: "CSV", icon: CsvIcon, available: true, fields: [] },
  { type: "google_sheets", name: "Google Sheets", desc: "Sync leads from a live Google Sheet", category: "lead_source", color: "bg-green-600/10", textColor: "text-green-700", initials: "GS", icon: GoogleSheetsIcon, available: true,
    fields: [{ key: "sheet_url", label: "Sheet URL", placeholder: "https://docs.google.com/spreadsheets/d/..." }] },
  { type: "hubspot", name: "HubSpot", desc: "Sync contacts from your HubSpot CRM", category: "lead_source", color: "bg-orange-500/10", textColor: "text-orange-600", initials: "HS", icon: HubSpotIcon, available: true,
    fields: [{ key: "api_key", label: "Private app token", placeholder: "pat-xxx...", type: "password" }] },
  { type: "salesforce", name: "Salesforce", desc: "Pull leads from Salesforce CRM", category: "lead_source", color: "bg-blue-500/10", textColor: "text-blue-500", initials: "SF", icon: SalesforceIcon, available: false, fields: [] },
  { type: "pipedrive", name: "Pipedrive", desc: "Sync deals and contacts from Pipedrive", category: "lead_source", color: "bg-gray-800/10", textColor: "text-gray-700", initials: "PD", icon: PipedriveIcon, available: false, fields: [] },
  { type: "airtable", name: "Airtable", desc: "Import leads from an Airtable base", category: "lead_source", color: "bg-yellow-400/10", textColor: "text-yellow-600", initials: "AT", icon: AirtableIcon, available: false, fields: [] },
  { type: "shopify", name: "Shopify", desc: "Sync customers and abandoned carts", category: "lead_source", color: "bg-green-500/10", textColor: "text-green-500", initials: "SH", icon: ShopifyIcon, available: false, fields: [] },

  // Context
  { type: "gmail_read", name: "Gmail (Read)", desc: "Pull prior email threads for context before drafting", category: "context", color: "bg-red-500/10", textColor: "text-red-600", initials: "G", icon: GmailIcon, available: true,
    fields: [{ key: "email", label: "Gmail address", placeholder: "you@gmail.com" }] },
  { type: "hubspot_notes", name: "HubSpot Notes", desc: "Pull CRM notes and activity per contact", category: "context", color: "bg-orange-500/10", textColor: "text-orange-600", initials: "HS", icon: HubSpotIcon, available: false, fields: [] },
  { type: "intercom", name: "Intercom", desc: "Read past support conversations for context", category: "context", color: "bg-blue-500/10", textColor: "text-blue-600", initials: "IC", icon: IntercomIcon, available: false, fields: [] },

  // Calendar
  { type: "google_calendar", name: "Google Calendar", desc: "Auto-create meeting events and booking links", category: "calendar", color: "bg-blue-500/10", textColor: "text-blue-600", initials: "GC", icon: GoogleCalendarIcon, available: true,
    fields: [{ key: "calendar_id", label: "Calendar ID", placeholder: "primary" }] },
  { type: "calendly", name: "Calendly", desc: "Include your Calendly link in follow-ups", category: "calendar", color: "bg-blue-400/10", textColor: "text-blue-500", initials: "CL", icon: CalendlyIcon, available: true,
    fields: [{ key: "link", label: "Calendly link", placeholder: "https://calendly.com/you" }] },
  { type: "cal_com", name: "Cal.com", desc: "Open-source scheduling for meeting links", category: "calendar", color: "bg-gray-700/10", textColor: "text-gray-600", initials: "CC", icon: CalComIcon, available: false, fields: [] },
];

const categoryConfig = [
  { key: "channel" as const, title: "Channels", desc: "Where Sammy sends messages" },
  { key: "lead_source" as const, title: "Lead Sources", desc: "Where your contacts come from" },
  { key: "context" as const, title: "Context Sources", desc: "Prior conversations and notes to inform drafts" },
  { key: "calendar" as const, title: "Calendar & Booking", desc: "Meeting scheduling and booking links" },
];

const IntegrationsView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [dbIntegrations, setDbIntegrations] = useState<DbIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingType, setConnectingType] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadIntegrations = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/integrations?org_id=${orgId}`);
      const data = await res.json();
      setDbIntegrations(Array.isArray(data) ? data : []);
    } catch (err) { /* API unreachable — show empty state */ } finally { setLoading(false); }
  };

  useEffect(() => { loadIntegrations(); }, [orgId]);

  // Escape key to close connecting form
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && connectingType) {
        setConnectingType(null);
        setCredentials({});
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [connectingType]);

  const getDbStatus = (type: string): DbIntegration | undefined => dbIntegrations.find(i => i.type === type);

  const handleConnect = async (type: string, category: string) => {
    setActionLoading(type);
    try {
      await fetch(`${API_BASE}/api/integrations/connect`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, type, category, credentials }),
      });
      setConnectingType(null); setCredentials({});
      await loadIntegrations();
      toast.success("Integration connected");
    } catch (err) { toast.error("Failed to connect integration"); } finally { setActionLoading(null); }
  };

  const handleDisconnect = async (type: string) => {
    setActionLoading(type);
    try {
      await fetch(`${API_BASE}/api/integrations/disconnect`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, type }),
      });
      await loadIntegrations();
      toast.success("Integration disconnected");
    } catch (err) { toast.error("Failed to disconnect integration"); } finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-2"><div className="h-7 w-40 rounded bg-muted" /><div className="h-4 w-64 rounded bg-muted" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse space-y-3">
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-4 w-24 rounded bg-muted" /><div className="h-3 w-40 rounded bg-muted" /></div></div>
            <div className="h-9 w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );

  const connectedCount = dbIntegrations.filter(i => i.status === "connected").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">{connectedCount} connected. Connect more tools to make Sammy more effective.</p>
      </div>

      {categoryConfig.map((cat) => {
        const items = ALL_INTEGRATIONS.filter(i => i.category === cat.key);

        return (
          <div key={cat.key}>
            <div className="mb-4">
              <h3 className="font-display font-semibold text-foreground text-lg">{cat.title}</h3>
              <p className="text-xs text-muted-foreground">{cat.desc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((def, idx) => {
                const db = getDbStatus(def.type);
                const isConnected = db?.status === "connected";
                const isConnecting = connectingType === def.type;
                const isLoading = actionLoading === def.type;

                return (
                  <motion.div key={def.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className={cn(
                      "rounded-xl border bg-card p-5 shadow-sm transition-all",
                      isConnected ? "border-success/30 bg-success/[0.02]" : !def.available ? "border-border opacity-60" : "border-border hover:border-primary/20 hover:shadow-md"
                    )}>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", def.color)}>
                          {def.icon ? <def.icon className="w-6 h-6" /> : <span className={cn("font-bold text-sm", def.textColor)}>{def.initials}</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{def.name}</p>
                            {!def.available && <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">Coming soon</span>}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{def.desc}</p>
                        </div>
                      </div>
                      {isConnected && <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-1" />}
                    </div>

                    {/* Sync info */}
                    {isConnected && db?.last_synced_at && (
                      <p className="text-[9px] text-success/70 mb-3">Connected. Last synced {new Date(db.last_synced_at).toLocaleDateString()}</p>
                    )}

                    {/* Connect form */}
                    {isConnecting && def.fields.length > 0 && (
                      <div className="space-y-3 mb-3 pt-3 border-t border-border">
                        {def.fields.map((field) => (
                          <div key={field.key}>
                            <Label className="text-[10px]">{field.label}</Label>
                            <Input type={field.type || "text"} placeholder={field.placeholder}
                              value={credentials[field.key] || ""}
                              onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="mt-1 h-9 text-sm" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {def.available && (
                      <div className="flex items-center gap-2 mt-3">
                        {isConnected ? (
                          <Button variant="outline" size="sm" onClick={() => handleDisconnect(def.type)} disabled={isLoading} className="gap-1.5 text-xs w-full">
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />} Disconnect
                          </Button>
                        ) : isConnecting ? (
                          <>
                            <Button size="sm" onClick={() => handleConnect(def.type, def.category)} disabled={isLoading} className="gap-1.5 text-xs flex-1">
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />} Connect
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setConnectingType(null); setCredentials({}); }} className="text-xs">Cancel</Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => { setConnectingType(def.type); setCredentials({}); }} className="gap-1.5 text-xs w-full">
                            <Link2 className="w-3 h-3" /> Connect
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IntegrationsView;
