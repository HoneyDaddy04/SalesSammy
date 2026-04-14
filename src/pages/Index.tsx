import { useCallback, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/dashboard/Sidebar";
import logo from "@/assets/branding/mark-dark.svg";
import OverviewView from "@/components/dashboard/OverviewView";
import MessagesView from "@/components/dashboard/MessagesView";
import ThreadsView from "@/components/dashboard/ThreadsView";
import TeammateDetailView from "@/components/dashboard/TeammateDetailView";
import WorkflowsView from "@/components/dashboard/WorkflowsView";
import IntegrationsView from "@/components/dashboard/IntegrationsView";
import DeployView from "@/components/dashboard/DeployView";
import KnowledgeBaseView from "@/components/dashboard/KnowledgeBaseView";
import SettingsView from "@/components/dashboard/SettingsView";
import { toast } from "sonner";
import { API_BASE, ORG_KEY } from "@/lib/constants";

// Map route segments to nav item IDs used by Sidebar
const routeToNavId: Record<string, string> = {
  "": "overview",
  overview: "overview",
  messages: "messages",
  leads: "leads",
  teammate: "teammate",
  workflows: "workflows",
  knowledge: "knowledge",
  integrations: "integrations",
  deploy: "deploy",
  settings: "settings",
};

const Index = () => {
  const [pendingMessages, setPendingMessages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Derive active view from the URL
  const segment = location.pathname.replace(/^\/dashboard\/?/, "").split("/")[0];
  const activeView = routeToNavId[segment] || "overview";

  // Auto-detect org ID if not set
  useEffect(() => {
    const orgId = localStorage.getItem(ORG_KEY);
    if (!orgId) {
      fetch(`${API_BASE}/api/demo`)
        .then(r => r.json())
        .then(data => {
          if (data.id) localStorage.setItem(ORG_KEY, data.id);
        })
        .catch(() => { toast.error("Failed to initialize session"); });
    }
  }, []);

  const handleCountUpdate = useCallback((count: number) => {
    setPendingMessages(count);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-background border-b border-border lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src={logo} alt="Sales Sammy" className="w-7 h-7 rounded-md" />
        <span className="font-display text-base font-bold tracking-tight">Sales Sammy</span>
      </div>

      <Sidebar
        activeView={activeView}
        pendingMessages={pendingMessages}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={cn("p-4 lg:p-8 transition-all duration-300", sidebarCollapsed ? "ml-0 lg:ml-16" : "ml-0 lg:ml-64")}>
        <Routes>
          <Route index element={<OverviewView />} />
          <Route path="overview" element={<OverviewView />} />
          <Route path="messages" element={<MessagesView onCountUpdate={handleCountUpdate} />} />
          <Route path="leads" element={<ThreadsView />} />
          <Route path="teammate" element={<TeammateDetailView />} />
          <Route path="workflows" element={<WorkflowsView />} />
          <Route path="knowledge" element={<KnowledgeBaseView />} />
          <Route path="integrations" element={<IntegrationsView />} />
          <Route path="deploy" element={<DeployView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;
