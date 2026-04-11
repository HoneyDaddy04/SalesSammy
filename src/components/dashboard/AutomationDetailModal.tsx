import { Automation } from "@/data/agents";
import { cn } from "@/lib/utils";
import { X, Clock, DollarSign, Timer, TrendingUp, AlertCircle, Zap, PlayCircle, PauseCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  active: { label: "Active", icon: PlayCircle, class: "text-success bg-success/10" },
  paused: { label: "Paused", icon: PauseCircle, class: "text-warning bg-warning/10" },
  learning: { label: "Learning", icon: BookOpen, class: "text-info bg-info/10" },
  completed: { label: "Done", icon: CheckCircle2, class: "text-success bg-success/10" },
};

interface AutomationDetailModalProps {
  automation: Automation | null;
  onClose: () => void;
}

const AutomationDetailModal = ({ automation, onClose }: AutomationDetailModalProps) => {
  if (!automation) return null;
  const sc = statusConfig[automation.status];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-xl font-bold text-foreground">{automation.name}</h3>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1", sc.class)}>
                    <sc.icon className="w-3 h-3" /> {sc.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{automation.category}</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{automation.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-secondary rounded-xl p-4 text-center">
                <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-display font-bold text-foreground">{automation.jobsDone.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Jobs Done</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center">
                <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
                <p className="text-lg font-display font-bold text-foreground">{automation.successRate}%</p>
                <p className="text-[10px] text-muted-foreground">Success Rate</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-info mx-auto mb-1" />
                <p className="text-lg font-display font-bold text-foreground">{automation.avgTime}</p>
                <p className="text-[10px] text-muted-foreground">Avg Time</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center">
                <AlertCircle className="w-5 h-5 text-warning mx-auto mb-1" />
                <p className="text-lg font-display font-bold text-foreground">{automation.errorRate}%</p>
                <p className="text-[10px] text-muted-foreground">Error Rate</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Est. Monthly Cost</span>
                </div>
                <p className="text-xl font-display font-bold text-foreground">{automation.estimatedMonthlyCost}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Time Saved/Month</span>
                </div>
                <p className="text-xl font-display font-bold text-foreground">{automation.timeSavedPerMonth}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">ROI Multiplier</span>
                </div>
                <p className="text-xl font-display font-bold text-success">{automation.roiMultiplier}x</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <h4 className="text-sm font-display font-semibold text-foreground mb-3">Tools & Integrations</h4>
                <div className="flex flex-wrap gap-2">
                  {automation.toolsUsed.map((tool) => (
                    <span key={tool} className="px-2.5 py-1 rounded-md bg-secondary text-xs font-medium text-secondary-foreground">{tool}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h4 className="text-sm font-display font-semibold text-foreground mb-3">Execution Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Trigger</span>
                    <span className="text-foreground font-medium">{automation.triggerFrequency}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Last Run</span>
                    <span className="text-foreground font-medium">{automation.lastRun}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AutomationDetailModal;
