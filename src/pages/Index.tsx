import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewView from "@/components/dashboard/OverviewView";
import TeammateDetailView from "@/components/dashboard/TeammateDetailView";
import ThreadsView from "@/components/dashboard/ThreadsView";
import TeammateChat from "@/components/dashboard/TeammateChat";
import SettingsView from "@/components/dashboard/SettingsView";

const Index = () => {
  const [activeView, setActiveView] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="ml-64 p-8">
        {activeView === "overview" ? (
          <OverviewView onViewTeammate={() => setActiveView("teammate")} />
        ) : activeView === "teammate" ? (
          <TeammateDetailView onBack={() => setActiveView("overview")} />
        ) : activeView === "threads" ? (
          <ThreadsView />
        ) : activeView === "chat" ? (
          <TeammateChat />
        ) : activeView === "settings" ? (
          <SettingsView onBack={() => setActiveView("overview")} />
        ) : null}
      </main>
    </div>
  );
};

export default Index;
