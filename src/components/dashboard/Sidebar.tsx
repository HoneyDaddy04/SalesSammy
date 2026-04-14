import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Mail, Users, User, Workflow, Link2, Radio, Settings, LogOut, Home, BookOpen, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/branding/mark-dark.svg";
import teammateAvatar from "@/assets/agent-sales.jpg";

interface SidebarProps {
  activeView: string;
  pendingMessages?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, section: "daily" },
  { id: "messages", label: "Messages", icon: Mail, section: "daily", badge: true },
  { id: "leads", label: "Leads", icon: Users, section: "daily" },
  { id: "teammate", label: "Sammy", icon: User, section: "manage" },
  { id: "workflows", label: "Workflows", icon: Workflow, section: "manage" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, section: "manage" },
  { id: "integrations", label: "Integrations", icon: Link2, section: "manage" },
  { id: "deploy", label: "Deploy", icon: Radio, section: "manage" },
  { id: "settings", label: "Settings", icon: Settings, section: "settings" },
];

const Sidebar = ({ activeView, pendingMessages = 0, mobileOpen = false, onMobileClose, collapsed = false, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();

  const dailyItems = navItems.filter(n => n.section === "daily");
  const manageItems = navItems.filter(n => n.section === "manage");
  const settingsItems = navItems.filter(n => n.section === "settings");

  const NavButton = ({ item }: { item: typeof navItems[0] }) => (
    <button
      onClick={() => {
        navigate(`/dashboard/${item.id}`);
        onMobileClose?.();
      }}
      title={collapsed ? item.label : undefined}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[36px]",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
        activeView === item.id
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
      {!collapsed && item.badge && pendingMessages > 0 && (
        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {pendingMessages}
        </span>
      )}
      {collapsed && item.badge && pendingMessages > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
      )}
    </button>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen border-r border-border bg-sidebar flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo + collapse toggle */}
        <div className={cn("flex items-center border-b border-border", collapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-3")}>
          <div className={cn("flex items-center gap-2.5", collapsed && "hidden")}>
            <img src={logo} alt="Sales Sammy" className="w-7 h-7 rounded-md" />
            <span className="font-display text-base font-bold text-foreground tracking-tight">Sales Sammy</span>
          </div>
          {collapsed && <img src={logo} alt="Sales Sammy" className="w-7 h-7 rounded-md" />}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Teammate Profile Card */}
        {!collapsed ? (
          <button
            onClick={() => { navigate("/dashboard/teammate"); onMobileClose?.(); }}
            className={cn(
              "mx-3 mt-3 rounded-xl p-3 flex items-center gap-3 transition-all duration-200 text-left min-h-[40px]",
              activeView === "teammate" ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary"
            )}
          >
            <img src={teammateAvatar} alt="Sales Sammy" className="w-9 h-9 rounded-full object-cover ring-2 ring-border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold text-foreground">Sales Sammy</p>
              <p className="text-[10px] text-muted-foreground">Follow-Up Specialist</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          </button>
        ) : (
          <button
            onClick={() => { navigate("/dashboard/teammate"); onMobileClose?.(); }}
            title="Sales Sammy"
            className="mx-auto mt-3 relative"
          >
            <img src={teammateAvatar} alt="Sales Sammy" className="w-9 h-9 rounded-full object-cover ring-2 ring-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-sidebar" />
          </button>
        )}

        {/* Navigation */}
        <nav className={cn("flex-1 py-4 space-y-1 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
          {!collapsed && <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Daily</p>}
          {dailyItems.map(item => <NavButton key={item.id} item={item} />)}

          <div className="pt-4">
            {!collapsed && <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Manage</p>}
            {manageItems.map(item => <NavButton key={item.id} item={item} />)}
          </div>

          <div className="pt-4">
            {settingsItems.map(item => <NavButton key={item.id} item={item} />)}
          </div>
        </nav>

        {/* Bottom */}
        <div className={cn("border-t border-border", collapsed ? "px-2 py-3" : "px-4 py-3 space-y-3")}>
          {!collapsed && (
            <div className="rounded-lg bg-secondary p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">Shadow Mode</p>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">All messages need your approval</p>
              <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "15%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">3 of 20 to graduate first-touch</p>
            </div>
          )}
          <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "gap-2")}>
            <button onClick={() => navigate("/")} title="Home" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-3.5 h-3.5" /> {!collapsed && "Home"}
            </button>
            {!collapsed && <span className="text-border">|</span>}
            <button onClick={() => navigate("/login")} title="Log out" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-3.5 h-3.5" /> {!collapsed && "Log out"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
