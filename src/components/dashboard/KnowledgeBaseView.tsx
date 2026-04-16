import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Edit3, Trash2, Save, X, Loader2, FileText, Upload, Link2, Type } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";

import { API_BASE, ORG_KEY } from "@/lib/constants";

interface KnowledgeChunk {
  id: string; content: string; source: string; created_at: string;
}

const KnowledgeBaseView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [items, setItems] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSource, setEditSource] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSource, setNewSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [addMode, setAddMode] = useState<"text" | "file" | "url">("text");
  const [newUrl, setNewUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [isPdf, setIsPdf] = useState(false);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge?org_id=${orgId}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) { /* API unreachable — show empty state */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [orgId]);

  // Escape key to close add form
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAdd) { setShowAdd(false); setAddMode("text"); setNewUrl(""); setIsPdf(false); }
        else if (editingId) setEditingId(null);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showAdd, editingId]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/knowledge`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, content: newContent, source: newSource || "manual" }),
      });
      setNewContent(""); setNewSource(""); setShowAdd(false);
      await load();
      toast.success("Knowledge entry added");
    } catch (err) { toast.error("Failed to add knowledge entry"); } finally { setSaving(false); }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/knowledge/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, source: editSource }),
      });
      setEditingId(null);
      await load();
      toast.success("Knowledge entry updated");
    } catch (err) { toast.error("Failed to update knowledge entry"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/knowledge/${id}`, { method: "DELETE" });
      await load();
      toast.success("Knowledge entry deleted");
    } catch (err) { toast.error("Failed to delete knowledge entry"); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2"><div className="h-7 w-48 rounded bg-muted" /><div className="h-4 w-72 rounded bg-muted" /></div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm animate-pulse space-y-3">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted" /><div className="space-y-1"><div className="h-4 w-24 rounded bg-muted" /><div className="h-3 w-32 rounded bg-muted" /></div></div>
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-4/5 rounded bg-muted" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Everything Sammy knows about your business. This context gets used when drafting messages.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Knowledge
        </Button>
      </div>

      {/* What this is for */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
        <p className="text-sm text-foreground font-medium mb-1">How Sammy uses this</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When drafting a follow-up, Sammy searches this knowledge base for relevant info. If a lead asks about pricing, Sammy finds your pricing doc here. If they ask about integrations, she pulls from that. Add anything you want Sammy to know: product details, pricing, FAQs, policies, competitive positioning, common objections and how to handle them.
        </p>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          role="dialog" aria-modal="true" aria-label="Add Knowledge"
          className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground text-sm">Add Knowledge</h3>
            <button onClick={() => setShowAdd(false)} aria-label="Close"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Mode selector */}
          <div className="flex items-center gap-2 mb-4">
            {([
              { mode: "text" as const, icon: Type, label: "Write text" },
              { mode: "file" as const, icon: Upload, label: "Upload file" },
              { mode: "url" as const, icon: Link2, label: "Import URL" },
            ]).map(({ mode, icon: ModeIcon, label }) => (
              <button key={mode} onClick={() => setAddMode(mode)}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                  addMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                )}>
                <ModeIcon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Source label</Label>
              <Input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="e.g. pricing, faq, product-details, objection-handling" className="mt-1 h-9 text-sm" />
            </div>

            {addMode === "text" && (
              <div>
                <Label className="text-xs">Content</Label>
                <div className="mt-1">
                  <RichTextEditor
                    content={newContent}
                    onChange={setNewContent}
                    placeholder="Write or paste the information Sammy should know. Be specific. Example: 'Our Pro plan costs $79/month and includes up to 15 users, unlimited projects, and priority support.'"
                  />
                </div>
              </div>
            )}

            {addMode === "file" && (
              <div>
                <Label className="text-xs">Upload a file</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("kb-file-input")?.click()}>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, TXT, CSV, MD (max 10MB)</p>
                  <input id="kb-file-input" type="file" accept=".pdf,.docx,.txt,.csv,.md,.doc" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!newSource) setNewSource(file.name.replace(/\.[^.]+$/, ""));
                        if (file.name.toLowerCase().endsWith(".pdf")) {
                          setIsPdf(true);
                          setNewContent("");
                        } else {
                          setIsPdf(false);
                          const reader = new FileReader();
                          reader.onload = (ev) => { setNewContent(ev.target?.result as string || ""); };
                          reader.readAsText(file);
                        }
                      }
                    }} />
                </div>
                {isPdf && (
                  <div className="mt-2 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
                    <p className="text-xs text-warning font-medium">PDF support coming soon</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Please copy-paste the text content from your PDF instead.</p>
                  </div>
                )}
                {newContent && !isPdf && <p className="text-[10px] text-success mt-1">File loaded. {newContent.length} characters ready to add.</p>}
              </div>
            )}

            {addMode === "url" && (
              <div>
                <Label className="text-xs">Website URL</Label>
                <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://yoursite.com/pricing or https://docs.google.com/..." className="mt-1 h-9 text-sm" />
                <p className="text-[10px] text-muted-foreground mt-1">Sammy will fetch and extract the text content from this page.</p>
                {!newContent && newUrl && (
                  <Button variant="outline" size="sm" className="mt-2 text-xs gap-1.5" disabled={fetching}
                    onClick={async () => {
                      setFetching(true);
                      try {
                        const res = await fetch(`${API_BASE}/api/knowledge/fetch-url`, {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ url: newUrl }),
                        });
                        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Fetch failed"); }
                        const data = await res.json();
                        setNewContent(data.content);
                        if (!newSource) setNewSource(data.title || new URL(newUrl).hostname);
                        toast.success("Content fetched successfully");
                      } catch (err: any) { toast.error(err.message || "Failed to fetch URL"); }
                      finally { setFetching(false); }
                    }}>
                    {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />} {fetching ? "Fetching..." : "Fetch Content"}
                  </Button>
                )}
                {newContent && <p className="text-[10px] text-success mt-1">Content ready to add.</p>}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newContent.trim() || saving || isPdf} className="gap-1.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setAddMode("text"); setNewUrl(""); setIsPdf(false); }}>Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Knowledge items */}
      <div className="space-y-3">
        {items.map((item, i) => {
          const isEditing = editingId === item.id;

          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.source}</p>
                    <p className="text-[10px] text-muted-foreground">Added {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button onClick={() => setEditingId(null)} aria-label="Cancel" className="p-1.5 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleUpdate(item.id)} disabled={saving} aria-label="Save" className="p-1.5 text-primary hover:text-primary/80">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(item.id); setEditContent(item.content); setEditSource(item.source); }}
                        aria-label="Edit" className="p-1.5 text-muted-foreground hover:text-foreground"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item.id)}
                        aria-label="Delete" className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Input value={editSource} onChange={(e) => setEditSource(e.target.value)} className="h-8 text-sm" placeholder="Source label" />
                  <RichTextEditor content={editContent} onChange={setEditContent} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
              )}
            </motion.div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No knowledge added yet</p>
            <p className="text-xs mt-1">Add product info, pricing, FAQs, and policies so Sammy can reference them when drafting messages.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseView;
