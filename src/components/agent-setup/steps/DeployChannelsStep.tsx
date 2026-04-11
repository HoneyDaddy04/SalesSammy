import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, MessageCircle, MessageSquare, Mail, Globe, Phone, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentConfig } from "@/hooks/useAgentSetup";

const allChannels = [
  { id: "whatsapp", name: "WhatsApp", desc: "Deploy via WhatsApp Business API", icon: MessageCircle, color: "text-green-600" },
  { id: "telegram", name: "Telegram", desc: "Connect to a Telegram bot", icon: MessageSquare, color: "text-blue-500" },
  { id: "slack", name: "Slack", desc: "Add to your Slack workspace", icon: Briefcase, color: "text-purple-500" },
  { id: "facebook", name: "Facebook Messenger", desc: "Connect your Facebook page", icon: MessageCircle, color: "text-blue-600" },
  { id: "email", name: "Email", desc: "Handle email conversations", icon: Mail, color: "text-orange-500" },
  { id: "website", name: "Website Widget", desc: "Embed chat on your site", icon: Globe, color: "text-primary" },
  { id: "sms", name: "SMS", desc: "Send and receive text messages", icon: Phone, color: "text-emerald-600" },
];

const agentRecommendations: Record<string, string[]> = {
  sales: ["whatsapp", "email", "website"],
  support: ["whatsapp", "website", "email", "slack"],
  success: ["email", "slack"],
};

interface Props {
  agentId: string;
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onComplete: () => void;
}

const DeployChannelsStep = ({ agentId, config, onUpdate, onComplete }: Props) => {
  const [deploying, setDeploying] = useState<string | null>(null);
  const channels = config.channels || [];
  const recommended = agentRecommendations[agentId] || [];

  const toggleChannel = (id: string) => {
    if (channels.includes(id)) {
      onUpdate({ channels: channels.filter((c) => c !== id) });
    } else {
      setDeploying(id);
      setTimeout(() => {
        onUpdate({ channels: [...channels, id] });
        setDeploying(null);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Go Live</h3>
        <p className="text-sm text-muted-foreground">
          Your teammate passed the sandbox test. Choose which channels to deploy on.
        </p>
      </div>

      <div className="space-y-2">
        {allChannels.map((channel) => {
          const isDeployed = channels.includes(channel.id);
          const isDeploying = deploying === channel.id;
          const isRecommended = recommended.includes(channel.id);
          return (
            <button
              key={channel.id}
              onClick={() => !isDeploying && toggleChannel(channel.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                isDeployed
                  ? "border-success/30 bg-success/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <channel.icon className={cn("w-5 h-5", channel.color)} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{channel.name}</p>
                    {isRecommended && !isDeployed && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">Recommended</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{channel.desc}</p>
                </div>
              </div>
              <div>
                {isDeploying && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                {isDeployed && !isDeploying && (
                  <span className="flex items-center gap-1 text-xs text-success font-medium">
                    <Check className="w-3.5 h-3.5" /> Live
                  </span>
                )}
                {!isDeployed && !isDeploying && (
                  <span className="text-xs text-primary font-medium">Deploy</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {channels.length > 0 && (
        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-xs text-foreground font-medium">
            {channels.length} channel{channels.length > 1 ? "s" : ""} selected
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {channels.map((c) => allChannels.find((ch) => ch.id === c)?.name).filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      <Button
        onClick={onComplete}
        disabled={channels.length === 0}
        className="w-full gap-2"
      >
        Deploy & Complete Setup
      </Button>
    </div>
  );
};

export default DeployChannelsStep;
