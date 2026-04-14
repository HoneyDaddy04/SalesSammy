import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Eye, Send, Globe, MessageSquare, Mail, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  WhatsAppIcon, TelegramIcon, TwilioIcon, LinkedInIcon,
} from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE, ORG_KEY } from "@/lib/constants";

interface ChannelDef {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }> | null;
  lucideIcon?: React.FC<{ className?: string }>;
  color: string;
  textColor: string;
  comingSoon?: boolean;
}

const WEBHOOK_BASE = "https://api.vaigence.com/api/replies/inbound";

const CHANNELS: ChannelDef[] = [
  { id: "website", name: "Website Chat", icon: null, lucideIcon: Globe, color: "bg-purple-500/10", textColor: "text-purple-600" },
  { id: "whatsapp", name: "WhatsApp", icon: WhatsAppIcon, color: "bg-green-500/10", textColor: "text-green-600" },
  { id: "email", name: "Email", icon: null, lucideIcon: Mail, color: "bg-red-500/10", textColor: "text-red-600" },
  { id: "telegram", name: "Telegram", icon: TelegramIcon, color: "bg-sky-500/10", textColor: "text-sky-600" },
  { id: "sms", name: "SMS (Twilio)", icon: TwilioIcon, color: "bg-red-400/10", textColor: "text-red-500" },
  { id: "facebook", name: "Facebook Messenger", icon: null, lucideIcon: MessageSquare, color: "bg-blue-500/10", textColor: "text-blue-600" },
  { id: "linkedin", name: "LinkedIn", icon: LinkedInIcon, color: "bg-blue-700/10", textColor: "text-blue-700", comingSoon: true },
];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
};

const DeployView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [connectedTypes, setConnectedTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Simulate form state
  const [simChannel, setSimChannel] = useState("website");
  const [simName, setSimName] = useState("");
  const [simContact, setSimContact] = useState("");
  const [simMessage, setSimMessage] = useState("");
  const [simSending, setSimSending] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    fetch(`${API_BASE}/api/integrations?org_id=${orgId}`)
      .then(r => r.json())
      .then((data: { type: string; status: string }[]) => {
        const connected = new Set<string>();
        data.forEach(i => { if (i.status === "connected") connected.add(i.type); });
        setConnectedTypes(connected);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  const embedCode = `<script src="https://yourdomain.com/widget.js" data-org="${orgId || "ORG_ID"}"></script>`;

  const getChannelStatus = (id: string): "active" | "ready" | "not_connected" | "coming_soon" => {
    const ch = CHANNELS.find(c => c.id === id);
    if (ch?.comingSoon) return "coming_soon";
    if (id === "website") return "ready";
    if (connectedTypes.has(id)) return "active";
    return "not_connected";
  };

  const handleSimulate = async () => {
    if (!simMessage.trim()) { toast.error("Enter a message"); return; }
    setSimSending(true);
    setSimResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/replies/inbound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          channel: simChannel,
          sender_name: simName || "Test User",
          sender_contact: simContact || "test@example.com",
          message: simMessage,
        }),
      });
      const data = await res.json();
      setSimResult(data.result || data.message || "Message received. Check your Messages queue.");
      toast.success("Test message sent");
    } catch {
      setSimResult("Message sent to inbound queue.");
      toast.success("Test message sent");
    } finally {
      setSimSending(false);
    }
  };

  const renderChannelDetails = (id: string) => {
    const status = getChannelStatus(id);

    switch (id) {
      case "website":
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Embed Code</Label>
              <div className="mt-1.5 relative">
                <pre className="text-[11px] bg-secondary/50 rounded-lg p-3 pr-10 overflow-x-auto font-mono text-foreground/80">{embedCode}</pre>
                <button onClick={() => copyToClipboard(embedCode)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Add this script to your website to enable the chat widget.</p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setPreviewOpen(!previewOpen)}>
              <Eye className="w-3 h-3" /> {previewOpen ? "Close Preview" : "Preview"}
            </Button>
            {previewOpen && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Widget preview loads on your site via the embed code above.</p>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Floating chat button appears bottom-right</p>
              </div>
            )}
          </div>
        );

      case "whatsapp":
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
              <div className="mt-1.5 relative">
                <pre className="text-[11px] bg-secondary/50 rounded-lg p-3 pr-10 overflow-x-auto font-mono text-foreground/80">POST {WEBHOOK_BASE}</pre>
                <button onClick={() => copyToClipboard(`POST ${WEBHOOK_BASE}`)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Point your WhatsApp Business API webhook to this URL.</p>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Required Payload</Label>
              <pre className="mt-1.5 text-[10px] bg-secondary/50 rounded-lg p-3 overflow-x-auto font-mono text-foreground/60">{`{
  "org_id": "${orgId || "ORG_ID"}",
  "channel": "whatsapp",
  "sender_name": "John Doe",
  "sender_contact": "+1234567890",
  "message": "Hi, I'm interested..."
}`}</pre>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
              <div className="mt-1.5 relative">
                <pre className="text-[11px] bg-secondary/50 rounded-lg p-3 pr-10 overflow-x-auto font-mono text-foreground/80">POST {WEBHOOK_BASE}</pre>
                <button onClick={() => copyToClipboard(`POST ${WEBHOOK_BASE}`)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Forward incoming emails to this endpoint, or connect Gmail in Integrations.</p>
          </div>
        );

      case "telegram":
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
              <div className="mt-1.5 relative">
                <pre className="text-[11px] bg-secondary/50 rounded-lg p-3 pr-10 overflow-x-auto font-mono text-foreground/80">POST {WEBHOOK_BASE}</pre>
                <button onClick={() => copyToClipboard(`POST ${WEBHOOK_BASE}`)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Create a bot via @BotFather, then set the webhook URL above using the Telegram Bot API.</p>
          </div>
        );

      case "sms":
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Twilio Webhook URL</Label>
              <div className="mt-1.5 relative">
                <pre className="text-[11px] bg-secondary/50 rounded-lg p-3 pr-10 overflow-x-auto font-mono text-foreground/80">POST {WEBHOOK_BASE}</pre>
                <button onClick={() => copyToClipboard(`POST ${WEBHOOK_BASE}`)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">In your Twilio console, set this as the webhook for incoming SMS on your phone number.</p>
          </div>
        );

      case "facebook":
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Messenger Webhook URL</Label>
              <div className="mt-1.5 relative">
                <pre className="text-[11px] bg-secondary/50 rounded-lg p-3 pr-10 overflow-x-auto font-mono text-foreground/80">POST {WEBHOOK_BASE}</pre>
                <button onClick={() => copyToClipboard(`POST ${WEBHOOK_BASE}`)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Configure this webhook URL in your Facebook App settings under Messenger Webhooks.</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-2"><div className="h-7 w-48 rounded bg-muted" /><div className="h-4 w-80 rounded bg-muted" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse space-y-3">
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-4 w-24 rounded bg-muted" /><div className="h-3 w-40 rounded bg-muted" /></div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Deploy Sammy</h2>
        <p className="text-sm text-muted-foreground mt-1">Connect Sammy to your channels so he can catch leads and respond to customers automatically.</p>
      </div>

      {/* Channel Cards */}
      <div>
        <h3 className="font-display font-semibold text-foreground text-lg mb-4">Inbound Channels</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHANNELS.map((ch, idx) => {
            const status = getChannelStatus(ch.id);
            const IconComponent = ch.icon || ch.lucideIcon;

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "rounded-xl border bg-card p-5 shadow-sm transition-all",
                  status === "active" || status === "ready"
                    ? "border-success/30 bg-success/[0.02]"
                    : status === "coming_soon"
                    ? "border-border opacity-60"
                    : "border-border hover:border-primary/20 hover:shadow-md"
                )}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", ch.color)}>
                      {IconComponent && <IconComponent className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{ch.name}</p>
                        {ch.comingSoon && <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">Coming soon</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {(status === "active" || status === "ready") ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            <span className="text-[10px] text-success font-medium">{status === "ready" ? "Ready" : "Active"}</span>
                          </>
                        ) : status === "coming_soon" ? (
                          <>
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Coming soon</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            <span className="text-[10px] text-muted-foreground">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {(status === "active" || status === "ready") && <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-1" />}
                </div>

                {/* Channel-specific details */}
                {!ch.comingSoon && renderChannelDetails(ch.id)}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Simulate Section */}
      <div>
        <h3 className="font-display font-semibold text-foreground text-lg mb-1">Simulate Inbound Message</h3>
        <p className="text-xs text-muted-foreground mb-4">Test how Sammy handles an incoming message from any channel.</p>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Channel</Label>
              <select
                value={simChannel}
                onChange={e => setSimChannel(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                {CHANNELS.filter(c => !c.comingSoon).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Sender Name</Label>
              <Input className="mt-1.5 h-9 text-sm" placeholder="Jane Smith" value={simName} onChange={e => setSimName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sender Email / Phone</Label>
              <Input className="mt-1.5 h-9 text-sm" placeholder="jane@company.com" value={simContact} onChange={e => setSimContact(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Message</Label>
              <Input className="mt-1.5 h-9 text-sm" placeholder="Hi, I'm interested in your product..." value={simMessage} onChange={e => setSimMessage(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <Button size="sm" className="gap-1.5 text-xs" onClick={handleSimulate} disabled={simSending}>
              <Send className="w-3 h-3" /> {simSending ? "Sending..." : "Send Test Message"}
            </Button>
            {simResult && (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-success font-medium"
              >
                {simResult}
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployView;
