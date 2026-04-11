import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewView from "@/components/dashboard/OverviewView";
import AgentDetailView from "@/components/dashboard/AgentDetailView";
import SettingsView from "@/components/dashboard/SettingsView";
import AgentSetupWizard from "@/components/agent-setup/AgentSetupWizard";
import { agents } from "@/data/agents";
import { useAgentSetup } from "@/hooks/useAgentSetup";

const Index = () => {
  const [activeView, setActiveView] = useState("overview");
  const [setupAgentId, setSetupAgentId] = useState<string | null>(null);
  const { isAgentSelected, hasSetupData } = useAgentSetup();

  const visibleAgents = hasSetupData
    ? agents.filter((a) => isAgentSelected(a.id))
    : agents;

  const selectedAgent = visibleAgents.find((a) => a.id === activeView);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="ml-64 p-8">
        {activeView === "overview" ? (
          <OverviewView
            agents={visibleAgents}
            onSelectAgent={setActiveView}
            onStartSetup={(id) => setSetupAgentId(id)}
          />
        ) : activeView === "settings" ? (
          <SettingsView onBack={() => setActiveView("overview")} />
        ) : selectedAgent ? (
          <AgentDetailView
            agent={selectedAgent}
            onBack={() => setActiveView("overview")}
            onStartSetup={() => setSetupAgentId(selectedAgent.id)}
          />
        ) : null}
      </main>
      <AgentSetupWizard
        agentId={setupAgentId}
        open={setupAgentId !== null}
        onClose={() => setSetupAgentId(null)}
      />
    </div>
  );
};

export default Index;
