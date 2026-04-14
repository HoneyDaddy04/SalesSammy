import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, Linkedin, Globe, Building2, User, Tag, StickyNote,
  Clock, Send, MessageCircle, ArrowUpRight, ArrowDownLeft, Pause, Play, Trash2,
  Edit3, Check, X, Plus, Briefcase, Users, TrendingUp, Calendar, ExternalLink,
  Hash, Bell, BarChart3, ChevronRight, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, ORG_KEY, STATUS_COLORS, STATUS_LABELS, CHANNEL_CONFIG } from "@/lib/constants";
import { DEMO_ORG_ID, demoContacts } from "@/lib/demo-data";

interface ContactDetailViewProps {
  contactId: string;
  onBack: () => void;
  onRefresh?: () => void;
}

const statusColors = STATUS_COLORS;
const statusLabels = STATUS_LABELS;

const sourceIcons: Record<string, { label: string; color: string }> = {
  csv: { label: "CSV Import", color: "bg-blue-500/10 text-blue-500" },
  manual: { label: "Manual", color: "bg-purple-500/10 text-purple-500" },
  webhook: { label: "Web Form", color: "bg-green-500/10 text-green-500" },
  hubspot: { label: "HubSpot", color: "bg-orange-500/10 text-orange-500" },
  google_sheets: { label: "Google Sheets", color: "bg-emerald-500/10 text-emerald-500" },
  import: { label: "Imported", color: "bg-blue-500/10 text-blue-500" },
};

const channelConfig = CHANNEL_CONFIG;

const ContactDetailView = ({ contactId, onBack, onRefresh }: ContactDetailViewProps) => {
  const [detail, setDetail] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "notes">("overview");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const orgId = localStorage.getItem(ORG_KEY) || "";

  const buildDemoDetail = () => {
    const c = demoContacts.find(c => c.id === contactId);
    if (!c) return null;
    return {
      contact: c,
      touchStats: { total_touches: c.touch_index + 1, sent: c.touch_index, pending: 1 },
      replyStats: { total_replies: c.status === "replied" ? 2 : c.status === "converted" ? 3 : 0, positive: c.status === "converted" ? 2 : c.status === "replied" ? 1 : 0, questions: 1, objections: 0 },
      activity: [
        { id: "da-1", action: `Drafted message for ${c.name}`, detail: `Touch ${c.touch_index + 1} of ${c.sequence_name}`, status: "success", created_at: c.updated_at },
        ...(c.touch_index > 0 ? [{ id: "da-2", action: `Sent follow-up to ${c.name}`, detail: `Via ${c.available_channels.split(",")[0]}`, status: "success", created_at: c.last_touch_at || c.created_at }] : []),
        { id: "da-3", action: `Researched ${c.company}`, detail: "Company info, role, recent activity", status: "info", created_at: c.created_at },
      ],
    };
  };

  const loadData = async () => {
    setLoading(true);

    if (orgId === DEMO_ORG_ID) {
      const demo = buildDemoDetail();
      if (demo) {
        setDetail(demo);
        setThread({ contact: demo.contact, timeline: [] });
      }
      setLoading(false);
      return;
    }

    try {
      const [detailRes, threadRes] = await Promise.all([
        fetch(`${API_BASE}/api/contacts/${contactId}`).then(r => r.json()),
        fetch(`${API_BASE}/api/contacts/${contactId}/thread`).then(r => r.json()),
      ]);
      setDetail(detailRes);
      setThread(threadRes);
    } catch (err) {
      // Fallback to demo data
      const demo = buildDemoDetail();
      if (demo) {
        setDetail(demo);
        setThread({ contact: demo.contact, timeline: [] });
      } else {
        toast.error("Failed to load contact details");
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [contactId]);

  if (loading || !detail) {
    return (
      <div className="space-y-6 py-4 animate-pulse">
        <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-5 w-40 rounded bg-muted" /><div className="h-4 w-56 rounded bg-muted" /></div></div>
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2"><div className="h-3 w-16 rounded bg-muted" /><div className="h-6 w-12 rounded bg-muted" /></div>))}</div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3"><div className="h-4 w-32 rounded bg-muted" /><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-2/3 rounded bg-muted" /></div>
      </div>
    );
  }

  const contact = detail.contact;
  const touchStats = detail.touchStats || {};
  const replyStats = detail.replyStats || {};
  const tags: string[] = (() => { try { return JSON.parse(contact.tags || "[]"); } catch { return []; } })();
  const channels: string[] = (() => { try { return JSON.parse(contact.available_channels || "[]"); } catch { return []; } })();
  const meta = (() => { try { return JSON.parse(contact.metadata || "{}"); } catch { return {}; } })();

  const handleSave = async () => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      setEditing(false);
      setEditData({});
      await loadData();
      onRefresh?.();
      toast.success("Contact saved");
    } catch (err) { toast.error("Failed to save contact"); } finally { setActionLoading(false); }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/api/contacts/${contactId}/pause`, { method: "POST" });
      await loadData(); onRefresh?.();
      toast.success("Contact paused");
    } catch (err) { toast.error("Failed to pause contact"); } finally { setActionLoading(false); }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/api/contacts/${contactId}/resume`, { method: "POST" });
      await loadData(); onRefresh?.();
      toast.success("Contact resumed");
    } catch (err) { toast.error("Failed to resume contact"); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/api/contacts/${contactId}`, { method: "DELETE" });
      toast.success("Contact deleted");
      onBack();
    } catch (err) { toast.error("Failed to delete contact"); } finally { setActionLoading(false); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await fetch(`${API_BASE}/api/contacts/${contactId}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      setNewNote("");
      await loadData();
      toast.success("Note added");
    } catch (err) { toast.error("Failed to add note"); }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    try {
      await fetch(`${API_BASE}/api/contacts/${contactId}/tag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: newTag.trim().toLowerCase() }),
      });
      setNewTag("");
      await loadData();
      toast.success("Tag added");
    } catch (err) { toast.error("Failed to add tag"); }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await fetch(`${API_BASE}/api/contacts/${contactId}/tag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: tag }),
      });
      await loadData();
    } catch (err) { toast.error("Failed to remove tag"); }
  };

  const scoreColor = contact.lead_score >= 70 ? "text-success" : contact.lead_score >= 40 ? "text-warning" : "text-muted-foreground";
  const sourceInfo = sourceIcons[contact.source] || { label: contact.source, color: "bg-secondary text-muted-foreground" };
  const addedDate = new Date(contact.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const updatedDate = contact.updated_at ? new Date(contact.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to leads
      </button>

      {/* Header Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-xl font-bold text-foreground">{contact.name}</h1>
                <span className={cn("text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium",
                  contact.status === "active" ? "bg-primary/10 text-primary" :
                  contact.status === "replied" ? "bg-success/10 text-success" :
                  contact.status === "converted" ? "bg-emerald-500/10 text-emerald-600" :
                  contact.status === "paused" ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusColors[contact.status])} />
                  {statusLabels[contact.status]}
                </span>
              </div>
              {contact.role && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> {contact.role}
                  {contact.company && <><span className="text-border">at</span> <span className="text-foreground font-medium">{contact.company}</span></>}
                </p>
              )}
              {!contact.role && contact.company && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {contact.company}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", sourceInfo.color)}>
                  {sourceInfo.label}
                </span>
                {contact.source_detail && (
                  <span className="text-[10px] text-muted-foreground">{contact.source_detail}</span>
                )}
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Added {addedDate}
                </span>
                {updatedDate && (
                  <span className="text-[10px] text-muted-foreground">Updated {updatedDate}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => { setEditing(true); setEditData({ name: contact.name, email: contact.email, phone: contact.phone, company: contact.company, role: contact.role, linkedin: contact.linkedin, website: contact.website, industry: contact.industry, company_size: contact.company_size }); }} className="gap-1.5 text-xs">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={handleSave} disabled={actionLoading} className="gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5" /> Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditData({}); }} className="text-xs">Cancel</Button>
              </>
            )}
            {contact.status === "active" && (
              <Button variant="outline" size="sm" onClick={handlePause} disabled={actionLoading} className="gap-1.5 text-xs">
                <Pause className="w-3.5 h-3.5" /> Pause
              </Button>
            )}
            {contact.status === "paused" && (
              <Button variant="outline" size="sm" onClick={handleResume} disabled={actionLoading} className="gap-1.5 text-xs">
                <Play className="w-3.5 h-3.5" /> Resume
              </Button>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Name</label><Input value={editData.name || ""} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Email</label><Input value={editData.email || ""} onChange={e => setEditData({ ...editData, email: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Phone</label><Input value={editData.phone || ""} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Company</label><Input value={editData.company || ""} onChange={e => setEditData({ ...editData, company: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Role</label><Input value={editData.role || ""} onChange={e => setEditData({ ...editData, role: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">LinkedIn</label><Input value={editData.linkedin || ""} onChange={e => setEditData({ ...editData, linkedin: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Website</label><Input value={editData.website || ""} onChange={e => setEditData({ ...editData, website: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Industry</label><Input value={editData.industry || ""} onChange={e => setEditData({ ...editData, industry: e.target.value })} className="h-8 text-sm" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Company Size</label>
                <select value={editData.company_size || ""} onChange={e => setEditData({ ...editData, company_size: e.target.value })} className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select...</option>
                  <option value="1-5">1-5</option><option value="5-10">5-10</option><option value="10-25">10-25</option>
                  <option value="25-50">25-50</option><option value="50-100">50-100</option><option value="100+">100+</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Lead Score", value: `${contact.lead_score}/100`, icon: TrendingUp, color: scoreColor },
          { label: "Touches Sent", value: touchStats.sent || 0, icon: Send, color: "text-primary" },
          { label: "Pending", value: touchStats.pending || 0, icon: Clock, color: "text-warning" },
          { label: "Replies", value: replyStats.total_replies || 0, icon: ArrowDownLeft, color: "text-success" },
          { label: "Positive", value: replyStats.positive || 0, icon: TrendingUp, color: "text-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className={cn("text-xl font-bold font-display", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Contact Info + Intel */}
        <div className="space-y-4">
          {/* Contact Channels */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Contact Channels</h3>
            <div className="space-y-2.5">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-foreground flex-1 truncate">{contact.email}</span>
                  {channels.includes("email") && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-foreground flex-1">{contact.phone}</span>
                  {(channels.includes("sms") || channels.includes("whatsapp")) && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                </div>
              )}
              {contact.linkedin && (
                <div className="flex items-center gap-3">
                  <Linkedin className="w-4 h-4 text-sky-600" />
                  <span className="text-sm text-foreground flex-1 truncate">{contact.linkedin}</span>
                  {channels.includes("linkedin") && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                </div>
              )}
              {!contact.email && !contact.phone && !contact.linkedin && (
                <p className="text-xs text-muted-foreground">No contact channels available</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-2">Available for outreach:</p>
              <div className="flex flex-wrap gap-1.5">
                {channels.map(ch => {
                  const cfg = channelConfig[ch];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  return (
                    <span key={ch} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-secondary">
                      <Icon className={cn("w-3 h-3", cfg.color)} /> {cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Company Intel */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Company Intel</h3>
            <div className="space-y-2.5">
              {contact.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{contact.company}</p>
                    {contact.industry && <p className="text-[10px] text-muted-foreground">{contact.industry}</p>}
                  </div>
                </div>
              )}
              {contact.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-primary truncate">{contact.website}</span>
                </div>
              )}
              {contact.company_size && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{contact.company_size} employees</span>
                </div>
              )}
              {meta.team_size && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Team of {meta.team_size}</span>
                </div>
              )}
              {meta.recent_signal && (
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-warning" />
                  <span className="text-sm text-foreground">{meta.recent_signal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sequence Info */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Sequence</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Template</span>
                <span className="text-sm font-medium text-foreground">{contact.sequence_name || "None"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Touch Progress</span>
                <span className="text-sm font-medium text-foreground">
                  {contact.touch_index + 1} {contact.sequence_touches && `of ${JSON.parse(contact.sequence_touches).length}`}
                </span>
              </div>
              {contact.next_touch_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Touch</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(contact.next_touch_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
              {contact.last_touch_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Touch</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(contact.last_touch_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  <Hash className="w-3 h-3" />{tag}
                  <button onClick={() => handleRemoveTag(tag)} aria-label={`Remove tag ${tag}`} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
            </div>
            <div className="flex items-center gap-2">
              <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag..."
                className="h-7 text-xs flex-1" onKeyDown={e => e.key === "Enter" && handleAddTag()} />
              <Button variant="outline" size="sm" onClick={handleAddTag} aria-label="Add tag" className="h-7 px-2"><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
            <button onClick={handleDelete} disabled={actionLoading}
              className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete this lead permanently
            </button>
          </div>
        </div>

        {/* Right 2/3: Tabs */}
        <div className="col-span-2 space-y-4">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {(["overview", "timeline", "notes"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all",
                  activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {tab === "overview" ? "Activity" : tab === "timeline" ? "Conversation" : "Notes"}
              </button>
            ))}
          </div>

          {/* Activity Tab */}
          {activeTab === "overview" && (
            <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
              {detail.activity?.length > 0 ? detail.activity.map((a: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                    a.status === "success" ? "bg-success" : a.status === "warning" ? "bg-warning" :
                    a.status === "error" ? "bg-destructive" : a.status === "pending" ? "bg-primary" : "bg-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{a.action}</p>
                    {a.detail && <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )) : (
                <div className="px-5 py-12 text-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No activity yet for this contact.</p>
                </div>
              )}
            </div>
          )}

          {/* Conversation Tab */}
          {activeTab === "timeline" && (
            <div className="rounded-xl border border-border bg-card shadow-sm p-5 max-h-[calc(100vh-22rem)] overflow-y-auto space-y-4">
              {thread?.timeline?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No messages yet. Your teammate will draft the first touch when it's due.</p>
                </div>
              )}
              {thread?.timeline?.map((item: any, i: number) => {
                const isSent = item.type === "touch";
                const isReply = item.type === "reply";
                return (
                  <div key={i} className={cn("flex gap-3", isSent ? "justify-end" : "justify-start")}>
                    {isReply && (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                        {contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                    )}
                    <div className="max-w-[80%] space-y-1">
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                        isSent ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"
                      )}>
                        {item.drafted_content || item.content}
                      </div>
                      <div className={cn("flex items-center gap-2 text-[9px] text-muted-foreground", isSent ? "justify-end" : "")}>
                        {isSent && (
                          <>
                            <span className="flex items-center gap-1"><ArrowUpRight className="w-2.5 h-2.5 text-primary" /> Sent</span>
                            <span>{item.angle?.replace(/_/g, " ")} &middot; Touch {(item.touch_index || 0) + 1}</span>
                          </>
                        )}
                        {isReply && (
                          <>
                            <span className="flex items-center gap-1"><ArrowDownLeft className="w-2.5 h-2.5 text-success" /> Received</span>
                            <span>{item.classification || "reply"}</span>
                          </>
                        )}
                        <span className="opacity-60">
                          {new Date(item.sent_at || item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    {isSent && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {(() => { const cfg = channelConfig[item.channel]; return cfg ? <cfg.icon className={cn("w-3.5 h-3.5", cfg.color)} /> : <Send className="w-3.5 h-3.5 text-primary" />; })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note about this lead..."
                    rows={3}
                    className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none" />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()} className="gap-1.5 text-xs">
                    <StickyNote className="w-3.5 h-3.5" /> Add Note
                  </Button>
                </div>
              </div>
              {contact.notes ? (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{contact.notes}</pre>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-center text-muted-foreground">
                  <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notes yet. Add your first note above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContactDetailView;
