import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Edit3, Send, Clock, CheckCircle2, Info,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Zap, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchQueue, approveTouch, rejectTouch, editTouch, triggerScan, type QueueItem } from "@/services/api";

const ORG_KEY = "vaigence_org_id";

const statusIcons: Record<string, typeof Info> = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: AlertTriangle, pending: Clock };
const statusColors: Record<string, string> = { info: "text-muted-foreground", success: "text-success", warning: "text-warning", error: "text-destructive", pending: "text-primary" };

interface QueueViewProps {
  onCountUpdate?: (count: number) => void;
}

const QueueView = ({ onCountUpdate }: QueueViewProps) => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const pending = await fetchQueue(orgId, "pending_approval");
      setItems(pending);
      onCountUpdate?.(pending.length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [orgId, onCountUpdate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveTouch(id); await loadData(); }
    catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try { await rejectTouch(id); await loadData(); }
    catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setActionLoading(id);
    try { await editTouch(id, editContent); setEditingId(null); await loadData(); }
    catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleScan = async () => {
    setScanning(true);
    try { await triggerScan(orgId); await loadData(); }
    catch (err) { console.error(err); }
    finally { setScanning(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} message{items.length !== 1 ? "s" : ""} ready for review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg bg-secondary">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </button>
          <button onClick={handleScan} disabled={scanning} className="flex items-center gap-1.5 text-xs text-primary-foreground px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50">
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Scan Now
          </button>
        </div>
      </div>

      {items.length === 0 && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">All clear</p>
          <p className="text-xs mt-1">No messages waiting. Hit "Scan Now" to check for due contacts.</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;
            const isLoading = actionLoading === item.id;
            const meta = item.contact_metadata ? JSON.parse(item.contact_metadata) : {};

            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{item.contact_name}</span>
                      <span className="text-[10px] text-muted-foreground">at {item.contact_company}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Touch {item.touch_index + 1} · {item.angle.replace(/_/g, " ")} · {item.channel} · {item.sequence_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isExpanded && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }} disabled={isLoading}
                          className="w-8 h-8 rounded-lg bg-success/10 text-success hover:bg-success/20 flex items-center justify-center">
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(item.id); }} disabled={isLoading}
                          className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-border">
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Research</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.research_context}</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Draft ({item.channel})</p>
                          <button onClick={() => { if (isEditing) { setEditingId(null); } else { setEditContent(item.drafted_content); setEditingId(item.id); } }}
                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> {isEditing ? "Cancel" : "Edit"}
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4}
                              className="w-full text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                            <button onClick={() => handleEdit(item.id)} disabled={isLoading}
                              className="text-xs text-primary flex items-center gap-1">
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                            </button>
                          </div>
                        ) : (
                          <div className="bg-secondary rounded-lg px-4 py-3">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.drafted_content}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button onClick={() => handleApprove(item.id)} disabled={isLoading}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-success text-white hover:bg-success/90 disabled:opacity-50">
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Approve & Send
                        </button>
                        <button onClick={() => handleReject(item.id)} disabled={isLoading}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" /> Skip
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
  );
};

export default QueueView;
