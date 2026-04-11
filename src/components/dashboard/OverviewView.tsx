import { Agent } from "@/data/agents";
import { Bot, Zap, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";
import StatCard from "./StatCard";
import AgentCard from "./AgentCard";
import ActivityFeed from "./ActivityFeed";
import PerformanceChart from "./PerformanceChart";

interface OverviewViewProps {
  agents: Agent[];
  onSelectAgent: (agentId: string) => void;
  onStartSetup: (agentId: string) => void;
}

const OverviewView = ({ agents, onSelectAgent, onStartSetup }: OverviewViewProps) => {
  const totalJobs = agents.reduce((s, a) => s + a.totalJobs, 0);
  const avgPerformance = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + a.performance, 0) / agents.length)
    : 0;
  const totalCostSaved = "₦27.7M";
  const totalAutomations = agents.length * 5;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Operations Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Your AI teammates at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Agents" value={String(agents.length)} change="All online" icon={Bot} />
        <StatCard label="Conversations" value={totalJobs.toLocaleString()} change="+12% this week" icon={Zap} colorClass="text-primary" />
        <StatCard label="Avg Performance" value={`${avgPerformance}%`} change="+3% vs last month" icon={TrendingUp} colorClass="text-primary" />
        <StatCard label="Automations Active" value={String(totalAutomations)} change="1 learning" icon={CheckCircle2} colorClass="text-success" />
        <StatCard label="Cost Saved/Mo" value={totalCostSaved} change="vs manual ops" icon={DollarSign} colorClass="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {agents.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={() => onSelectAgent(agent.id)}
            onStartSetup={() => onStartSetup(agent.id)}
            index={i}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PerformanceChart />
        <ActivityFeed />
      </div>
    </div>
  );
};

export default OverviewView;
