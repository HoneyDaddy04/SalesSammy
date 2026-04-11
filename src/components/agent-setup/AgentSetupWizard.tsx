import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAgentSetup } from "@/hooks/useAgentSetup";
import { agents } from "@/data/agents";
import { CheckCircle2, Database, BookOpen, Workflow, Shield, MessageCircle, PartyPopper, Globe, TestTube } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TOTAL_SETUP_STEPS } from "@/hooks/useAgentSetup";
import DataSourcesStep from "./steps/DataSourcesStep";
import KnowledgeBaseStep from "./steps/KnowledgeBaseStep";
import WorkflowsStep from "./steps/WorkflowsStep";
import EscalationStep from "./steps/EscalationStep";
import BrandVoiceStep from "./steps/BrandVoiceStep";
import SandboxTestStep from "./steps/SandboxTestStep";
import DeployChannelsStep from "./steps/DeployChannelsStep";

const steps = [
  { num: 1, label: "Data Sources", icon: Database },
  { num: 2, label: "Knowledge Base", icon: BookOpen },
  { num: 3, label: "Workflows", icon: Workflow },
  { num: 4, label: "Escalation", icon: Shield },
  { num: 5, label: "Brand Voice", icon: MessageCircle },
  { num: 6, label: "Sandbox Test", icon: TestTube },
  { num: 7, label: "Go Live", icon: Globe },
];

interface Props {
  agentId: string | null;
  open: boolean;
  onClose: () => void;
}

const AgentSetupWizard = ({ agentId, open, onClose }: Props) => {
  const { getAgentConfig, updateAgentConfig, completeStep } = useAgentSetup();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);

  if (!agentId) return null;

  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return null;

  const config = getAgentConfig(agentId);

  const handleStepComplete = (step: number) => {
    completeStep(agentId, step);
    if (step === TOTAL_SETUP_STEPS) {
      setShowCelebration(true);
    } else {
      setCurrentStep(step + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_SETUP_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setShowCelebration(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-[600px] p-0 overflow-y-auto">
        {showCelebration ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mb-6"
            >
              <PartyPopper className="w-10 h-10 text-success" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-2xl font-bold text-foreground mb-2"
            >
              {agent.name} is ready!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mb-8 max-w-sm"
            >
              Your {agent.role.toLowerCase()} is fully configured and ready to start handling conversations.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button onClick={handleClose} className="gap-2 px-6">
                Go to Dashboard
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3 mb-1">
                <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Set up {agent.name}</h2>
                  <p className="text-xs text-muted-foreground">{agent.title}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Step indicator */}
              <div className="w-48 shrink-0 border-r border-border py-6 px-4 hidden md:block">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-4 px-2">Setup Steps</p>
                <div className="space-y-1">
                  {steps.map((step) => {
                    const completed = config.completedSteps.includes(step.num);
                    const active = currentStep === step.num;
                    return (
                      <button
                        key={step.num}
                        onClick={() => setCurrentStep(step.num)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-xs font-medium transition-all",
                          active && "bg-primary/10 text-primary",
                          completed && !active && "text-success",
                          !active && !completed && "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <step.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        )}
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Mobile step indicator */}
                <div className="md:hidden flex gap-1.5 mb-6">
                  {steps.map((step) => (
                    <div
                      key={step.num}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        config.completedSteps.includes(step.num)
                          ? "bg-success"
                          : currentStep === step.num
                          ? "bg-primary"
                          : "bg-border"
                      )}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentStep === 1 && (
                      <DataSourcesStep
                        agentId={agentId}
                        config={config}
                        onUpdate={(u) => updateAgentConfig(agentId, u)}
                        onComplete={() => handleStepComplete(1)}
                      />
                    )}
                    {currentStep === 2 && (
                      <KnowledgeBaseStep
                        agentId={agentId}
                        config={config}
                        onUpdate={(u) => updateAgentConfig(agentId, u)}
                        onComplete={() => handleStepComplete(2)}
                      />
                    )}
                    {currentStep === 3 && (
                      <WorkflowsStep
                        agentId={agentId}
                        config={config}
                        onUpdate={(u) => updateAgentConfig(agentId, u)}
                        onComplete={() => handleStepComplete(3)}
                      />
                    )}
                    {currentStep === 4 && (
                      <EscalationStep
                        agentId={agentId}
                        config={config}
                        onUpdate={(u) => updateAgentConfig(agentId, u)}
                        onComplete={() => handleStepComplete(4)}
                      />
                    )}
                    {currentStep === 5 && (
                      <BrandVoiceStep
                        agentId={agentId}
                        config={config}
                        onUpdate={(u) => updateAgentConfig(agentId, u)}
                        onComplete={() => handleStepComplete(5)}
                      />
                    )}
                    {currentStep === 6 && (
                      <SandboxTestStep
                        agentId={agentId}
                        config={config}
                        onUpdate={(u) => updateAgentConfig(agentId, u)}
                        onComplete={() => handleStepComplete(6)}
                      />
                    )}
                    {currentStep === 7 && (
                      <DeployChannelsStep
                        agentId={agentId}
                        config={config}
                        onUpdate={(u) => updateAgentConfig(agentId, u)}
                        onComplete={() => handleStepComplete(7)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Skip link */}
                {currentStep < TOTAL_SETUP_STEPS && (
                  <button
                    onClick={handleSkip}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 py-2"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AgentSetupWizard;
