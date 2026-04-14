import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Clock, CheckCircle2, Info, Loader2, RefreshCw, Play,
  ChevronDown, ChevronUp, Edit3, Check, X, AlertTriangle,
  Mail, MessageSquare, ArrowUpRight, User, Building2, Linkedin, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  fetchQueue, fetchActivity, triggerScan,
  approveTouch, rejectTouch, editTouch,
  type QueueItem, type ActivityEntry,
} from "@/services/api";
import { ORG_KEY, ACTIVITY_STATUS_ICONS, ACTIVITY_STATUS_COLORS } from "@/lib/constants";
import { DEMO_ORG_ID, demoQueue, demoActivity } from "@/lib/demo-data";

const statusIcons = ACTIVITY_STATUS_ICONS;
const statusColors = ACTIVITY_STATUS_COLORS;

const channelIcon: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageSquare,
  linkedin: Linkedin,
  sms: Phone,
};
const channelLabel: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn DM",
  sms: "SMS",
};
const channelColor: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-600",
  whatsapp: "bg-green-500/10 text-green-600",
  linkedin: "bg-sky-500/10 text-sky-600",
  sms: "bg-purple-500/10 text-purple-600",
};

interface MessagesViewProps {
  onCountUpdate?: (count: number) => void;
}

const MessagesView = ({ onCountUpdate }: MessagesViewProps) => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [tab, setTab] = useState<"pending" | "sent" | "activity">("pending");
  const [pending, setPending] = useState<QueueItem[]>([]);
  const [sent, setSent] = useState<QueueItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!orgId) return;
    if (orgId === DEMO_ORG_ID) {
      setPending(demoQueue); setSent([]); setActivity(demoActivity);
      onCountUpdate?.(demoQueue.length);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, s, a] = await Promise.all([
        fetchQueue(orgId, "pending_approval"),
        fetchQueue(orgId, "sent"),
        fetchActivity(orgId, 20),
      ]);
      setPending(p.length ? p : demoQueue); setSent(s); setActivity(a.length ? a : demoActivity);
      onCountUpdate?.((p.length || demoQueue.length));
    } catch (err) {
      setPending(demoQueue); setSent([]); setActivity(demoActivity);
      onCountUpdate?.(demoQueue.length);
    } finally { setLoading(false); }
  }, [orgId, onCountUpdate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveTouch(id); await loadData(); toast.success("Message approved"); } catch (err) { toast.error("Failed to approve message"); } finally { setActionLoading(null); }
  };
  const handleReject = async (id: string) => {
    setActionLoading(id);
    try { await rejectTouch(id); await loadData(); toast.success("Message rejected"); } catch (err) { toast.error("Failed to reject message"); } finally { setActionLoading(null); }
  };
  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setActionLoading(id);
    try { await editTouch(id, editContent); setEditingId(null); await loadData(); toast.success("Message updated"); } catch (err) { toast.error("Failed to update message"); } finally { setActionLoading(null); }
  };
  const handleScan = async () => {
    setScanning(true);
    try { await triggerScan(orgId); await loadData(); toast.success("Scan complete"); } catch (err) { toast.error("Failed to trigger scan"); } finally { setScanning(false); }
  };

  const tabs = [
    { id: "pending" as const, label: "Pending", count: pending.length },
    { id: "sent" as const, label: "Sent", count: sent.length },
    { id: "activity" as const, label: "Activity", count: activity.length },
  ];

  const getAngleLabel = (angle: string, touchIndex: number) => {
    if (angle === "first_touch") return "Initial Outreach";
    if (angle.startsWith("follow_up")) return `Follow-up #${touchIndex}`;
    return angle.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderQueueItem = (item: QueueItem) => {
    const isExpanded = expandedId === item.id;
    const isEditing = editingId === item.id;
    const isLoading = actionLoading === item.id;
    const isPending = item.status === "pending_approval";
    const ChannelIcon = channelIcon[item.channel] || Mail;
    const chColor = channelColor[item.channel] || "bg-muted text-muted-foreground";
    const chLabel = channelLabel[item.channel] || item.channel;

    return (
      <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
        className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

        {/* Header bar - always visible */}
        <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
          className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-secondary/30 transition-colors">

          {/* Channel badge */}
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", chColor)}>
            <ChannelIcon className="w-4 h-4" />
          </div>

          {/* Recipient + context */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{item.contact_name}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{item.contact_company}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", chColor)}>{chLabel}</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {getAngleLabel(item.angle, item.touch_index)}
              </span>
              <span className="text-[10px] text-muted-foreground">{item.sequence_name.replace(/_/g, " ")}</span>
            </div>
            {/* Message preview - first line only */}
            {!isExpanded && (
              <p className="text-xs text-muted-foreground mt-2 truncate">{item.drafted_content.split("\n")[0]}</p>
            )}
          </div>

          {/* Actions + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {isPending && !isExpanded && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }} disabled={isLoading} title="Approve"
                  className="w-8 h-8 rounded-lg bg-success/10 text-success hover:bg-success/20 flex items-center justify-center">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleReject(item.id); }} disabled={isLoading} title="Skip"
                  className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Expanded view - full message */}
        {isExpanded && (
          <div className="border-t border-border">
            {/* Recipient details bar */}
            <div className="px-5 py-3 bg-secondary/30 flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <User className="w-3 h-3" /> <strong className="text-foreground font-medium">To:</strong> {item.contact_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {item.contact_email}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> {item.contact_company}
              </span>
              <span className="flex items-center gap-1.5">
                <ChannelIcon className="w-3 h-3" /> via {chLabel}
              </span>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Research context */}
              {item.research_context && (
                <div className="rounded-lg bg-info/5 border border-info/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-info font-medium mb-1 flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Sammy's Research
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{item.research_context}</p>
                </div>
              )}

              {/* Message body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {isPending ? "Draft Message" : "Sent Message"}
                  </p>
                  {isPending && (
                    <button onClick={() => { if (isEditing) setEditingId(null); else { setEditContent(item.drafted_content); setEditingId(item.id); } }}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"><Edit3 className="w-3 h-3" /> {isEditing ? "Cancel" : "Edit"}</button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6}
                      className="w-full text-sm bg-background border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed" />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleEdit(item.id)} disabled={isLoading} className="gap-1.5 text-xs">
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Changes
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-background px-5 py-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.drafted_content}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isPending && (
                <div className="flex items-center gap-3 pt-1">
                  <Button size="sm" onClick={() => handleApprove(item.id)} disabled={isLoading} className="gap-2 bg-success hover:bg-success/90">
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Approve & Send
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleReject(item.id)} disabled={isLoading} className="gap-2">
                    <X className="w-3.5 h-3.5" /> Skip This
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditContent(item.drafted_content); setEditingId(item.id); }} className="gap-2 text-muted-foreground">
                    <Edit3 className="w-3.5 h-3.5" /> Edit First
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Messages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pending.length > 0 ? `${pending.length} message${pending.length !== 1 ? "s" : ""} awaiting your review` : "All clear. Sammy has nothing pending"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" onClick={handleScan} disabled={scanning} className="gap-1.5 text-xs">
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Scan Now
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t.label} {t.count > 0 && <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "pending" && (
        <div className="space-y-3">
          {pending.length === 0 && !loading && (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs mt-1">No messages waiting. Hit "Scan Now" to check for due contacts.</p>
            </div>
          )}
          <AnimatePresence>{pending.map(renderQueueItem)}</AnimatePresence>
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-3">
          {sent.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No messages sent yet</p>
            </div>
          )}
          {sent.map(renderQueueItem)}
        </div>
      )}

      {tab === "activity" && (
        <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
          {activity.map((entry) => {
            const Icon = statusIcons[entry.status] || Info;
            return (
              <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", statusColors[entry.status])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{entry.action}</p>
                  {entry.detail && <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.detail}</p>}
                </div>
                {entry.contact_name && <span className="text-[10px] text-muted-foreground shrink-0">{entry.contact_name}</span>}
              </div>
            );
          })}
          {activity.length === 0 && (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">No activity yet</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagesView;
