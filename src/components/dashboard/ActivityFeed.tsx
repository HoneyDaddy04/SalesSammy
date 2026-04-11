import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { agents, ActivityItem } from "@/data/agents";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

const statusIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const statusColors = {
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
};

const agentColors: Record<string, string> = {
  sales: "text-agent-sales",
  support: "text-agent-support",
  success: "text-agent-success",
};

interface FeedItem extends ActivityItem {
  agentId: string;
  agentName: string;
}

const ActivityFeed = () => {
  const allActivity: FeedItem[] = agents
    .flatMap((a) =>
      a.recentActivity.map((act) => ({
        ...act,
        agentId: a.id,
        agentName: a.name,
      }))
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-display font-semibold text-foreground mb-4">Live Activity Feed</h3>
      <div className="space-y-3">
        {allActivity.map((item, i) => {
          const StatusIcon = statusIcons[item.status];
          return (
            <motion.div
              key={item.id + item.agentId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
            >
              <StatusIcon className={cn("w-4 h-4 mt-0.5 shrink-0", statusColors[item.status])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className={cn("font-medium", agentColors[item.agentId])}>{item.agentName}</span>
                  {" "}{item.action}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.target}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.time}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
