import { useNavigate } from "react-router-dom";
import { LayoutDashboard, User, MessagesSquare, MessageSquare, Settings, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import teammateAvatar from "@/assets/agent-sales.jpg";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <img src={logo} alt="Vaigence" className="w-9 h-9" />
        <div>
          <h1 className="font-display text-lg font-bold text-foreground tracking-tight">Vaigence</h1>
          <p className="text-[10px] text-muted-foreground">AI Teammate Platform</p>
        </div>
      </div>

      {/* Teammate Profile */}
      <button
        onClick={() => onViewChange("teammate")}
        className={cn(
          "mx-3 mt-4 rounded-xl p-3 flex items-center gap-3 transition-all duration-200 text-left",
          activeView === "teammate"
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-secondary"
        )}
      >
        <img src={teammateAvatar} alt="Teammate" className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground">Your Teammate</p>
          <p className="text-[10px] text-muted-foreground">Follow-Up Specialist</p>
        </div>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
        </span>
      </button>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Workspace</p>

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
          Dashboard
        </button>

        <button
          onClick={() => onViewChange("threads")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeView === "threads"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <MessagesSquare className="w-4 h-4" />
          Contacts
        </button>

        <button
          onClick={() => onViewChange("chat")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeView === "chat"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Talk to Teammate
        </button>

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
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Shadow Mode</p>
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">All messages require your approval</p>
          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "15%" }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">3 of 20 approvals to graduate first-touch</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </button>
          <span className="text-border">|</span>
          <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
