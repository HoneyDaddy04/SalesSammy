import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Agent } from "@/data/agents";
import { CheckCircle2, Brain, Settings2 } from "lucide-react";
import { useAgentSetup } from "@/hooks/useAgentSetup";
import { Button } from "@/components/ui/button";

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  onStartSetup: () => void;
  index: number;
}

const AgentCard = ({ agent, onClick, onStartSetup, index }: AgentCardProps) => {
  const { getAgentProgress, hasSetupData } = useAgentSetup();
  const progress = hasSetupData ? getAgentProgress(agent.id) : agent.onboardingProgress;
  const needsSetup = hasSetupData && progress < 100;

  const colorMap: Record<string, string> = {
    "agent-sales": "border-agent-sales/20 hover:border-agent-sales/50",
    "agent-support": "border-agent-support/20 hover:border-agent-support/50",
    "agent-success": "border-agent-success/20 hover:border-agent-success/50",
  };
  const barColorMap: Record<string, string> = {
    "agent-sales": "bg-agent-sales",
    "agent-support": "bg-agent-support",
    "agent-success": "bg-agent-success",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "w-full text-left rounded-xl border bg-card p-6 transition-all duration-300 group shadow-sm hover:shadow-md",
        colorMap[agent.colorVar],
        needsSetup && progress === 0 && "opacity-80"
      )}
    >
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-border" loading="lazy" width={48} height={48} />
            <div>
              <h3 className="font-display font-semibold text-foreground">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
          </div>
          {needsSetup ? (
            <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
              Setup Required
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-success bg-success/10 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
              Online
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className={cn("text-lg font-display font-bold", needsSetup && progress === 0 ? "text-muted-foreground" : "text-foreground")}>
              {needsSetup && progress === 0 ? "-" : agent.totalJobs.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Jobs Done</p>
          </div>
          <div>
            <p className={cn("text-lg font-display font-bold", needsSetup && progress === 0 ? "text-muted-foreground" : "text-foreground")}>
              {needsSetup && progress === 0 ? "-" : `${agent.performance}%`}
            </p>
            <p className="text-[10px] text-muted-foreground">Performance</p>
          </div>
          <div>
            <p className={cn("text-lg font-display font-bold", needsSetup && progress === 0 ? "text-muted-foreground" : "text-foreground")}>
              {needsSetup && progress === 0 ? "-" : agent.activeAutomations}
            </p>
            <p className="text-[10px] text-muted-foreground">Automations</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3" /> {needsSetup ? "Setup Progress" : "Onboarding"}
            </span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", barColorMap[agent.colorVar])}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>

      {needsSetup ? (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onStartSetup(); }}
            className="w-full gap-1.5 text-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {progress === 0 ? "Complete Setup" : "Continue Setup"}
          </Button>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-2">Latest Activity</p>
          {agent.recentActivity.slice(0, 2).map((a) => (
            <button key={a.id} onClick={onClick} className="w-full flex items-center gap-2 text-xs py-1 text-left">
              <CheckCircle2 className={cn("w-3 h-3",
                a.status === "success" && "text-success",
                a.status === "warning" && "text-warning",
                a.status === "info" && "text-info",
              )} />
              <span className="text-muted-foreground truncate">{a.action} - <span className="text-foreground">{a.target}</span></span>
              <span className="ml-auto text-muted-foreground text-[10px] whitespace-nowrap">{a.time}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AgentCard;
