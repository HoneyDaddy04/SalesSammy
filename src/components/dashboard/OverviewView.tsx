import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Send, MessageSquare, ThumbsUp, Clock, CheckCircle2, AlertTriangle, Info, Users, Play, Loader2, Check, X, ChevronDown, ChevronUp, Edit3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import StatCard from "./StatCard";
import teammateAvatar from "@/assets/agent-sales.jpg";
import {
  fetchStandup, fetchQueue, fetchActivity, fetchContacts, triggerScan,
  approveTouch, rejectTouch, editTouch,
  type StandupData, type QueueItem, type ActivityEntry, type ApiContact,
} from "@/services/api";

import { API_BASE, ORG_KEY, ACTIVITY_STATUS_ICONS, ACTIVITY_STATUS_COLORS } from "@/lib/constants";
import { DEMO_ORG_ID, demoStandup, demoQueue, demoActivity, demoContacts } from "@/lib/demo-data";

const statusIcons = ACTIVITY_STATUS_ICONS;
const statusColors = ACTIVITY_STATUS_COLORS;

const OverviewView = () => {
  const navigate = useNavigate();
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [standup, setStandup] = useState<StandupData | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approvalGates, setApprovalGates] = useState<any[]>([]);
  const [gateLoading, setGateLoading] = useState<string | null>(null);

  const isDemo = orgId === DEMO_ORG_ID;

  const loadData = async () => {
    if (!orgId) return;

    // Use static demo data when backend is unreachable
    if (isDemo) {
      setStandup(demoStandup);
      setQueue(demoQueue);
      setActivity(demoActivity);
      setContacts(demoContacts);
      setApprovalGates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [s, q, a, c, gates] = await Promise.all([
        fetchStandup(orgId).catch(() => null),
        fetchQueue(orgId, "pending_approval").catch(() => []),
        fetchActivity(orgId, 10).catch(() => []),
        fetchContacts(orgId).catch(() => []),
        fetch(`${API_BASE}/api/approvals?org_id=${orgId}`).then(r => r.json()).catch(() => []),
      ]);
      // If all calls returned empty/null, fall back to demo data
      if (!s && q.length === 0 && a.length === 0 && c.length === 0) {
        setStandup(demoStandup);
        setQueue(demoQueue);
        setActivity(demoActivity);
        setContacts(demoContacts);
      } else {
        setStandup(s);
        setQueue(q);
        setActivity(a);
        setContacts(c);
      }
      setApprovalGates(gates);
    } catch (err) {
      // API completely unreachable — use demo data
      setStandup(demoStandup);
      setQueue(demoQueue);
      setActivity(demoActivity);
      setContacts(demoContacts);
      setApprovalGates([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [orgId]);

  const handleScan = async () => {
    setScanning(true);
    try { await triggerScan(orgId); await loadData(); toast.success("Scan complete"); } catch (err) { toast.error("Failed to trigger scan"); } finally { setScanning(false); }
  };

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

  const handleResolveGate = async (gateId: string, approved: boolean) => {
    setGateLoading(gateId);
    try {
      await fetch(`${API_BASE}/api/approvals/${gateId}/resolve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      toast.success(approved ? "Approved" : "Rejected");
      await loadData();
    } catch (err) { toast.error("Failed to resolve approval gate"); }
    finally { setGateLoading(null); }
  };

  const activeContacts = contacts.filter(c => c.status === "active").length;
  const repliedContacts = contacts.filter(c => c.status === "replied").length;

  return (
    <div className="space-y-6">
      {/* Header with teammate profile */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Operations Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Sammy at a glance</p>
        </div>
        <button onClick={handleScan} disabled={scanning}
          className="flex items-center gap-1.5 text-xs text-primary-foreground px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50">
          {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Scan for Due Contacts
        </button>
      </div>

      {/* Teammate card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate("/dashboard/teammate")}>
        <div className="flex items-center gap-5">
          <img src={teammateAvatar} alt="Sammy" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-border shadow-md" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-display text-xl font-bold text-foreground">Sales Sammy</h3>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" /> Online
              </span>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Shadow Mode</span>
            </div>
            <p className="text-sm text-muted-foreground">Researches your leads, drafts personalized follow-ups, and keeps your pipeline warm across email and WhatsApp.</p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center shrink-0">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{contacts.length}</p>
              <p className="text-[10px] text-muted-foreground">Contacts</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{activeContacts}</p>
              <p className="text-[10px] text-muted-foreground">In Sequence</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-success">{repliedContacts}</p>
              <p className="text-[10px] text-muted-foreground">Replied</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Touches Sent" value={standup?.touches_sent ?? 0} change="Today" icon={Send} />
        <StatCard label="Replies" value={standup?.replies_received ?? 0} change="Today" icon={MessageSquare} colorClass="text-primary" />
        <StatCard label="Positive" value={standup?.positive_replies ?? 0} icon={ThumbsUp} colorClass="text-success" />
        <StatCard label="Pending Approval" value={queue.length} change={queue.length > 0 ? "Needs you" : "All clear"} icon={Clock} colorClass={queue.length > 0 ? "text-warning" : "text-success"} />
        <StatCard label="Planned Today" value={standup?.planned_today ?? 0} icon={Users} colorClass="text-primary" />
      </div>

      {/* Approval Gates */}
      {approvalGates.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-warning" /> Pending Approval Gates ({approvalGates.length})
          </h3>
          {approvalGates.map((gate: any) => (
            <motion.div key={gate.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{gate.description || gate.gate_type?.replace(/_/g, " ")}</p>
                {gate.requested_at && <p className="text-[10px] text-muted-foreground mt-0.5">Requested {new Date(gate.requested_at).toLocaleDateString()}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleResolveGate(gate.id, true)} disabled={gateLoading === gate.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-success text-white hover:bg-success/90 disabled:opacity-50">
                  {gateLoading === gate.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                </button>
                <button onClick={() => handleResolveGate(gate.id, false)} disabled={gateLoading === gate.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5 inline mr-1" />Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Two-column: Pending Approvals + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Approvals */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Pending Approvals ({queue.length})
          </h3>

          {queue.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">All clear.nothing to approve</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => {
                const isExpanded = expandedId === item.id;
                const isEditing = editingId === item.id;
                const isLoading = actionLoading === item.id;

                return (
                  <div key={item.id} className="rounded-lg border border-border overflow-hidden">
                    <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.contact_name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.angle.replace(/_/g, " ")} · {item.channel} · Touch {item.touch_index + 1}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isExpanded && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }} disabled={isLoading}
                              className="w-7 h-7 rounded-md bg-success/10 text-success hover:bg-success/20 flex items-center justify-center">
                              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReject(item.id); }} disabled={isLoading}
                              className="w-7 h-7 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-4 py-3 space-y-3">
                        <p className="text-xs text-muted-foreground">{item.research_context}</p>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Draft</p>
                            <button onClick={() => { if (isEditing) setEditingId(null); else { setEditContent(item.drafted_content); setEditingId(item.id); } }}
                              className="text-[10px] text-primary flex items-center gap-1"><Edit3 className="w-3 h-3" /> {isEditing ? "Cancel" : "Edit"}</button>
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3}
                                className="w-full text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none resize-none" />
                              <button onClick={() => handleEdit(item.id)} className="text-xs text-primary flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
                            </div>
                          ) : (
                            <div className="bg-secondary rounded-lg px-3 py-2.5">
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.drafted_content}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApprove(item.id)} disabled={isLoading}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-success text-white hover:bg-success/90 disabled:opacity-50">
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
                          </button>
                          <button onClick={() => handleReject(item.id)} disabled={isLoading}
                            className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5 inline mr-1" />Skip</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-4">Live Activity</h3>
          <div className="space-y-2">
            {activity.map((entry) => {
              const Icon = statusIcons[entry.status] || Info;
              return (
                <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", statusColors[entry.status])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{entry.action}</p>
                    {entry.detail && <p className="text-xs text-muted-foreground truncate">{entry.detail}</p>}
                  </div>
                  {entry.contact_name && <span className="text-[10px] text-muted-foreground shrink-0">{entry.contact_name}</span>}
                </div>
              );
            })}
            {activity.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No activity yet. Run a scan to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
