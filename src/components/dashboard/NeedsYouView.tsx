import { useState, useEffect } from "react";
import { AlertCircle, MessageSquare, Loader2 } from "lucide-react";
import { fetchQueue, type QueueItem } from "@/services/api";

const ORG_KEY = "vaigence_org_id";

const NeedsYouView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    // For now, "needs you" = pending approvals. Later: add reply triage items, escalations
    fetchQueue(orgId, "pending_approval").then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Needs You</h2>
        <p className="text-sm text-muted-foreground mt-1">Replies, escalations, and items that need your input</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nothing needs your attention right now</p>
          <p className="text-xs mt-1">Your teammate is handling everything. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{item.contact_name}</span>
                <span className="text-[10px] text-muted-foreground">at {item.contact_company}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded ml-auto">Awaiting approval</span>
              </div>
              <div className="bg-secondary rounded-lg px-4 py-3">
                <p className="text-sm text-foreground leading-relaxed">{item.drafted_content}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Touch {item.touch_index + 1} · {item.angle.replace(/_/g, " ")} · {item.channel}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NeedsYouView;
