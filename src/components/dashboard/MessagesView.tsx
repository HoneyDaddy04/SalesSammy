import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Clock, CheckCircle2, Info, Loader2, RefreshCw, Play,
  Edit3, Check, X, AlertTriangle,
  Mail, MessageSquare, ArrowUpRight, User, Building2, Linkedin, Phone,
  Bell,
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
import { useNotifications } from "@/hooks/useNotifications";

const statusIcons = ACTIVITY_STATUS_ICONS;
const statusColors = ACTIVITY_STATUS_COLORS;

const channelIcon: Record<string, typeof Mail> = {
  email: Mail, whatsapp: MessageSquare, linkedin: Linkedin, sms: Phone,
};
const channelLabel: Record<string, string> = {
  email: "Email", whatsapp: "WhatsApp", linkedin: "LinkedIn DM", sms: "SMS",
};
const channelColor: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  whatsapp: "bg-green-500/10 text-green-600 dark:text-green-400",
  linkedin: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  sms: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    } catch {
      setPending(demoQueue); setSent([]); setActivity(demoActivity);
      onCountUpdate?.(demoQueue.length);
    } finally { setLoading(false); }
  }, [orgId, onCountUpdate]);

  useEffect(() => { loadData(); }, [loadData]);

  const { notify } = useNotifications();
  const prevPendingCount = useRef(0);

  // Notify when new pending messages arrive
  useEffect(() => {
    if (!loading && pending.length > prevPendingCount.current && prevPendingCount.current !== 0) {
      const newCount = pending.length - prevPendingCount.current;
      notify(
        `${newCount} new message${newCount > 1 ? "s" : ""} from Sammy`,
        `${pending[0]?.contact_name || "A lead"} — ready for your review`,
        { sound: true }
      );
    }
    prevPendingCount.current = pending.length;
  }, [pending.length, loading, notify]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveTouch(id); toast.success("Message approved & queued to send"); await loadData(); } catch { toast.error("Failed to approve"); } finally { setActionLoading(null); }
  };
  const handleReject = async (id: string) => {
    setActionLoading(id);
    try { await rejectTouch(id); toast.success("Message skipped"); await loadData(); } catch { toast.error("Failed to skip"); } finally { setActionLoading(null); }
  };
  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setActionLoading(id);
    try { await editTouch(id, editContent); setEditingId(null); toast.success("Message updated"); await loadData(); } catch { toast.error("Failed to update"); } finally { setActionLoading(null); }
  };
  const handleScan = async () => {
    setScanning(true);
    try { await triggerScan(orgId); toast.success("Scan complete"); await loadData(); } catch { toast.error("Scan failed"); } finally { setScanning(false); }
  };

  const currentList = tab === "pending" ? pending : tab === "sent" ? sent : [];
  const selectedItem = currentList.find(i => i.id === selectedId);

  const tabs = [
    { id: "pending" as const, label: "Pending", count: pending.length, pulse: pending.length > 0 },
    { id: "sent" as const, label: "Sent", count: sent.length },
    { id: "activity" as const, label: "Activity", count: activity.length },
  ];

  const getAngleLabel = (angle: string, touchIndex: number) => {
    if (angle === "first_touch") return "Initial Outreach";
    if (angle.startsWith("follow_up")) return `Follow-up #${touchIndex}`;
    return angle.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // ── List item (left panel) ──
  const renderListItem = (item: QueueItem) => {
    const isSelected = selectedId === item.id;
    const ChannelIcon = channelIcon[item.channel] || Mail;
    const chColor = channelColor[item.channel] || "bg-muted text-muted-foreground";

    return (
      <button
        key={item.id}
        onClick={() => setSelectedId(item.id)}
        className={cn(
          "w-full text-left px-4 py-3 flex items-start gap-3 transition-all border-l-2",
          isSelected
            ? "bg-primary/5 border-l-primary"
            : "border-l-transparent hover:bg-secondary/50"
        )}
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", chColor)}>
          <ChannelIcon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground truncate">{item.contact_name}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{channelLabel[item.channel]}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.contact_company}</p>
          <p className="text-xs text-muted-foreground/70 truncate mt-1">{item.drafted_content.split("\n")[0]}</p>
        </div>
      </button>
    );
  };

  // ── Detail panel (right) ──
  const renderDetail = () => {
    if (!selectedItem) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <Mail className="w-12 h-12 opacity-15 mb-3" />
          <p className="text-sm font-medium">Select a message</p>
          <p className="text-xs mt-1">Click a message on the left to preview it</p>
        </div>
      );
    }

    const item = selectedItem;
    const isPending = item.status === "pending_approval";
    const isEditing = editingId === item.id;
    const isLoading = actionLoading === item.id;
    const ChannelIcon = channelIcon[item.channel] || Mail;
    const chColor = channelColor[item.channel] || "bg-muted text-muted-foreground";
    const chLabel = channelLabel[item.channel] || item.channel;

    return (
      <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
        {/* Detail header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", chColor)}>
              <ChannelIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{item.contact_name}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {item.contact_company}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.contact_email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", chColor)}>{chLabel}</span>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {getAngleLabel(item.angle, item.touch_index)}
            </span>
            <span className="text-[10px] text-muted-foreground">{item.sequence_name.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* Detail body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Research */}
          {item.research_context && (
            <div className="rounded-lg bg-info/5 border border-info/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-info font-medium mb-1 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Sammy's Research
              </p>
              <p className="text-xs text-foreground leading-relaxed">{item.research_context}</p>
            </div>
          )}

          {/* Message */}
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
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
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
        </div>

        {/* Actions bar */}
        {isPending && (
          <div className="px-5 py-3 border-t border-border flex items-center gap-3">
            <Button size="sm" onClick={() => handleApprove(item.id)} disabled={isLoading} className="gap-2 bg-success hover:bg-success/90 flex-1">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Approve & Send
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleReject(item.id)} disabled={isLoading} className="gap-2">
              <X className="w-3.5 h-3.5" /> Skip
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setEditContent(item.drafted_content); setEditingId(item.id); }} className="gap-2 text-muted-foreground">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Messages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pending.length > 0 ? `${pending.length} message${pending.length !== 1 ? "s" : ""} awaiting your review` : "All clear"}
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
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedId(null); }}
            className={cn("flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all relative",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            {t.count > 0 && (
              <span className={cn("ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full",
                t.id === "pending" && t.count > 0 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Split-panel layout */}
      {tab !== "activity" ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex" style={{ height: "calc(100vh - 16rem)" }}>
          {/* Left panel: list */}
          <div className="w-[360px] border-r border-border overflow-y-auto shrink-0">
            {currentList.length === 0 && !loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs mt-1">No messages in this tab</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {currentList.map(renderListItem)}
              </div>
            )}
          </div>

          {/* Right panel: detail */}
          <div className="flex-1">
            {renderDetail()}
          </div>
        </div>
      ) : (
        /* Activity tab - full width */
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
