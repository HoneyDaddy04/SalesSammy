import { useState, useEffect } from "react";
import { Agent } from "@/data/agents";
import { MessageSquare, TrendingUp, Headphones, Heart, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import SandboxChat from "./SandboxChat";
import { motion } from "framer-motion";
import type { ApiAgent } from "@/services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const DEMO_ORG_ID_KEY = "vaigence_org_id";

const roleIcons: Record<string, typeof TrendingUp> = {
  "Sales Closer": TrendingUp,
  "Support Specialist": Headphones,
  "Customer Success Manager": Heart,
};

const roleColors: Record<string, string> = {
  sales: "agent-sales",
  support: "agent-support",
  success: "agent-success",
};

interface SandboxViewProps {
  agents: Agent[];
}

const SandboxView = ({ agents }: SandboxViewProps) => {
  const [chatAgent, setChatAgent] = useState<{
    id: string;
    name: string;
    role: string;
    color: string;
  } | null>(null);

  const [apiAgents, setApiAgents] = useState<ApiAgent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = localStorage.getItem(DEMO_ORG_ID_KEY) || "";

  const loadAgents = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/agents?org_id=${orgId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setApiAgents(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect";
      setError(msg);
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [orgId]);

  const getBackendAgentId = (frontendAgent: Agent): string | null => {
    if (!apiAgents) return null;
    const backendAgent = apiAgents.find((a) => a.role === frontendAgent.id);
    return backendAgent?.id || null;
  };

  if (chatAgent) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Sandbox Chat
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Testing {chatAgent.name} in sandbox mode
          </p>
        </div>
        <SandboxChat
          orgId={orgId}
          agentId={chatAgent.id}
          agentName={chatAgent.name}
          agentRole={chatAgent.role}
          agentColor={chatAgent.color}
          onBack={() => setChatAgent(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Sandbox Chat
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Test your AI agents in a safe sandbox environment
        </p>
      </div>

      {!orgId && (
        <div className="rounded-xl border-2 border-dashed border-warning/40 bg-warning/5 p-5">
          <h3 className="font-display font-semibold text-foreground text-sm">
            Backend not connected
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Run the backend server and seed the database first. Then set your
            org ID in localStorage:
          </p>
          <code className="block text-xs bg-secondary rounded px-3 py-2 mt-2 text-foreground">
            localStorage.setItem("vaigence_org_id", "your-org-id-from-seed")
          </code>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-destructive">Connection error</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
          <button
            onClick={loadAgents}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Connecting to backend...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {agents.map((agent, i) => {
          const backendId = getBackendAgentId(agent);
          const Icon = roleIcons[agent.title] || MessageSquare;
          const color = roleColors[agent.id] || "agent-sales";
          const isReady = !!backendId;

          return (
            <motion.button
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                if (isReady) {
                  setChatAgent({
                    id: backendId!,
                    name: agent.name,
                    role: agent.id,
                    color: `agent-${agent.id}`,
                  });
                }
              }}
              disabled={!isReady}
              className={cn(
                "text-left rounded-2xl border border-border bg-card p-6 shadow-sm transition-all",
                isReady
                  ? "hover:shadow-md hover:border-primary/20 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  `bg-${color}/10`
                )}
              >
                <Icon className={cn("w-6 h-6", `text-${color}`)} />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">
                {agent.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {agent.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {agent.bio}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={cn(isReady ? "text-success" : "text-muted-foreground")}>
                  {isReady ? "Ready — Start conversation" : loading ? "Connecting..." : "Connect backend first"}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SandboxView;
