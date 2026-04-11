import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/hooks/useAgentSetup";
import { MessageCircle } from "lucide-react";
import { agents } from "@/data/agents";

const defaultGreetings: Record<string, string> = {
  sales: "Hi! Thanks for reaching out. I'd love to learn more about what you're looking for so I can point you in the right direction.",
  support: "Hello! I'm here to help. Let me know what you're experiencing and I'll get it sorted out for you right away.",
  success: "Hi there! I'm checking in to make sure everything is going smoothly. How has your experience been so far?",
};

const defaultSignoffs: Record<string, string> = {
  sales: "Looking forward to helping you find the right solution!",
  support: "Don't hesitate to reach out if you need anything else.",
  success: "We're always here to help you get the most out of the platform.",
};

const sampleConversations: Record<string, { customer: string; agentReply: (tone: string) => string }> = {
  sales: {
    customer: "Hi, I saw your product online. What plans do you offer?",
    agentReply: (tone) =>
      tone === "casual"
        ? "Hey! Great to hear from you. We've got three plans - Starter, Growth, and Scale. What kind of team size are we looking at? I can recommend the best fit."
        : tone === "friendly"
        ? "Hi there! Thanks for your interest. We offer three plans designed for different team sizes. I'd love to learn a bit about your needs so I can recommend the best option for you."
        : "Thank you for reaching out. We offer three plans - Starter, Growth, and Scale - each tailored to different business needs. Could you share a bit about your team size and requirements so I can recommend the ideal fit?",
  },
  support: {
    customer: "I can't log into my account. I keep getting an error.",
    agentReply: (tone) =>
      tone === "casual"
        ? "Oh no, that's frustrating! Let me help you get back in. Can you tell me what error message you're seeing? Also, have you tried resetting your password?"
        : tone === "friendly"
        ? "I'm sorry to hear you're having trouble logging in! Let's get this resolved quickly. Could you share the error message you're seeing? In the meantime, you might try resetting your password."
        : "I apologize for the inconvenience. I'll help resolve this immediately. Could you please share the specific error message? I'd also recommend trying a password reset as a first step.",
  },
  success: {
    customer: "We've been using the platform for a month now but haven't set up automations yet.",
    agentReply: (tone) =>
      tone === "casual"
        ? "Ah, you're missing out on the best part! Let me walk you through setting up your first automation - it literally takes 5 minutes and will save you hours every week."
        : tone === "friendly"
        ? "That's totally understandable - there's a lot to explore! Automations are where the real magic happens though. Would you like me to walk you through setting up your first one? It only takes about 5 minutes."
        : "Thank you for sharing that. Automations are a key driver of value on our platform. I'd be happy to guide you through setting up your first workflow - it typically takes about 5 minutes and can significantly reduce your team's manual workload.",
  },
};

interface Props {
  agentId: string;
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onComplete: () => void;
}

const BrandVoiceStep = ({ agentId, config, onUpdate, onComplete }: Props) => {
  const agent = agents.find((a) => a.id === agentId);
  const voice = config.voice;
  const conversation = sampleConversations[agentId] || sampleConversations.sales;

  // Apply defaults if empty
  if (!voice.greeting && !voice.signoff) {
    onUpdate({
      voice: {
        ...voice,
        greeting: defaultGreetings[agentId] || defaultGreetings.sales,
        signoff: defaultSignoffs[agentId] || defaultSignoffs.sales,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Brand Voice</h3>
        <p className="text-sm text-muted-foreground">
          Customize how {agent?.name || "your teammate"} communicates with customers.
        </p>
      </div>

      {/* Tone selector */}
      <div>
        <Label className="mb-2 block">Communication Tone</Label>
        <div className="grid grid-cols-3 gap-3">
          {["professional", "friendly", "casual"].map((tone) => (
            <button
              key={tone}
              onClick={() => onUpdate({ voice: { ...voice, tone } })}
              className={cn(
                "py-3 rounded-xl border text-sm font-medium transition-all capitalize",
                voice.tone === tone
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Greeting */}
      <div>
        <Label>Greeting Message</Label>
        <textarea
          value={voice.greeting}
          onChange={(e) => onUpdate({ voice: { ...voice, greeting: e.target.value } })}
          placeholder="How should your teammate greet customers?"
          className="mt-1.5 w-full h-20 rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Sign-off */}
      <div>
        <Label>Sign-off Message</Label>
        <textarea
          value={voice.signoff}
          onChange={(e) => onUpdate({ voice: { ...voice, signoff: e.target.value } })}
          placeholder="How should your teammate end conversations?"
          className="mt-1.5 w-full h-16 rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Live preview */}
      <div>
        <Label className="mb-2 block flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Live Preview
        </Label>
        <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
          {/* Customer message */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
              <p className="text-sm">{conversation.customer}</p>
            </div>
          </div>
          {/* Agent reply */}
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
              <p className="text-xs font-medium text-primary mb-1">{agent?.name || "Agent"}</p>
              <p className="text-sm text-foreground">{conversation.agentReply(voice.tone)}</p>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={onComplete} className="w-full gap-2">
        Complete Setup
      </Button>
    </div>
  );
};

export default BrandVoiceStep;
