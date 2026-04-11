import { useState } from "react";
import { Plus, FileText, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/hooks/useAgentSetup";

const agentPrompts: Record<string, string> = {
  sales: "Describe your products, services, and pricing so Kofi can qualify leads accurately.",
  support: "Describe your product and common customer issues so Amara can resolve tickets faster.",
  success: "Describe your onboarding milestones and success metrics so Zuri can track adoption.",
};

interface Props {
  agentId: string;
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onComplete: () => void;
}

const KnowledgeBaseStep = ({ agentId, config, onUpdate, onComplete }: Props) => {
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [uploading, setUploading] = useState(false);

  const kb = config.knowledgeBase;

  const addFaq = () => {
    if (!newQ.trim() || !newA.trim()) return;
    onUpdate({
      knowledgeBase: {
        ...kb,
        faqs: [...kb.faqs, { q: newQ.trim(), a: newA.trim() }],
      },
    });
    setNewQ("");
    setNewA("");
  };

  const removeFaq = (index: number) => {
    onUpdate({
      knowledgeBase: {
        ...kb,
        faqs: kb.faqs.filter((_, i) => i !== index),
      },
    });
  };

  const fakeUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const filename = `company-docs-${kb.docs.length + 1}.pdf`;
      onUpdate({
        knowledgeBase: { ...kb, docs: [...kb.docs, filename] },
      });
      setUploading(false);
    }, 1500);
  };

  const canProceed = kb.companyDesc.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Knowledge Base</h3>
        <p className="text-sm text-muted-foreground">
          {agentPrompts[agentId] || "Tell your AI teammate about your business."}
        </p>
      </div>

      {/* Company description */}
      <div>
        <Label>Company / Product Description</Label>
        <textarea
          value={kb.companyDesc}
          onChange={(e) =>
            onUpdate({ knowledgeBase: { ...kb, companyDesc: e.target.value } })
          }
          placeholder="e.g. We're a SaaS platform that helps businesses automate their customer conversations..."
          className="mt-1.5 w-full h-28 rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* FAQ pairs */}
      <div>
        <Label className="mb-2 block">Frequently Asked Questions</Label>
        {kb.faqs.map((faq, i) => (
          <div key={i} className="flex items-start gap-2 mb-2 p-3 rounded-lg bg-secondary">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{faq.q}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{faq.a}</p>
            </div>
            <button onClick={() => removeFaq(i)} className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <div className="space-y-2">
          <Input
            placeholder="Question, e.g. What are your pricing plans?"
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
          />
          <Input
            placeholder="Answer, e.g. We offer Starter, Growth, and Scale plans..."
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={addFaq} disabled={!newQ.trim() || !newA.trim()} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </Button>
        </div>
      </div>

      {/* Document upload (fake) */}
      <div>
        <Label className="mb-2 block">Upload Documents</Label>
        {kb.docs.map((doc) => (
          <div key={doc} className="flex items-center gap-2 py-2 text-sm text-foreground">
            <FileText className="w-4 h-4 text-muted-foreground" />
            {doc}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={fakeUpload} disabled={uploading} className="gap-1.5 mt-1">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "Uploading..." : "Upload Document"}
        </Button>
      </div>

      <Button onClick={onComplete} disabled={!canProceed} className="w-full gap-2">
        Save & Continue
      </Button>
    </div>
  );
};

export default KnowledgeBaseStep;
