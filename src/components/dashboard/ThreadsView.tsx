import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ChevronRight, Mail, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchContacts, type ApiContact } from "@/services/api";

const ORG_KEY = "vaigence_org_id";

const statusColors: Record<string, string> = {
  queued: "bg-muted-foreground",
  active: "bg-primary",
  paused: "bg-warning",
  replied: "bg-success",
  completed: "bg-muted-foreground",
  opted_out: "bg-destructive",
};

const statusLabels: Record<string, string> = {
  queued: "Queued",
  active: "In sequence",
  paused: "Paused",
  replied: "Replied",
  completed: "Done",
  opted_out: "Opted out",
};

const ThreadsView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    fetchContacts(orgId).then(setContacts).catch(console.error).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading contacts...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Threads</h2>
        <p className="text-sm text-muted-foreground mt-1">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
        {contacts.map((contact, i) => {
          const meta = contact.metadata ? JSON.parse(contact.metadata) : {};
          return (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{contact.name}</span>
                  <span className="text-[10px] text-muted-foreground">{contact.company}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Mail className="w-3 h-3" /> {contact.email}
                  </span>
                  {meta.role && (
                    <span className="text-[10px] text-muted-foreground">{meta.role}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusColors[contact.status])} />
                  <span className="text-[10px] text-muted-foreground">{statusLabels[contact.status]}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Touch {contact.touch_index + 1} · {contact.sequence_name}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.div>
          );
        })}
        {contacts.length === 0 && (
          <div className="px-5 py-12 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No contacts yet. Import leads to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadsView;
