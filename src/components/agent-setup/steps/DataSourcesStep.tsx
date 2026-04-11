import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentConfig } from "@/hooks/useAgentSetup";

const sourcesByAgent: Record<string, { name: string; type: string }[]> = {
  sales: [
    { name: "HubSpot CRM", type: "CRM" },
    { name: "LinkedIn Sales Navigator", type: "Prospecting" },
    { name: "Gmail / Google Workspace", type: "Email" },
    { name: "Calendly", type: "Scheduling" },
    { name: "WhatsApp Business", type: "Messaging" },
    { name: "Apollo.io", type: "Data Enrichment" },
    { name: "Slack", type: "Internal Comms" },
    { name: "Google Sheets", type: "Reporting" },
  ],
  support: [
    { name: "Zendesk", type: "Support Tickets" },
    { name: "Intercom", type: "Live Chat" },
    { name: "WhatsApp Business", type: "Messaging" },
    { name: "Notion Knowledge Base", type: "Documentation" },
    { name: "Slack", type: "Internal Comms" },
    { name: "Freshdesk", type: "Helpdesk" },
    { name: "Twilio", type: "SMS/Voice" },
    { name: "Gmail", type: "Email Support" },
  ],
  success: [
    { name: "HubSpot CRM", type: "Customer Data" },
    { name: "Stripe Billing", type: "Subscription Data" },
    { name: "Mixpanel", type: "Product Analytics" },
    { name: "Intercom", type: "In-app Messaging" },
    { name: "Slack", type: "Internal Comms" },
    { name: "Calendly", type: "Meeting Scheduling" },
    { name: "Typeform", type: "Surveys & NPS" },
    { name: "Google Sheets", type: "Reporting" },
  ],
};

interface Props {
  agentId: string;
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onComplete: () => void;
}

const DataSourcesStep = ({ agentId, config, onUpdate, onComplete }: Props) => {
  const sources = sourcesByAgent[agentId] || [];
  const [connecting, setConnecting] = useState<string | null>(null);

  const toggleSource = (name: string) => {
    if (config.dataSources.includes(name)) {
      onUpdate({ dataSources: config.dataSources.filter((s) => s !== name) });
    } else {
      setConnecting(name);
      setTimeout(() => {
        onUpdate({ dataSources: [...config.dataSources, name] });
        setConnecting(null);
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Connect Data Sources</h3>
        <p className="text-sm text-muted-foreground">
          Select the tools your AI teammate should connect to. You can add more later.
        </p>
      </div>

      <div className="space-y-2">
        {sources.map((source) => {
          const isConnected = config.dataSources.includes(source.name);
          const isConnecting = connecting === source.name;
          return (
            <button
              key={source.name}
              onClick={() => !isConnecting && toggleSource(source.name)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                isConnected
                  ? "border-success/30 bg-success/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{source.name}</p>
                  <p className="text-xs text-muted-foreground">{source.type}</p>
                </div>
              </div>
              <div>
                {isConnecting && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                {isConnected && !isConnecting && (
                  <span className="flex items-center gap-1 text-xs text-success font-medium">
                    <Check className="w-3.5 h-3.5" /> Connected
                  </span>
                )}
                {!isConnected && !isConnecting && (
                  <span className="text-xs text-primary font-medium">Connect</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={onComplete}
        disabled={config.dataSources.length === 0}
        className="w-full gap-2"
      >
        Save & Continue
      </Button>
    </div>
  );
};

export default DataSourcesStep;
