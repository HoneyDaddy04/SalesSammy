import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Mail, Loader2, Plus, Upload, Search, X, MessageCircle, Phone, Linkedin,
  Send, Filter, ArrowUpDown, Hash, Building2, Globe, Briefcase, Calendar,
  ChevronRight, TrendingUp, Webhook, FileSpreadsheet, Database, Bell, Eye, Clock, Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContactDetailView from "./ContactDetailView";
import { API_BASE, ORG_KEY, STATUS_COLORS, STATUS_LABELS, CHANNEL_CONFIG } from "@/lib/constants";
import { DEMO_ORG_ID, demoContacts } from "@/lib/demo-data";

interface Contact {
  id: string; name: string; email: string; phone: string | null; company: string;
  role: string | null; linkedin: string | null; website: string | null;
  industry: string | null; company_size: string | null; tags: string;
  lead_score: number; source: string; source_detail: string | null;
  status: string; touch_index: number; next_touch_at: string | null;
  last_touch_at: string | null; sequence_name: string; available_channels: string;
  metadata: string; created_at: string; updated_at: string;
}

const statusColors = STATUS_COLORS;
const statusLabels = STATUS_LABELS;

const sourceConfig: Record<string, { icon: typeof Upload; label: string; color: string }> = {
  csv: { icon: FileSpreadsheet, label: "CSV", color: "text-blue-500" },
  manual: { icon: Plus, label: "Manual", color: "text-purple-500" },
  webhook: { icon: Webhook, label: "Webhook", color: "text-green-500" },
  hubspot: { icon: Database, label: "HubSpot", color: "text-orange-500" },
  google_sheets: { icon: FileSpreadsheet, label: "Sheets", color: "text-emerald-500" },
  import: { icon: Upload, label: "Import", color: "text-blue-500" },
};

const channelIcons = CHANNEL_CONFIG;

const sortOptions = [
  { value: "next_touch", label: "Next Touch" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "score", label: "Lead Score" },
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "last_activity", label: "Last Activity" },
];

const ThreadsView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("next_touch");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Add/Import state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<"manual" | "csv" | "webhook" | "crm">("manual");
  const [importing, setImporting] = useState(false);

  // Manual add fields
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", company: "", role: "", linkedin: "", website: "", industry: "", company_size: "", tags: "" });
  // CSV import
  const [importText, setImportText] = useState("");

  const loadContacts = async () => {
    if (!orgId) return;
    if (orgId === DEMO_ORG_ID) {
      let filtered = [...demoContacts] as Contact[];
      if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter);
      if (sourceFilter) filtered = filtered.filter(c => c.source === sourceFilter);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
      }
      setContacts(filtered);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ org_id: orgId, sort: sortBy });
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (search) params.set("search", search);
      const res = await fetch(`${API_BASE}/api/contacts?${params.toString()}`);
      const data = await res.json();
      setContacts(Array.isArray(data) && data.length ? data : demoContacts as Contact[]);
    } catch (err) { setContacts(demoContacts as Contact[]); } finally { setLoading(false); }
  };

  useEffect(() => { loadContacts(); }, [orgId, statusFilter, sourceFilter, sortBy]);

  // Escape key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddModal) setShowAddModal(false);
        else if (selectedContactId) setSelectedContactId(null);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showAddModal, selectedContactId]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { loadContacts(); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleImportCSV = async () => {
    setImporting(true);
    try {
      const lines = importText.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const parsed = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      }).filter(c => c.name || c.email);

      await fetch(`${API_BASE}/api/contacts/import`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, contacts: parsed, source: "csv" }),
      });
      setShowAddModal(false); setImportText("");
      await loadContacts();
      toast.success("Contacts imported from CSV");
    } catch (err) { toast.error("Failed to import CSV"); } finally { setImporting(false); }
  };

  const handleAddManual = async () => {
    if (!addForm.name && !addForm.email) return;
    setImporting(true);
    try {
      const contact = {
        ...addForm,
        tags: addForm.tags ? addForm.tags.split(",").map(t => t.trim()) : [],
      };
      await fetch(`${API_BASE}/api/contacts/import`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, contacts: [contact], source: "manual" }),
      });
      setShowAddModal(false);
      setAddForm({ name: "", email: "", phone: "", company: "", role: "", linkedin: "", website: "", industry: "", company_size: "", tags: "" });
      await loadContacts();
      toast.success("Contact added");
    } catch (err) { toast.error("Failed to add contact"); } finally { setImporting(false); }
  };

  // If a contact is selected, show the detail view
  if (selectedContactId) {
    return (
      <ContactDetailView
        contactId={selectedContactId}
        onBack={() => { setSelectedContactId(null); loadContacts(); }}
        onRefresh={loadContacts}
      />
    );
  }

  // Convert raw score (0-65) to percentage and color
  const scorePercent = (raw: number) => Math.min(100, Math.round((raw / 65) * 100));
  const scoreColor = (raw: number) => { const p = scorePercent(raw); return p >= 70 ? "text-success" : p >= 40 ? "text-warning" : "text-muted-foreground"; };

  const statusCounts = contacts.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const sourceCounts = contacts.reduce((acc, c) => { acc[c.source] = (acc[c.source] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {contacts.length} lead{contacts.length !== 1 ? "s" : ""} in pipeline
            {statusCounts.active ? ` \u00b7 ${statusCounts.active} active` : ""}
            {statusCounts.replied ? ` \u00b7 ${statusCounts.replied} replied` : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Leads
        </Button>
      </div>

      {/* Add/Import Modal */}
      {showAddModal && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          role="dialog" aria-modal="true" aria-label="Add Leads"
          className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Add Leads</h3>
            <button onClick={() => setShowAddModal(false)} aria-label="Close"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Source Tabs */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 mb-5">
            {([
              { key: "manual" as const, label: "Manual", icon: Plus },
              { key: "csv" as const, label: "CSV Import", icon: FileSpreadsheet },
              { key: "webhook" as const, label: "Webhook / Form", icon: Webhook },
              { key: "crm" as const, label: "CRM / Sheets", icon: Database },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setAddTab(tab.key)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                  addTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Manual Add */}
          {addTab === "manual" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Name *</label>
                  <Input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="John Doe" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Email *</label>
                  <Input value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="john@company.com" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Phone</label>
                  <Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="+1-555-0123" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Company</label>
                  <Input value={addForm.company} onChange={e => setAddForm({ ...addForm, company: e.target.value })} placeholder="Acme Corp" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Role</label>
                  <Input value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} placeholder="Head of Ops" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">LinkedIn</label>
                  <Input value={addForm.linkedin} onChange={e => setAddForm({ ...addForm, linkedin: e.target.value })} placeholder="linkedin.com/in/johndoe" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Website</label>
                  <Input value={addForm.website} onChange={e => setAddForm({ ...addForm, website: e.target.value })} placeholder="company.com" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Industry</label>
                  <Input value={addForm.industry} onChange={e => setAddForm({ ...addForm, industry: e.target.value })} placeholder="SaaS" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] text-muted-foreground mb-1 block">Company Size</label>
                  <select value={addForm.company_size} onChange={e => setAddForm({ ...addForm, company_size: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select...</option>
                    <option value="1-5">1-5</option><option value="5-10">5-10</option><option value="10-25">10-25</option>
                    <option value="25-50">25-50</option><option value="50-100">50-100</option><option value="100+">100+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                <Input value={addForm.tags} onChange={e => setAddForm({ ...addForm, tags: e.target.value })} placeholder="hot-lead, saas, funded" className="h-9 text-sm" />
              </div>
              <Button size="sm" onClick={handleAddManual} disabled={(!addForm.name && !addForm.email) || importing} className="gap-1.5">
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Lead
              </Button>
            </div>
          )}

          {/* CSV Import */}
          {addTab === "csv" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Paste CSV with headers. Supported columns: <span className="font-mono text-foreground">name, email, phone, company, role, linkedin, website, industry, company_size, tags</span></p>
              <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8}
                placeholder={"name,email,company,role,phone\nJohn Doe,john@acme.com,Acme Corp,Head of Ops,+1-555-0123\nJane Smith,jane@startup.io,StartupIO,CTO,"}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground outline-none resize-none" />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleImportCSV} disabled={!importText.trim() || importing} className="gap-1.5">
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Import
                </Button>
                <span className="text-xs text-muted-foreground">Contacts will be assigned to the default outreach sequence</span>
              </div>
            </div>
          )}

          {/* Webhook */}
          {addTab === "webhook" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs font-medium text-foreground mb-2">Webhook Endpoint</p>
                <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border">
                  <code className="text-xs text-primary flex-1 select-all">{API_BASE}/api/contacts/webhook</code>
                  <Button variant="outline" size="sm" className="h-7 text-[10px]"
                    onClick={() => navigator.clipboard.writeText(`${API_BASE}/api/contacts/webhook`)}>Copy</Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Point your form (Typeform, Webflow, Tally, etc.) to this URL via POST.</p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs font-medium text-foreground mb-2">Example Payload</p>
                <pre className="text-[11px] text-muted-foreground bg-background rounded-lg p-3 overflow-x-auto">{`{
  "source_name": "Website Demo Form",
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "role": "Head of Ops",
  "metadata": { "utm_source": "google", "page": "/pricing" }
}`}</pre>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs font-medium text-foreground mb-2">Features</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><Bell className="w-3 h-3 text-warning" /> Leads auto-assigned to Inbound Lead sequence</li>
                  <li className="flex items-center gap-2"><TrendingUp className="w-3 h-3 text-success" /> Higher initial lead score (inbound = warmer)</li>
                  <li className="flex items-center gap-2"><Clock className="w-3 h-3 text-primary" /> First touch drafted immediately</li>
                </ul>
              </div>
            </div>
          )}

          {/* CRM / Sheets Sync */}
          {addTab === "crm" && (
            <div className="space-y-4">
              {[
                { name: "HubSpot", desc: "Sync contacts from your HubSpot CRM pipelines", icon: Database, color: "text-orange-500", connected: false },
                { name: "Google Sheets", desc: "Pull leads from a connected Google Sheet", icon: FileSpreadsheet, color: "text-emerald-500", connected: true },
                { name: "Salesforce", desc: "Import leads from Salesforce pipelines", icon: Database, color: "text-blue-500", connected: false },
                { name: "Pipedrive", desc: "Sync deals and contacts from Pipedrive", icon: Database, color: "text-green-600", connected: false },
              ].map((crm, i) => {
                const comingSoon = crm.name === "Salesforce" || crm.name === "Pipedrive";
                return (
                  <div key={i} className={cn("flex items-center gap-4 rounded-lg bg-secondary p-4", comingSoon && "opacity-60")}>
                    <crm.icon className={cn("w-8 h-8", crm.color)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{crm.name}</p>
                        {comingSoon && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Coming soon</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{crm.desc}</p>
                    </div>
                    {crm.connected ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-success flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Connected</span>
                        <Button variant="outline" size="sm" className="h-8 text-xs">Sync Now</Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="h-8 text-xs" disabled={comingSoon}>{comingSoon ? "Coming Soon" : "Connect"}</Button>
                    )}
                  </div>
                );
              })}
              <p className="text-[10px] text-muted-foreground">Connected sources sync automatically every 30 minutes. Go to Integrations to manage connections.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Search + Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, company, role..." className="pl-9 h-10" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
          className={cn("gap-1.5 h-10 text-xs", showFilters && "bg-primary/10 text-primary border-primary/20")}>
          <Filter className="w-3.5 h-3.5" /> Filters
        </Button>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-xs">
            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-3 flex-wrap">
          <div>
            <span className="text-[10px] text-muted-foreground mr-2">Status:</span>
            <div className="inline-flex gap-1">
              <button onClick={() => setStatusFilter("")}
                className={cn("text-[10px] px-2.5 py-1 rounded-full transition-colors",
                  !statusFilter ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                All
              </button>
              {Object.entries(statusCounts).map(([s, count]) => (
                <button key={s} onClick={() => setStatusFilter(s === statusFilter ? "" : s)}
                  className={cn("text-[10px] px-2.5 py-1 rounded-full transition-colors flex items-center gap-1",
                    s === statusFilter ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusColors[s])} />
                  {statusLabels[s]} ({count})
                </button>
              ))}
            </div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-[10px] text-muted-foreground mr-2">Source:</span>
            <div className="inline-flex gap-1">
              <button onClick={() => setSourceFilter("")}
                className={cn("text-[10px] px-2.5 py-1 rounded-full transition-colors",
                  !sourceFilter ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                All
              </button>
              {Object.entries(sourceCounts).map(([s, count]) => {
                const cfg = sourceConfig[s];
                return (
                  <button key={s} onClick={() => setSourceFilter(s === sourceFilter ? "" : s)}
                    className={cn("text-[10px] px-2.5 py-1 rounded-full transition-colors flex items-center gap-1",
                      s === sourceFilter ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    {cfg?.label || s} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          {(statusFilter || sourceFilter) && (
            <button onClick={() => { setStatusFilter(""); setSourceFilter(""); }}
              className="text-[10px] text-destructive hover:text-destructive/80 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* Leads Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-3 bg-secondary/50 border-b border-border grid grid-cols-12 gap-4 items-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          <div className="col-span-3">Contact</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-1 flex items-center gap-1 group relative">
            Score
            <span className="relative">
              <Info className="w-3 h-3 text-muted-foreground/50 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-lg bg-foreground text-background text-[10px] leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                <strong className="block mb-1">How lead score works</strong>
                Based on data completeness: email (+23%), phone (+15%), company (+15%), LinkedIn (+8%), role (+8%). Inbound leads start higher. Score updates as Sammy learns more.
              </span>
            </span>
          </div>
          <div className="col-span-1">Source</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Channels</div>
          <div className="col-span-2">Sequence</div>
          <div className="col-span-1">Added</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
                <div className="h-3 w-16 rounded bg-muted shrink-0" />
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{search || statusFilter || sourceFilter ? "No leads match your filters." : "No leads yet. Add leads to get started."}</p>
          </div>
        ) : contacts.map((contact, i) => {
          const tags: string[] = (() => { try { return JSON.parse(contact.tags || "[]"); } catch { return []; } })();
          const channels: string[] = (() => { try { return JSON.parse(contact.available_channels || "[]"); } catch { return []; } })();
          const src = sourceConfig[contact.source];
          const addedDate = new Date(contact.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <motion.div key={contact.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
              onClick={() => setSelectedContactId(contact.id)}
              className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border last:border-b-0 group">

              {/* Contact */}
              <div className="col-span-3 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{contact.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {contact.role && <span className="text-[10px] text-muted-foreground truncate">{contact.role}</span>}
                    {!contact.role && contact.email && <span className="text-[10px] text-muted-foreground truncate">{contact.email}</span>}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                      ))}
                      {tags.length > 2 && <span className="text-[9px] text-muted-foreground">+{tags.length - 2}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Company */}
              <div className="col-span-2 min-w-0">
                {contact.company ? (
                  <div>
                    <p className="text-sm text-foreground truncate">{contact.company}</p>
                    {contact.industry && <p className="text-[10px] text-muted-foreground">{contact.industry}</p>}
                    {contact.company_size && <p className="text-[10px] text-muted-foreground">{contact.company_size} people</p>}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              {/* Score */}
              <div className="col-span-1">
                <span className={cn("text-sm font-bold font-display", scoreColor(contact.lead_score))}>
                  {scorePercent(contact.lead_score)}%
                </span>
              </div>

              {/* Source */}
              <div className="col-span-1">
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                  src ? `bg-secondary` : "bg-secondary text-muted-foreground")}>
                  {src && <src.icon className={cn("w-3 h-3", src.color)} />}
                  <span className="text-muted-foreground">{src?.label || contact.source}</span>
                </span>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                  contact.status === "active" ? "bg-primary/10 text-primary" :
                  contact.status === "replied" ? "bg-success/10 text-success" :
                  contact.status === "paused" ? "bg-warning/10 text-warning" :
                  contact.status === "converted" ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusColors[contact.status])} />
                  {statusLabels[contact.status]}
                </span>
              </div>

              {/* Channels */}
              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  {channels.slice(0, 3).map(ch => {
                    const cfg = channelIcons[ch];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return <Icon key={ch} className={cn("w-3.5 h-3.5", cfg.color)} />;
                  })}
                  {channels.length > 3 && <span className="text-[9px] text-muted-foreground">+{channels.length - 3}</span>}
                </div>
              </div>

              {/* Sequence */}
              <div className="col-span-2 min-w-0">
                <p className="text-xs text-foreground truncate">{contact.sequence_name || "-"}</p>
                <p className="text-[10px] text-muted-foreground">Touch {contact.touch_index + 1}</p>
              </div>

              {/* Added */}
              <div className="col-span-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{addedDate}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreadsView;
