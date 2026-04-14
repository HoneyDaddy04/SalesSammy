import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, CreditCard, Database, Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { API_BASE, ORG_KEY } from "@/lib/constants";

const SettingsView = () => {
  const navigate = useNavigate();
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    fetch(`${API_BASE}/api/billing?org_id=${orgId}`)
      .then(r => r.json()).then(setBilling).catch(() => { toast.error("Failed to load billing"); }).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2"><div className="h-7 w-32 rounded bg-muted" /><div className="h-4 w-56 rounded bg-muted" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-5 w-28 rounded bg-muted" />
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, j) => (<div key={j} className="h-10 w-full rounded-lg bg-muted" />))}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const planDetails: Record<string, { name: string; price: string; touches: string }> = {
    starter: { name: "Starter", price: "₦49,999/mo", touches: "500 touches/mo" },
    growth: { name: "Growth", price: "₦149,999/mo", touches: "2,000 touches/mo" },
    scale: { name: "Scale", price: "₦299,999/mo", touches: "10,000 touches/mo" },
  };

  const currentPlan = planDetails[billing?.plan || "starter"];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Account, billing, and data management</p>
      </div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="text-xs">Organization ID</Label><Input value={orgId} disabled className="mt-1 font-mono text-xs" /></div>
          <div><Label className="text-xs">Plan</Label><Input value={currentPlan.name} disabled className="mt-1" /></div>
        </div>
      </motion.div>

      {/* Billing */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /> Billing & Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Current Plan</p>
            <p className="text-lg font-display font-bold text-foreground mt-1">{currentPlan.name}</p>
            <p className="text-xs text-muted-foreground">{currentPlan.price}</p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Touches Used</p>
            <p className="text-lg font-display font-bold text-foreground mt-1">{billing?.touches_used || 0}</p>
            <p className="text-xs text-muted-foreground">of {billing?.touches_limit || 500} this month</p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Usage</p>
            <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${((billing?.touches_used || 0) / (billing?.touches_limit || 500)) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{Math.round(((billing?.touches_used || 0) / (billing?.touches_limit || 500)) * 100)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(["starter", "growth", "scale"] as const).map((plan) => {
            const p = planDetails[plan];
            const isCurrent = billing?.plan === plan;
            return (
              <div key={plan} className={`flex-1 rounded-lg border p-4 ${isCurrent ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-foreground">{p.name}</p>{isCurrent && <Check className="w-4 h-4 text-primary" />}</div>
                <p className="text-xs text-muted-foreground">{p.price} · {p.touches}</p>
                {!isCurrent && (
                  <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={async () => {
                    await fetch(`${API_BASE}/api/billing/upgrade`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ org_id: orgId, plan }) });
                    window.location.reload();
                  }}>{plan > (billing?.plan || "starter") ? "Upgrade" : "Downgrade"}</Button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Data Export */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-muted-foreground" /> Data</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
            const contacts = await fetch(`${API_BASE}/api/contacts?org_id=${orgId}`).then(r => r.json());
            const csv = "Name,Email,Company,Status\n" + contacts.map((c: any) => `${c.name},${c.email},${c.company},${c.status}`).join("\n");
            const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "contacts.csv"; a.click();
          }}><Download className="w-3.5 h-3.5" /> Export Contacts</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
            const act = await fetch(`${API_BASE}/api/activity?org_id=${orgId}&limit=1000`).then(r => r.json());
            const csv = "Action,Detail,Status,Contact,Date\n" + act.map((a: any) => `"${a.action}","${a.detail}",${a.status},${a.contact_name || ""},${a.created_at}`).join("\n");
            const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "activity.csv"; a.click();
          }}><Download className="w-3.5 h-3.5" /> Export Activity</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsView;
