import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Edit3, Send, Clock, AlertTriangle, CheckCircle2,
  Info, Loader2, RefreshCw, ChevronDown, ChevronUp, Zap,
  TrendingUp, Headphones, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchWorkItems, fetchActivity, approveWorkItem, rejectWorkItem,
  editWorkItem, triggerScan, parseWorkItem,
  type WorkItem, type ParsedWorkItem, type ActivityEntry,
} from "@/services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const ORG_KEY = "vaigence_org_id";

const agentIcons: Record<string, typeof TrendingUp> = {
  sales: TrendingUp,
  support: Headphones,
  success: Heart,
};

const agentColors: Record<string, string> = {
  sales: "text-agent-sales",
  support: "text-agent-support",
  success: "text-agent-success",
};

const statusIcons: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  pending: Clock,
};

const statusColors: Record<string, string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  pending: "text-primary",
};

const CommandCenter = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [pendingItems, setPendingItems] = useState<ParsedWorkItem[]>([]);
  const [recentItems, setRecentItems] = useState<ParsedWorkItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const [pending, all, actLog] = await Promise.all([
        fetchWorkItems(orgId, "pending_approval"),
        fetchWorkItems(orgId),
        fetchActivity(orgId, undefined, 30),
      ]);
      setPendingItems(pending.map(parseWorkItem));
      setRecentItems(all.filter((i) => i.status !== "pending_approval").map(parseWorkItem));
      setActivity(actLog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveWorkItem(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectWorkItem(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setActionLoading(id);
    try {
      await editWorkItem(id, editContent);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Edit failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await triggerScan(orgId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  if (!orgId) {
    return (
      <div className="rounded-xl border-2 border-dashed border-warning/40 bg-warning/5 p-5">
        <h3 className="font-display font-semibold text-sm">Backend not connected</h3>
        <p className="text-xs text-muted-foreground mt-1">Set your org ID in localStorage and refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Command Center</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingItems.length} action{pendingItems.length !== 1 ? "s" : ""} awaiting your approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg bg-secondary transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </button>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-1.5 text-xs text-primary-foreground px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Run Scan Now
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-destructive/60 hover:text-destructive"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Pending Approvals */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Pending Approvals ({pendingItems.length})
        </h3>

        {pendingItems.length === 0 && !loading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">All clear — no actions waiting for approval</p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {pendingItems.map((item) => {
              const Icon = agentIcons[item.agent_role] || Zap;
              const isExpanded = expandedId === item.id;
              const isEditing = editingId === item.id;
              const isLoading = actionLoading === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
                >
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
                  >
                    <Icon className={cn("w-5 h-5 shrink-0", agentColors[item.agent_role])} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{item.agent_name}</span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">{item.trigger_type.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.proposed_action?.type.replace(/_/g, " ")} to {item.target.name} at {item.target.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isExpanded && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }}
                            disabled={isLoading}
                            className="w-8 h-8 rounded-lg bg-success/10 text-success hover:bg-success/20 flex items-center justify-center transition-colors"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReject(item.id); }}
                            disabled={isLoading}
                            className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      className="border-t border-border"
                    >
                      <div className="px-5 py-4 space-y-4">
                        {/* Research context */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Research</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.research_context}</p>
                        </div>

                        {/* Drafted message */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              Drafted message ({item.proposed_action?.channel})
                            </p>
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  setEditingId(null);
                                } else {
                                  setEditContent(item.proposed_action?.content || "");
                                  setEditingId(item.id);
                                }
                              }}
                              className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> {isEditing ? "Cancel" : "Edit"}
                            </button>
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={4}
                                className="w-full text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                              />
                              <button
                                onClick={() => handleEdit(item.id)}
                                disabled={isLoading}
                                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                              >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                              </button>
                            </div>
                          ) : (
                            <div className="bg-secondary rounded-lg px-4 py-3">
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {item.proposed_action?.content}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-success text-white hover:bg-success/90 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Approve & Send
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Activity Log */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> Recent Activity
        </h3>
        <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
          {activity.slice(0, 15).map((entry) => {
            const Icon = statusIcons[entry.status] || Info;
            return (
              <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                <Icon className={cn("w-4 h-4 shrink-0", statusColors[entry.status])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{entry.action}</p>
                  {entry.detail && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.detail}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                  {entry.agent_name}
                </span>
              </div>
            );
          })}
          {activity.length === 0 && (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">
              No activity yet. Run a scan to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
