import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, Send, MessageSquare, TrendingUp, ChevronDown, ChevronUp,
  Loader2, Trash2, Shield, Crown, Zap, Eye, RefreshCw, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/constants";

interface Tenant {
  id: string;
  name: string;
  industry: string | null;
  created_at: string;
  contact_count: number;
  touches_sent: number;
  replies_received: number;
  teammate_status: string | null;
  plan: string | null;
}

interface PlatformStats {
  total_tenants: number;
  total_contacts: number;
  total_touches_sent: number;
  total_replies: number;
  active_tenants: number;
}

interface TenantDetail {
  org: Record<string, unknown>;
  teammate: Record<string, unknown> | null;
  contactsByStatus: Array<{ status: string; count: number }>;
  subscription: Record<string, unknown> | null;
  recentActivity: Array<{ id: string; action: string; detail: string; status: string; created_at: string }>;
}

const planColors: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  growth: "bg-primary/10 text-primary",
  scale: "bg-success/10 text-success",
};

const statusColors: Record<string, string> = {
  shadow: "bg-warning/10 text-warning",
  supervised: "bg-info/10 text-info",
  autonomous: "bg-success/10 text-success",
};

const AdminView = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`).then(r => r.json()),
        fetch(`${API_BASE}/api/admin/tenants`).then(r => r.json()),
      ]);
      setStats(s);
      setTenants(Array.isArray(t) ? t : []);
    } catch {
      toast.error("Failed to load admin data");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadDetail = async (orgId: string) => {
    setDetailLoading(true);
    try {
      const d = await fetch(`${API_BASE}/api/admin/tenants/${orgId}`).then(r => r.json());
      setDetail(d);
    } catch {
      toast.error("Failed to load tenant detail");
    } finally { setDetailLoading(false); }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
    } else {
      setExpandedId(id);
      loadDetail(id);
    }
  };

  const handlePlanChange = async (orgId: string, plan: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/tenants/${orgId}/plan`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      toast.success(`Plan updated to ${plan}`);
      load();
    } catch { toast.error("Failed to update plan"); }
  };

  const handleStatusChange = async (orgId: string, status: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/tenants/${orgId}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success(`Status updated to ${status}`);
      load();
    } catch { toast.error("Failed to update status"); }
  };

  const handleDelete = async (orgId: string, name: string) => {
    if (!confirm(`Delete tenant "${name}" and ALL their data? This cannot be undone.`)) return;
    try {
      await fetch(`${API_BASE}/api/admin/tenants/${orgId}`, { method: "DELETE" });
      toast.success("Tenant deleted");
      setExpandedId(null);
      load();
    } catch { toast.error("Failed to delete tenant"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage all tenants and monitor platform health</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Platform stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Tenants", value: stats.total_tenants, icon: Building2, color: "text-primary" },
            { label: "Active", value: stats.active_tenants, icon: TrendingUp, color: "text-success" },
            { label: "Contacts", value: stats.total_contacts, icon: Users, color: "text-info" },
            { label: "Touches Sent", value: stats.total_touches_sent, icon: Send, color: "text-warning" },
            { label: "Replies", value: stats.total_replies, icon: MessageSquare, color: "text-success" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={cn("w-4 h-4", s.color)} />
                <BarChart3 className="w-3 h-3 text-muted-foreground/30" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tenant list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">All Tenants</p>
        {tenants.map((tenant, i) => (
          <motion.div key={tenant.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

            {/* Tenant row */}
            <button onClick={() => handleExpand(tenant.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{tenant.name}</span>
                  {tenant.plan && (
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", planColors[tenant.plan] || planColors.starter)}>
                      {tenant.plan}
                    </span>
                  )}
                  {tenant.teammate_status && (
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", statusColors[tenant.teammate_status] || statusColors.shadow)}>
                      {tenant.teammate_status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{tenant.contact_count} contacts</span>
                  <span>{tenant.touches_sent} sent</span>
                  <span>{tenant.replies_received} replies</span>
                  {tenant.industry && <span>{tenant.industry}</span>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{new Date(tenant.created_at).toLocaleDateString()}</span>
              {expandedId === tenant.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
              {expandedId === tenant.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border">
                  {detailLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                  ) : detail ? (
                    <div className="p-5 space-y-4">
                      {/* Contact breakdown */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Contacts by Status</p>
                        <div className="flex flex-wrap gap-2">
                          {detail.contactsByStatus.map((s: any) => (
                            <span key={s.status} className="text-xs bg-secondary px-2.5 py-1 rounded-full">
                              {s.status}: <strong>{s.count}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Subscription */}
                      {detail.subscription && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Subscription</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span>Plan: <strong className="capitalize">{(detail.subscription as any).plan}</strong></span>
                            <span>Touches: <strong>{(detail.subscription as any).touches_used}/{(detail.subscription as any).touches_limit}</strong></span>
                            <span>Status: <strong className="capitalize">{(detail.subscription as any).status}</strong></span>
                          </div>
                        </div>
                      )}

                      {/* Recent activity */}
                      {detail.recentActivity.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Recent Activity</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {detail.recentActivity.slice(0, 8).map(a => (
                              <div key={a.id} className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                <span className="truncate">{a.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground mr-1">Plan:</span>
                          {["starter", "growth", "scale"].map(p => (
                            <button key={p} onClick={() => handlePlanChange(tenant.id, p)}
                              className={cn("text-[10px] px-2 py-1 rounded-md capitalize border transition-colors",
                                tenant.plan === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                              )}>{p}</button>
                          ))}
                        </div>
                        <div className="w-px h-4 bg-border" />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground mr-1">Mode:</span>
                          {["shadow", "supervised", "autonomous"].map(s => (
                            <button key={s} onClick={() => handleStatusChange(tenant.id, s)}
                              className={cn("text-[10px] px-2 py-1 rounded-md capitalize border transition-colors",
                                tenant.teammate_status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                              )}>{s}</button>
                          ))}
                        </div>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tenant.id, tenant.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1">
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {tenants.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No tenants yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
