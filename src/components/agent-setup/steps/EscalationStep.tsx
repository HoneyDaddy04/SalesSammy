import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/hooks/useAgentSetup";
import { cn } from "@/lib/utils";

const agentDefaults: Record<string, { keywords: string[]; maxReplies: number; sentiment: boolean }> = {
  sales: { keywords: ["pricing", "discount", "competitor"], maxReplies: 5, sentiment: false },
  support: { keywords: ["refund", "cancel", "urgent", "broken"], maxReplies: 3, sentiment: true },
  success: { keywords: ["cancel", "downgrade", "unhappy"], maxReplies: 4, sentiment: true },
};

interface Props {
  agentId: string;
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onComplete: () => void;
}

const EscalationStep = ({ agentId, config, onUpdate, onComplete }: Props) => {
  const [newKeyword, setNewKeyword] = useState("");
  const esc = config.escalation;
  const defaults = agentDefaults[agentId] || agentDefaults.sales;

  // Apply defaults if empty
  if (esc.keywords.length === 0 && esc.handoffEmail === "") {
    onUpdate({
      escalation: {
        ...esc,
        keywords: defaults.keywords,
        maxReplies: defaults.maxReplies,
        sentimentEscalate: defaults.sentiment,
      },
    });
  }

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw || esc.keywords.includes(kw)) return;
    onUpdate({ escalation: { ...esc, keywords: [...esc.keywords, kw] } });
    setNewKeyword("");
  };

  const removeKeyword = (kw: string) => {
    onUpdate({ escalation: { ...esc, keywords: esc.keywords.filter((k) => k !== kw) } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">When to Pass to Your Team</h3>
        <p className="text-sm text-muted-foreground">
          Tell your AI teammate when to get a human involved.
        </p>
      </div>

      {/* Sentiment toggle */}
      <div>
        <button
          onClick={() => onUpdate({ escalation: { ...esc, sentimentEscalate: !esc.sentimentEscalate } })}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
            esc.sentimentEscalate ? "border-primary/30 bg-primary/5" : "border-border"
          )}
        >
          <div>
            <p className="text-sm font-medium text-foreground">Pass angry or frustrated messages to a human</p>
            <p className="text-xs text-muted-foreground">Automatically detect when a customer is upset and get your team involved</p>
          </div>
          <div className={cn(
            "w-10 h-6 rounded-full transition-colors flex items-center px-0.5",
            esc.sentimentEscalate ? "bg-primary" : "bg-border"
          )}>
            <div className={cn(
              "w-5 h-5 rounded-full bg-white transition-transform",
              esc.sentimentEscalate ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </button>
      </div>

      {/* Keywords */}
      <div>
        <Label className="mb-2 block">Trigger Words</Label>
        <p className="text-xs text-muted-foreground mb-3">When a customer uses these words, pass the conversation to your team.</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {esc.keywords.map((kw) => (
            <span key={kw} className="flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-md text-secondary-foreground">
              {kw}
              <button onClick={() => removeKeyword(kw)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add keyword..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addKeyword} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Max auto-replies */}
      <div>
        <Label className="mb-2 block">Max replies before passing to a human</Label>
        <p className="text-xs text-muted-foreground mb-3">
          If the issue isn't solved after this many replies, your team takes over.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={esc.maxReplies}
            onChange={(e) => onUpdate({ escalation: { ...esc, maxReplies: Number(e.target.value) } })}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-medium text-foreground w-8 text-center">{esc.maxReplies}</span>
        </div>
      </div>

      {/* Handoff email */}
      <div>
        <Label>Team member email</Label>
        <Input
          placeholder="team@company.com"
          value={esc.handoffEmail}
          onChange={(e) => onUpdate({ escalation: { ...esc, handoffEmail: e.target.value } })}
          className="mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1">This person gets notified when a conversation is passed to your team.</p>
      </div>

      <Button onClick={onComplete} className="w-full gap-2">
        Save & Continue
      </Button>
    </div>
  );
};

export default EscalationStep;
