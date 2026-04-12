import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, BookOpen, Calendar, Building2, User, Award, BarChart3, Activity, Workflow, TrendingUp, ClipboardList, Briefcase, Database, Mail, MessageSquare, Send, Clock, CheckCircle2, PlayCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import teammateAvatar from "@/assets/agent-sales.jpg";
import { fetchTeammate, fetchContacts, fetchQueue, fetchActivity, type Teammate, type ApiContact, type QueueItem, type ActivityEntry } from "@/services/api";

const ORG_KEY = "vaigence_org_id";

interface TeammateDetailViewProps {
  onBack: () => void;
}

const TeammateDetailView = ({ onBack }: TeammateDetailViewProps) => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [teammate, setTeammate] = useState<Teammate | null>(null);
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      fetchTeammate(orgId).catch(() => null),
      fetchContacts(orgId).catch(() => []),
      fetchQueue(orgId).catch(() => []),
      fetchActivity(orgId, 10).catch(() => []),
    ]).then(([t, c, q, a]) => {
      setTeammate(t);
      setContacts(c);
      setQueue(q);
      setActivity(a);
    }).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-12"><Loader2 className="w-4 h-4 animate-spin" /> Loading teammate...</div>;

  const activeContacts = contacts.filter(c => c.status === "active").length;
  const repliedContacts = contacts.filter(c => c.status === "replied").length;
  const completedContacts = contacts.filter(c => c.status === "completed").length;
  const pendingApprovals = queue.filter(q => q.status === "pending_approval").length;
  const sentTouches = queue.filter(q => q.status === "sent").length;

  const skills = [
    "Lead Research", "Personalized Outreach", "Multi-Channel Follow-Up",
    "Trigger Detection", "Voice Matching", "Reply Classification",
    "Meeting Booking", "Sequence Management", "CRM Logging",
  ];

  const processes = [
    {
      name: "Follow-Up Sequence",
      steps: ["Detect trigger", "Research lead", "Draft message", "Queue for approval", "Send & log"],
      frequency: "Every 30 minutes",
      status: "optimized" as const,
    },
    {
      name: "Reply Handling",
      steps: ["Detect reply", "Classify intent", "Draft response or escalate", "Await approval"],
      frequency: "Real-time",
      status: "optimized" as const,
    },
    {
      name: "Lead Intake",
      steps: ["Import from source", "Assign sequence", "Schedule first touch", "Activate"],
      frequency: "On import",
      status: "new" as const,
    },
  ];

  const sequences = [
    { name: "Cold Outbound", touches: 5, days: 18, desc: "B2B sales, recruiting, agencies" },
    { name: "Abandoned Cart", touches: 3, days: 5, desc: "E-commerce, DTC" },
    { name: "Inbound Lead", touches: 4, days: 10, desc: "Real estate, services, demos" },
    { name: "Re-engagement", touches: 3, days: 14, desc: "Dormant leads, any business" },
    { name: "Post-Meeting", touches: 4, days: 21, desc: "B2B AE, services" },
  ];

  const channels = [
    { name: "Email (Gmail)", type: "Primary", status: "connected" as const },
    { name: "WhatsApp", type: "Secondary", status: "connected" as const },
    { name: "LinkedIn DM", type: "Planned", status: "syncing" as const },
    { name: "SMS (Twilio)", type: "Planned", status: "syncing" as const },
  ];

  const processStatusColors = {
    optimized: "text-success bg-success/10",
    "needs-review": "text-warning bg-warning/10",
    new: "text-info bg-info/10",
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          <img src={teammateAvatar} alt="Teammate" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-border shadow-md" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display text-2xl font-bold text-foreground">Follow-Up Teammate</h2>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" /> Online
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">AI Follow-Up Specialist</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-2xl">
              {teammate?.persona_prompt?.slice(0, 200) || "Researches your leads, drafts personalized follow-ups, and keeps your pipeline warm. Works 24/7, never forgets, always on-brand."}...
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {teammate?.primary_channel || "email"}</span>
              {teammate?.secondary_channel && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {teammate.secondary_channel}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Hired today</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center shrink-0">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{contacts.length}</p>
              <p className="text-[10px] text-muted-foreground">Contacts</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{sentTouches}</p>
              <p className="text-[10px] text-muted-foreground">Sent</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-success">{repliedContacts}</p>
              <p className="text-[10px] text-muted-foreground">Replies</p>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1"><Brain className="w-3 h-3" /> Autonomy Progress</span>
              <span className="text-foreground font-medium">Shadow Mode</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: "15%" }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Pipeline Progress</span>
              <span className="text-foreground font-medium">{activeContacts} active / {contacts.length} total</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-agent-sales transition-all duration-1000" style={{ width: contacts.length > 0 ? `${(activeContacts / contacts.length) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /> Performance Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Active Sequences</p>
            <p className="text-xl font-display font-bold text-foreground">{activeContacts}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Pending Approval</p>
            <p className="text-xl font-display font-bold text-foreground">{pendingApprovals}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-xl font-display font-bold text-success">{completedContacts}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Reply Rate</p>
            <p className="text-xl font-display font-bold text-foreground">
              {contacts.length > 0 ? Math.round((repliedContacts / contacts.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Sequences */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /> Sequence Templates ({sequences.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sequences.map((seq) => (
            <div key={seq.name} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-foreground">{seq.name}</h4>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">{seq.touches} touches · {seq.days} days</span>
              </div>
              <p className="text-xs text-muted-foreground">{seq.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skills */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-secondary-foreground">{s}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-muted-foreground" /> Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {["Email Outreach", "WhatsApp Messaging", "Lead Research", "Voice Matching", "Multi-Channel Sync"].map((c) => (
              <span key={c} className="px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-medium text-primary">{c}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Channels */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-muted-foreground" /> Connected Channels ({channels.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {channels.map((ch) => (
            <div key={ch.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary">
              <div>
                <p className="text-xs font-medium text-foreground">{ch.name}</p>
                <p className="text-[10px] text-muted-foreground">{ch.type}</p>
              </div>
              <span className={cn("w-2 h-2 rounded-full", ch.status === "connected" ? "bg-success" : "bg-warning animate-pulse")} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Processes */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Workflow className="w-4 h-4 text-muted-foreground" /> Processes ({processes.length})</h3>
        <div className="space-y-3">
          {processes.map((process) => (
            <div key={process.name} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-semibold text-foreground">{process.name}</h4>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", processStatusColors[process.status])}>
                    {process.status === "optimized" ? "Working Well" : "New"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{process.frequency}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {process.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs bg-secondary px-2.5 py-1 rounded-md text-secondary-foreground">{step}</span>
                    {i < process.steps.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /> Recent Activity</h3>
        <div className="space-y-2">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <CheckCircle2 className={cn("w-4 h-4 shrink-0",
                a.status === "success" ? "text-success" : a.status === "pending" ? "text-primary" : a.status === "warning" ? "text-warning" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{a.action}</p>
                {a.detail && <p className="text-xs text-muted-foreground truncate">{a.detail}</p>}
              </div>
              {a.contact_name && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.contact_name}</span>}
            </div>
          ))}
          {activity.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default TeammateDetailView;
