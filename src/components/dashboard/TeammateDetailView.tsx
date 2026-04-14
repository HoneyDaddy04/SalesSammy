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
  goal: string;
  voice_examples: string;
  guardrails: string;
  escalation_contact: string;
  persona_prompt: string;
  operating_instructions: string;
  primary_channel: string;
  secondary_channel: string | null;
  status: string;
}

const TeammateDetailView = () => {
  const navigate = useNavigate();
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [teammate, setTeammate] = useState<TeammateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Editable state
  const [editPersona, setEditPersona] = useState("");
  const [editGuardrails, setEditGuardrails] = useState<string[]>([]);
  const [editVoice, setEditVoice] = useState<string[]>([]);
  const [editEscalation, setEditEscalation] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editTriggers, setEditTriggers] = useState("");
  const [newGuardrail, setNewGuardrail] = useState("");
  const [newVoice, setNewVoice] = useState("");

  const [contacts, setContacts] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [tRes, cRes, aRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/api/teammate?org_id=${orgId}`).then(r => r.json()),
        fetch(`${API_BASE}/api/contacts?org_id=${orgId}`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/activity?org_id=${orgId}&limit=8`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/teammate/stats?org_id=${orgId}`).then(r => r.json()).catch(() => null),
      ]);
      setTeammate(tRes);
      setContacts(cRes);
      setActivity(aRes);
      setStats(sRes);

      // Init edit states
      setEditPersona(tRes.persona_prompt || "");
      setEditGuardrails(JSON.parse(tRes.guardrails || "[]"));
      setEditVoice(JSON.parse(tRes.voice_examples || "[]"));
      setEditEscalation(typeof tRes.escalation_contact === "string" ? tRes.escalation_contact : JSON.stringify(tRes.escalation_contact));
      setEditGoal(tRes.goal || "");
      setEditTriggers(tRes.lead_trigger_signals || "");
    } catch (err) { toast.error("Failed to load teammate data"); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [orgId]);

  const saveField = async (field: string, value: unknown) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/teammate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, [field]: value }),
      });
      setEditingSection(null);
      await loadData();
      toast.success("Changes saved");
    } catch (err) { toast.error("Failed to save changes"); } finally { setSaving(false); }
  };

  const [showChat, setShowChat] = useState(false);

  if (loading) return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-5 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2"><div className="h-6 w-40 rounded bg-muted" /><div className="h-4 w-64 rounded bg-muted" /></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse space-y-2">
            <div className="h-3 w-20 rounded bg-muted" /><div className="h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-muted" /><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
  if (!teammate) return <div className="text-muted-foreground">Sammy is not configured yet.</div>;

  const activeContacts = contacts.filter((c: any) => c.status === "active").length;
  const repliedContacts = contacts.filter((c: any) => c.status === "replied").length;

  const EditableSection = ({ title, icon: Icon, field, children, onSave }: { title: string; icon: any; field: string; children: React.ReactNode; onSave: () => void }) => {
    const isEditing = editingSection === field;
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" /> {title}</h3>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)} aria-label="Cancel" className="h-7 text-xs"><X className="w-3 h-3" /></Button>
              <Button size="sm" onClick={onSave} disabled={saving} className="h-7 text-xs gap-1">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save</Button>
            </div>
          ) : (
            <button onClick={() => setEditingSection(field)} className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
          )}
        </div>
        {children}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowChat(!showChat)}>
          <MessageSquare className="w-3.5 h-3.5" /> {showChat ? "Close Chat" : "Talk to Sammy"}
        </Button>
      </div>

      {/* Floating chat panel */}
      {showChat && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[500px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <img src={teammateAvatar} alt="Sales Sammy" className="w-7 h-7 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">Sales Sammy</p>
                <p className="text-[10px] text-muted-foreground">Tell Sammy how to adjust</p>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} aria-label="Close chat" className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TeammateChat />
          </div>
        </div>
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
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5"><span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Reply Rate</span><span className="text-foreground font-medium">{stats?.reply_rate || 0}%</span></div>
            <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-success" style={{ width: `${Math.min(stats?.reply_rate || 0, 100)}%` }} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5"><span className="text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Pending Approval</span><span className="text-foreground font-medium">{stats?.touches_pending || 0} drafts</span></div>
            <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-warning" style={{ width: (stats?.touches_pending || 0) > 0 ? `${Math.min(((stats?.touches_pending || 0) / Math.max((stats?.touches_sent || 0) + (stats?.touches_pending || 0), 1)) * 100, 100)}%` : "0%" }} /></div>
          </div>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /> Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Contacts", value: stats?.total_contacts?.toLocaleString() || "0" },
            { label: "Active", value: stats?.active_contacts?.toLocaleString() || "0" },
            { label: "Touches Sent", value: stats?.touches_sent?.toLocaleString() || "0" },
            { label: "Pending", value: stats?.touches_pending?.toLocaleString() || "0" },
            { label: "Replies", value: stats?.replies_received?.toLocaleString() || "0" },
            { label: "Positive", value: stats?.positive_replies?.toLocaleString() || "0" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skills */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-muted-foreground" /> Skills</h3>
          <div className="flex flex-wrap gap-2">
            {["Lead Research", "Personalized Outreach", "Multi-Channel Follow-Up", "Trigger Detection", "Voice Matching", "Reply Classification", "Objection Handling", "Meeting Booking", "CRM Logging"].map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-secondary-foreground">{s}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {[
              `Email (${teammate.primary_channel === "email" ? "primary" : "secondary"})`,
              teammate.secondary_channel ? `${teammate.secondary_channel.charAt(0).toUpperCase() + teammate.secondary_channel.slice(1)} (secondary)` : null,
              "Sequence Management", "Shadow Mode", "Voice Calibration", "Context-Aware Drafting",
            ].filter(Boolean).map((c) => (
              <span key={c} className="px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-medium text-primary">{c}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Editable Persona */}
      <EditableSection title="Persona" icon={Brain} field="persona" onSave={() => saveField("persona_prompt", editPersona)}>
        {editingSection === "persona" ? (
          <textarea value={editPersona} onChange={(e) => setEditPersona(e.target.value)} rows={5}
            className="w-full text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none resize-none" />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{teammate.persona_prompt}</p>
        )}
      </EditableSection>

      {/* Editable Goal & Triggers */}
      <EditableSection title="Goal & Triggers" icon={TrendingUp} field="goal" onSave={async () => { await saveField("goal", editGoal); await saveField("lead_trigger_signals", editTriggers); }}>
        {editingSection === "goal" ? (
          <div className="space-y-3">
            <div><label className="text-[10px] text-muted-foreground">Goal</label><Input value={editGoal} onChange={(e) => setEditGoal(e.target.value)} className="mt-1" /></div>
            <div><label className="text-[10px] text-muted-foreground">Trigger signals</label><textarea value={editTriggers} onChange={(e) => setEditTriggers(e.target.value)} rows={2} className="w-full mt-1 text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none resize-none" /></div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Goal:</span> {teammate.goal}</p>
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Triggers:</span> {teammate.lead_trigger_signals}</p>
          </div>
        )}
      </EditableSection>

      {/* Editable Voice Samples */}
      <EditableSection title="Voice Samples" icon={MessageSquare} field="voice" onSave={() => saveField("voice_examples", editVoice)}>
        {editingSection === "voice" ? (
          <div className="space-y-2">
            {editVoice.map((v, i) => (
              <div key={i} className="flex gap-2">
                <textarea value={v} onChange={(e) => { const n = [...editVoice]; n[i] = e.target.value; setEditVoice(n); }} rows={2}
                  className="flex-1 text-sm bg-secondary rounded-lg px-3 py-2 text-foreground outline-none resize-none" />
                <button onClick={() => setEditVoice(editVoice.filter((_, j) => j !== i))} aria-label="Delete voice sample" className="text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <textarea value={newVoice} onChange={(e) => setNewVoice(e.target.value)} placeholder="Paste a message that worked well..." rows={2}
                className="flex-1 text-sm bg-secondary rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none resize-none" />
              <button onClick={() => { if (newVoice.trim()) { setEditVoice([...editVoice, newVoice.trim()]); setNewVoice(""); } }} aria-label="Add voice sample" className="text-primary hover:text-primary/80"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(JSON.parse(teammate.voice_examples || "[]") as string[]).map((v, i) => (
              <div key={i} className="bg-secondary rounded-lg px-3 py-2.5"><p className="text-sm text-foreground leading-relaxed">"{v}"</p></div>
            ))}
            {JSON.parse(teammate.voice_examples || "[]").length === 0 && <p className="text-sm text-muted-foreground">No voice samples yet</p>}
          </div>
        )}
      </EditableSection>

      {/* Editable Guardrails */}
      <EditableSection title="Guardrails" icon={Shield} field="guardrails" onSave={() => saveField("guardrails", editGuardrails)}>
        {editingSection === "guardrails" ? (
          <div className="space-y-2">
            {editGuardrails.map((g, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={g} onChange={(e) => { const n = [...editGuardrails]; n[i] = e.target.value; setEditGuardrails(n); }} className="flex-1 h-8 text-sm" />
                <button onClick={() => setEditGuardrails(editGuardrails.filter((_, j) => j !== i))} aria-label="Delete guardrail" className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input value={newGuardrail} onChange={(e) => setNewGuardrail(e.target.value)} placeholder="Add a guardrail..." className="flex-1 h-8 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && newGuardrail.trim()) { setEditGuardrails([...editGuardrails, newGuardrail.trim()]); setNewGuardrail(""); } }} />
              <button onClick={() => { if (newGuardrail.trim()) { setEditGuardrails([...editGuardrails, newGuardrail.trim()]); setNewGuardrail(""); } }} aria-label="Add guardrail" className="text-primary"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {editGuardrails.map((g) => (
              <span key={g} className="px-3 py-1.5 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-destructive">{g}</span>
            ))}
            {editGuardrails.length === 0 && <p className="text-sm text-muted-foreground">No guardrails set</p>}
          </div>
        )}
      </EditableSection>

      {/* Operating Instructions */}
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
