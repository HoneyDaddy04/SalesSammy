import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Brain, BookOpen, Calendar, Award, BarChart3, Workflow,
  TrendingUp, ClipboardList, Briefcase, Database, Mail, MessageSquare,
  CheckCircle2, Loader2, Save, Edit3, X, Plus, Trash2, Shield, User,
} from "lucide-react";
import TeammateChat from "./TeammateChat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import teammateAvatar from "@/assets/agent-sales.jpg";

import { API_BASE, ORG_KEY } from "@/lib/constants";

interface TeammateData {
  id: string;
  business_description: string;
  target_audience: string;
  lead_trigger_signals: string;
  lead_source_type: string;
  goal: string;
  voice_examples: string;
  guardrails: string;
  escalation_contact: string;
  persona_prompt: string;
  operating_instructions: string;
  primary_channel: string;
  secondary_channel: string | null;
  tertiary_channel: string | null;
  status: string;
}

const CHANNEL_OPTIONS = ["email", "whatsapp", "linkedin", "sms", "telegram"];

const TeammateDetailView = () => {
  const navigate = useNavigate();
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [teammate, setTeammate] = useState<TeammateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // All editable fields in one object
  const [draft, setDraft] = useState({
    persona_prompt: "",
    business_description: "",
    target_audience: "",
    lead_trigger_signals: "",
    lead_source_type: "",
    goal: "",
    guardrails: [] as string[],
    voice_examples: [] as string[],
    escalation_contact: "",
    primary_channel: "email",
    secondary_channel: "" as string,
    tertiary_channel: "" as string,
  });
  const [newGuardrail, setNewGuardrail] = useState("");
  const [newVoice, setNewVoice] = useState("");

  const [activity, setActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  const demoTeammate: TeammateData = {
    id: "demo-teammate", business_description: "We help businesses automate their sales follow-up.",
    target_audience: "Founders, sales leads at companies with 5-50 employees.",
    lead_trigger_signals: "Recently raised funding, hiring for sales roles.", lead_source_type: "Inbound + cold",
    goal: "Book a 15-minute demo call",
    voice_examples: JSON.stringify(["Hey Sarah, saw you just brought on 3 new people. Congrats!", "Quick one. Noticed your team is growing fast."]),
    guardrails: JSON.stringify(["Never discuss competitor pricing", "Don't promise custom features"]),
    escalation_contact: "founder@company.com",
    persona_prompt: "You are Sales Sammy, a friendly and persistent sales follow-up specialist.",
    operating_instructions: "Start in shadow mode. All messages need approval.",
    primary_channel: "email", secondary_channel: "whatsapp", tertiary_channel: null, status: "shadow",
  };

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const safeArray = (p: Promise<any>) => p.then(r => Array.isArray(r) ? r : []).catch(() => []);
      const [tRes, aRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/api/teammate?org_id=${orgId}`).then(r => r.json()).catch(() => null),
        safeArray(fetch(`${API_BASE}/api/activity?org_id=${orgId}&limit=8`).then(r => r.json())),
        fetch(`${API_BASE}/api/teammate/stats?org_id=${orgId}`).then(r => r.json()).catch(() => null),
      ]);
      const t: TeammateData = tRes && tRes.id ? tRes : demoTeammate;
      setTeammate(t);
      setActivity(aRes);
      setStats(sRes);
      initDraft(t);
    } catch {
      setTeammate(demoTeammate);
      initDraft(demoTeammate);
    } finally { setLoading(false); }
  };

  const initDraft = (t: TeammateData) => {
    let guardrails: string[] = [];
    let voice: string[] = [];
    try { guardrails = JSON.parse(t.guardrails || "[]"); } catch {}
    try { voice = JSON.parse(t.voice_examples || "[]"); } catch {}

    setDraft({
      persona_prompt: t.persona_prompt || "",
      business_description: t.business_description || "",
      target_audience: t.target_audience || "",
      lead_trigger_signals: t.lead_trigger_signals || "",
      lead_source_type: t.lead_source_type || "",
      goal: t.goal || "",
      guardrails,
      voice_examples: voice,
      escalation_contact: typeof t.escalation_contact === "string" ? t.escalation_contact : JSON.stringify(t.escalation_contact || ""),
      primary_channel: t.primary_channel || "email",
      secondary_channel: t.secondary_channel || "",
      tertiary_channel: t.tertiary_channel || "",
    });
  };

  useEffect(() => { loadData(); }, [orgId]);

  const handleCancel = () => {
    if (teammate) initDraft(teammate);
    setEditing(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/teammate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          persona_prompt: draft.persona_prompt,
          business_description: draft.business_description,
          target_audience: draft.target_audience,
          lead_trigger_signals: draft.lead_trigger_signals,
          lead_source_type: draft.lead_source_type,
          goal: draft.goal,
          guardrails: draft.guardrails,
          voice_examples: draft.voice_examples,
          primary_channel: draft.primary_channel,
          secondary_channel: draft.secondary_channel || null,
          tertiary_channel: draft.tertiary_channel || null,
        }),
      });
      setEditing(false);
      await loadData();
      toast.success("All changes saved");
    } catch { toast.error("Failed to save changes"); }
    finally { setSaving(false); }
  };

  const updateDraft = (field: string, value: any) => setDraft(prev => ({ ...prev, [field]: value }));

  if (loading) return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-5 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2"><div className="h-6 w-40 rounded bg-muted" /><div className="h-4 w-64 rounded bg-muted" /></div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-muted" /><div className="h-3 w-full rounded bg-muted" />
        </div>
      ))}
    </div>
  );
  if (!teammate) return <div className="text-muted-foreground">Sammy is not configured yet.</div>;

  // Section component — shows field name + editable/read state
  const Field = ({ label, icon: Icon, value, field, multiline }: {
    label: string; icon: any; value: string; field: string; multiline?: boolean;
  }) => (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea value={(draft as any)[field]} onChange={e => updateDraft(field, e.target.value)} rows={3}
            className="w-full text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20" />
        ) : (
          <Input value={(draft as any)[field]} onChange={e => updateDraft(field, e.target.value)} className="h-9 text-sm" />
        )
      ) : (
        <p className="text-sm text-foreground leading-relaxed">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="w-3.5 h-3.5" /> {showChat ? "Close Chat" : "Talk to Sammy"}
          </Button>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5 text-xs"><X className="w-3.5 h-3.5" /> Cancel</Button>
              <Button size="sm" onClick={handleSaveAll} disabled={saving} className="gap-1.5 text-xs">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save All Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 text-xs">
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Floating chat panel */}
      {showChat && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[500px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <img src={teammateAvatar} alt="Sales Sammy" className="w-7 h-7 rounded-full object-cover" />
              <div><p className="text-sm font-semibold text-foreground">Sales Sammy</p><p className="text-[10px] text-muted-foreground">Tell Sammy how to adjust</p></div>
            </div>
            <button onClick={() => setShowChat(false)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-hidden"><TeammateChat /></div>
        </div>
      )}

      {/* Edit mode banner */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground font-medium">Editing Sammy's profile</p>
            <p className="text-xs text-muted-foreground">Change anything below, then hit "Save All Changes"</p>
          </div>
        </motion.div>
      )}

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          <img src={teammateAvatar} alt="Sales Sammy" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-border shadow-md" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display text-2xl font-bold text-foreground">Sales Sammy</h2>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" /> Online</span>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">{teammate.status} mode</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-2xl">{teammate.persona_prompt?.slice(0, 200)}...</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {teammate.primary_channel}</span>
              {teammate.secondary_channel && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {teammate.secondary_channel}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Goal: {teammate.goal}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center shrink-0">
            <div><p className="text-2xl font-display font-bold text-foreground">{stats?.touches_total?.toLocaleString() || 0}</p><p className="text-[10px] text-muted-foreground">Jobs Done</p></div>
            <div><p className="text-2xl font-display font-bold text-foreground">{stats?.reply_rate || 0}%</p><p className="text-[10px] text-muted-foreground">Reply Rate</p></div>
            <div><p className="text-2xl font-display font-bold text-foreground">{stats?.uptime_percent || 99.9}%</p><p className="text-[10px] text-muted-foreground">Uptime</p></div>
            <div><p className="text-2xl font-display font-bold text-foreground">{stats?.avg_draft_time || "1.2s"}</p><p className="text-[10px] text-muted-foreground">Avg Draft</p></div>
          </div>
        </div>
      </motion.div>

      {/* Performance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Contacts", value: stats?.total_contacts?.toLocaleString() || "0" },
          { label: "Active", value: stats?.active_contacts?.toLocaleString() || "0" },
          { label: "Touches Sent", value: stats?.touches_sent?.toLocaleString() || "0" },
          { label: "Pending", value: stats?.touches_pending?.toLocaleString() || "0" },
          { label: "Replies", value: stats?.replies_received?.toLocaleString() || "0" },
          { label: "Positive", value: stats?.positive_replies?.toLocaleString() || "0" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* All config fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Brain className="w-4 h-4 text-muted-foreground" /> Persona & Identity</h3>
          <Field label="Persona Prompt" icon={Brain} value={teammate.persona_prompt} field="persona_prompt" multiline />
          <Field label="Business Description" icon={Briefcase} value={teammate.business_description} field="business_description" multiline />
          <Field label="Target Audience" icon={User} value={teammate.target_audience} field="target_audience" multiline />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /> Goals & Channels</h3>
          <Field label="Goal" icon={TrendingUp} value={teammate.goal} field="goal" />
          <Field label="Trigger Signals" icon={Award} value={teammate.lead_trigger_signals} field="lead_trigger_signals" multiline />
          <Field label="Lead Source Type" icon={Database} value={teammate.lead_source_type || ""} field="lead_source_type" />

          {/* Channels */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3 h-3" /> Channels
            </label>
            {editing ? (
              <div className="space-y-2">
                {[
                  { label: "Primary", field: "primary_channel" },
                  { label: "Secondary", field: "secondary_channel" },
                  { label: "Tertiary", field: "tertiary_channel" },
                ].map(ch => (
                  <div key={ch.field} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">{ch.label}</span>
                    <select value={(draft as any)[ch.field] || ""} onChange={e => updateDraft(ch.field, e.target.value)}
                      className="flex-1 h-8 text-sm bg-secondary rounded-lg px-2 text-foreground outline-none">
                      <option value="">None</option>
                      {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">{teammate.primary_channel}</span>
                {teammate.secondary_channel && <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs capitalize">{teammate.secondary_channel}</span>}
                {teammate.tertiary_channel && <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs capitalize">{teammate.tertiary_channel}</span>}
              </div>
            )}
          </div>

          <Field label="Escalation Contact" icon={User} value={typeof teammate.escalation_contact === "string" ? teammate.escalation_contact : JSON.stringify(teammate.escalation_contact)} field="escalation_contact" />
        </motion.div>
      </div>

      {/* Voice Samples */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-muted-foreground" /> Voice Samples</h3>
        {editing ? (
          <div className="space-y-2">
            {draft.voice_examples.map((v, i) => (
              <div key={i} className="flex gap-2">
                <textarea value={v} onChange={e => { const n = [...draft.voice_examples]; n[i] = e.target.value; updateDraft("voice_examples", n); }} rows={2}
                  className="flex-1 text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20" />
                <button onClick={() => updateDraft("voice_examples", draft.voice_examples.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <textarea value={newVoice} onChange={e => setNewVoice(e.target.value)} placeholder="Paste a message that worked well..." rows={2}
                className="flex-1 text-sm bg-secondary rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={() => { if (newVoice.trim()) { updateDraft("voice_examples", [...draft.voice_examples, newVoice.trim()]); setNewVoice(""); } }} className="text-primary hover:text-primary/80 shrink-0"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {draft.voice_examples.map((v, i) => (
              <div key={i} className="bg-secondary rounded-lg px-3 py-2.5"><p className="text-sm text-foreground leading-relaxed italic">"{v}"</p></div>
            ))}
            {draft.voice_examples.length === 0 && <p className="text-sm text-muted-foreground">No voice samples yet</p>}
          </div>
        )}
      </motion.div>

      {/* Guardrails */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" /> Guardrails</h3>
        {editing ? (
          <div className="space-y-2">
            {draft.guardrails.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={g} onChange={e => { const n = [...draft.guardrails]; n[i] = e.target.value; updateDraft("guardrails", n); }} className="flex-1 h-8 text-sm" />
                <button onClick={() => updateDraft("guardrails", draft.guardrails.filter((_, j) => j !== i))} className="text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input value={newGuardrail} onChange={e => setNewGuardrail(e.target.value)} placeholder="Add a guardrail..." className="flex-1 h-8 text-sm"
                onKeyDown={e => { if (e.key === "Enter" && newGuardrail.trim()) { updateDraft("guardrails", [...draft.guardrails, newGuardrail.trim()]); setNewGuardrail(""); } }} />
              <button onClick={() => { if (newGuardrail.trim()) { updateDraft("guardrails", [...draft.guardrails, newGuardrail.trim()]); setNewGuardrail(""); } }} className="text-primary shrink-0"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {draft.guardrails.map(g => (
              <span key={g} className="px-3 py-1.5 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-destructive">{g}</span>
            ))}
            {draft.guardrails.length === 0 && <p className="text-sm text-muted-foreground">No guardrails set</p>}
          </div>
        )}
      </motion.div>

      {/* Operating Instructions (read-only) */}
      {teammate.operating_instructions && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /> Learned Instructions</h3>
          <p className="text-xs text-muted-foreground mb-2">Accumulated from your chat adjustments</p>
          <div className="bg-secondary rounded-lg px-3 py-2.5"><p className="text-sm text-foreground whitespace-pre-wrap">{teammate.operating_instructions}</p></div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /> Recent Activity</h3>
        <div className="space-y-2">
          {activity.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <CheckCircle2 className={cn("w-4 h-4 shrink-0", a.status === "success" ? "text-success" : a.status === "pending" ? "text-primary" : "text-muted-foreground")} />
              <div className="flex-1 min-w-0"><p className="text-sm text-foreground">{a.action}</p>{a.detail && <p className="text-xs text-muted-foreground truncate">{a.detail}</p>}</div>
              {a.contact_name && <span className="text-[10px] text-muted-foreground">{a.contact_name}</span>}
            </div>
          ))}
          {activity.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default TeammateDetailView;
