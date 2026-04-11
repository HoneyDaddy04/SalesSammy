import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Agent, Automation } from "@/data/agents";
import { ArrowLeft, CheckCircle2, Clock, Brain, Database, PlayCircle, PauseCircle, BookOpen, Calendar, Building2, User, Award, BarChart3, Activity, Workflow, TrendingUp, ClipboardList, Briefcase } from "lucide-react";
import AutomationDetailModal from "./AutomationDetailModal";
import { useAgentSetup } from "@/hooks/useAgentSetup";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const statusConfig = {
  active: { label: "Active", icon: PlayCircle, class: "text-success bg-success/10" },
  paused: { label: "Paused", icon: PauseCircle, class: "text-warning bg-warning/10" },
  learning: { label: "Learning", icon: BookOpen, class: "text-info bg-info/10" },
  completed: { label: "Done", icon: CheckCircle2, class: "text-success bg-success/10" },
};

const processStatusColors = {
  "optimized": "text-success bg-success/10",
  "needs-review": "text-warning bg-warning/10",
  "new": "text-info bg-info/10",
};

interface AgentDetailViewProps {
  agent: Agent;
  onBack: () => void;
  onStartSetup: () => void;
}

const AgentDetailView = ({ agent, onBack, onStartSetup }: AgentDetailViewProps) => {
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const { getAgentProgress, hasSetupData } = useAgentSetup();
  const progress = hasSetupData ? getAgentProgress(agent.id) : agent.onboardingProgress;
  const needsSetup = hasSetupData && progress < 100;

  const barColor: Record<string, string> = {
    "agent-sales": "bg-agent-sales",
    "agent-support": "bg-agent-support",
    "agent-success": "bg-agent-success",
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Overview
      </button>

      {/* Setup Banner */}
      {needsSetup && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-warning/40 bg-warning/5 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-foreground">
                {progress === 0 ? `Set up ${agent.name} to get started` : `Continue setting up ${agent.name}`}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {progress === 0
                  ? "Connect data sources, configure workflows, and set the brand voice."
                  : `${progress}% complete - finish setup to unlock all features.`}
              </p>
            </div>
            <Button onClick={onStartSetup} className="gap-1.5 shrink-0">
              <Settings2 className="w-4 h-4" />
              {progress === 0 ? "Start Setup" : "Continue Setup"}
            </Button>
          </div>
          {progress > 0 && (
            <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </motion.div>
      )}

      {/* Agent Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          <img src={agent.avatar} alt={agent.name} className="w-24 h-24 rounded-2xl object-cover ring-2 ring-border shadow-md" width={96} height={96} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display text-2xl font-bold text-foreground">{agent.name}</h2>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" /> Online
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">{agent.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-2xl">{agent.bio}</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {agent.department}</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> Reports to {agent.reportingTo}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Hired {agent.hiredDate}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center shrink-0">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{agent.totalJobs.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Jobs Done</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{agent.performance}%</p>
              <p className="text-[10px] text-muted-foreground">Performance</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{agent.metrics.uptimePercent}%</p>
              <p className="text-[10px] text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1"><Brain className="w-3 h-3" /> Onboarding Progress</span>
              <span className="text-foreground font-medium">{agent.onboardingProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-1000", barColor[agent.colorVar])} style={{ width: `${agent.onboardingProgress}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Upskill Level</span>
              <span className="text-foreground font-medium">{agent.upskillLevel}/5</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-1000", barColor[agent.colorVar])} style={{ width: `${(agent.upskillLevel / 5) * 100}%` }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /> Performance Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Tasks This Week</p>
            <p className="text-xl font-display font-bold text-foreground">{agent.metrics.tasksThisWeek.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Avg Response</p>
            <p className="text-xl font-display font-bold text-foreground">{agent.metrics.avgResponseTime}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Cost Saved</p>
            <p className="text-xl font-display font-bold text-success">{agent.metrics.costSaved}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">
              {agent.metrics.revenueInfluenced ? "Revenue Influenced" : agent.metrics.customerSatisfaction ? "CSAT Score" : "Error Rate"}
            </p>
            <p className="text-xl font-display font-bold text-foreground">
              {agent.metrics.revenueInfluenced || (agent.metrics.customerSatisfaction ? `${agent.metrics.customerSatisfaction}%` : `${agent.metrics.errorRate}%`)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Tasks */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /> Key Tasks ({agent.tasks.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agent.tasks.map((task, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-foreground">{task.name}</h4>
                <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">{task.impact}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{task.description}</p>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">{task.frequency}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skills & Certifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /> Skills</h3>
          <div className="flex flex-wrap gap-2">
            {agent.skills.map((s) => (
              <span key={s} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-secondary-foreground">{s}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-muted-foreground" /> Skills</h3>
          <div className="flex flex-wrap gap-2">
            {agent.certifications.map((c) => (
              <span key={c} className="px-3 py-1.5 rounded-lg bg-primary/10 text-xs font-medium text-primary">{c}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Data Sources */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" /> Connected Data Sources ({agent.dataSources.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {agent.dataSources.map((ds) => (
            <div key={ds.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary">
              <div>
                <p className="text-xs font-medium text-foreground">{ds.name}</p>
                <p className="text-[10px] text-muted-foreground">{ds.type}</p>
              </div>
              <span className={cn("w-2 h-2 rounded-full", ds.status === "connected" ? "bg-success" : ds.status === "syncing" ? "bg-warning animate-pulse" : "bg-destructive")} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Processes */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Workflow className="w-4 h-4 text-muted-foreground" /> Processes ({agent.processes.length})</h3>
        <div className="space-y-3">
          {agent.processes.map((process) => (
            <div key={process.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-semibold text-foreground">{process.name}</h4>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", processStatusColors[process.status])}>
                    {process.status === "optimized" ? "Optimized" : process.status === "needs-review" ? "Needs Review" : "New"}
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

      {/* Automations */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-muted-foreground" /> Automations ({agent.automations.length})</h3>
        <div className="space-y-3">
          {agent.automations.map((auto, i) => {
            const sc = statusConfig[auto.status];
            return (
              <motion.button
                key={auto.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => setSelectedAutomation(auto)}
                className="w-full text-left rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display font-semibold text-foreground">{auto.name}</h4>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1", sc.class)}>
                        <sc.icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">{auto.category}</span>
                      <span className="text-[10px] text-success font-medium">ROI: {auto.roiMultiplier}x</span>
                      <span className="text-[10px] text-muted-foreground">· Saves {auto.timeSavedPerMonth}/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{auto.description}</p>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-2 gap-4 sm:gap-3 shrink-0 sm:w-44 sm:text-right">
                    <div>
                      <p className="text-lg font-display font-bold text-foreground">{auto.jobsDone.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Jobs</p>
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-foreground">{auto.successRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Success</p>
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-foreground flex items-center sm:justify-end gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" /> {auto.avgTime}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Avg Time</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{auto.lastRun}</p>
                      <p className="text-[10px] text-muted-foreground">Last Run</p>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /> Recent Activity</h3>
        <div className="space-y-2">
          {agent.recentActivity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <CheckCircle2 className={cn("w-4 h-4 shrink-0",
                a.status === "success" && "text-success",
                a.status === "warning" && "text-warning",
                a.status === "info" && "text-info",
                a.status === "error" && "text-destructive",
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{a.action}</p>
                <p className="text-xs text-muted-foreground truncate">{a.target}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <AutomationDetailModal automation={selectedAutomation} onClose={() => setSelectedAutomation(null)} />
    </div>
  );
};

export default AgentDetailView;
