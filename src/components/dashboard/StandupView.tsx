import { useState, useEffect } from "react";
import { Send, MessageSquare, ThumbsUp, Clock, AlertCircle, BarChart3, Loader2 } from "lucide-react";
import { fetchStandup, type StandupData } from "@/services/api";
import { cn } from "@/lib/utils";

const ORG_KEY = "vaigence_org_id";

const StandupView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [data, setData] = useState<StandupData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    fetchStandup(orgId).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading standup...</div>;
  if (!data) return <div className="text-muted-foreground">No standup data available.</div>;

  const stats = [
    { label: "Touches Sent", value: data.touches_sent, icon: Send, color: "text-success" },
    { label: "Replies", value: data.replies_received, icon: MessageSquare, color: "text-primary" },
    { label: "Positive", value: data.positive_replies, icon: ThumbsUp, color: "text-success" },
    { label: "Needs You", value: data.needs_you, icon: AlertCircle, color: data.needs_you > 0 ? "text-warning" : "text-muted-foreground" },
    { label: "Planned Today", value: data.planned_today, icon: Clock, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Standup</h2>
        <p className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <s.icon className={cn("w-4 h-4 mb-2", s.color)} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm p-5">
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" /> Recent Activity
        </h3>
        <div className="space-y-2">
          {data.recent_activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                a.status === "success" ? "bg-success" : a.status === "pending" ? "bg-primary" : a.status === "warning" ? "bg-warning" : "bg-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{a.action}</p>
                {a.detail && <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
              </div>
              {a.contact_name && <span className="text-[10px] text-muted-foreground shrink-0">{a.contact_name}</span>}
            </div>
          ))}
          {data.recent_activity.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No activity yet today</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandupView;
