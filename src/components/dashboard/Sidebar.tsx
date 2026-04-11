import { useNavigate } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Headphones, Heart, Settings, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentSetup } from "@/hooks/useAgentSetup";
import logo from "@/assets/logo.png";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const allAgentItems = [
  { id: "sales", label: "Kofi - Sales", icon: TrendingUp, color: "text-agent-sales", dotColor: "bg-agent-sales" },
  { id: "support", label: "Amara - Support", icon: Headphones, color: "text-agent-support", dotColor: "bg-agent-support" },
  { id: "success", label: "Zuri - Success", icon: Heart, color: "text-agent-success", dotColor: "bg-agent-success" },
];

const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const navigate = useNavigate();
  const { isAgentSelected, getAgentProgress, hasSetupData, state } = useAgentSetup();

  const agentItems = hasSetupData
    ? allAgentItems.filter((item) => isAgentSelected(item.id))
    : allAgentItems;

  const selectedCount = hasSetupData ? state.selectedAgents.length : 3;
  const planName = selectedCount === 1 ? "Starter" : selectedCount === 2 ? "Growth" : "Scale";
  const planPrice = selectedCount === 1 ? "₦50,000" : selectedCount === 2 ? "₦100,000" : "₦200,000";
  const planConvos = selectedCount === 1 ? 100 : selectedCount === 2 ? 500 : 2000;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <img src={logo} alt="Vaigence" className="w-9 h-9" />
        <div>
          <h1 className="font-display text-lg font-bold text-foreground tracking-tight">Vaigence</h1>
          <p className="text-[10px] text-muted-foreground">AI Teammate Platform</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Team</p>

        {/* Overview */}
        <button
          onClick={() => onViewChange("overview")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeView === "overview"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>

        {/* Agent nav items */}
        {agentItems.map((item) => {
          const progress = hasSetupData ? getAgentProgress(item.id) : 100;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeView === item.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn("w-4 h-4", activeView === item.id ? item.color : "")} />
              {item.label}
              <span className={cn(
                "ml-auto w-2 h-2 rounded-full",
                progress === 100 ? item.dotColor : progress > 0 ? "bg-warning" : "bg-destructive/50"
              )} />
            </button>
          );
        })}

        <div className="pt-6">
          <p className="px-3 mb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Manage</p>
          <button
            onClick={() => onViewChange("settings")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeView === "settings"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-border space-y-3">
        <div className="rounded-lg bg-secondary p-3">
          <p className="text-xs font-medium text-foreground">{planName} Plan - {planPrice}/mo</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{selectedCount} teammate{selectedCount > 1 ? "s" : ""} - {planConvos.toLocaleString()} conversations</p>
          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "62%" }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </button>
          <span className="text-border">|</span>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
