import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgentConfig } from "@/hooks/useAgentSetup";
import { agents, Automation } from "@/data/agents";
import { Send, Bot, Loader2, CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---- Question definitions ---- */

interface ChatQuestion {
  key: string;
  question: string;
  placeholder: string;
}

const agentQuestions: Record<string, ChatQuestion[]> = {
  sales: [
    { key: "qualified_lead", question: "What does a qualified lead look like for your business? (e.g. company size, industry, budget range)", placeholder: "e.g. B2B SaaS companies with 50+ employees and a budget over ₦500K..." },
    { key: "product_pricing", question: "What's your main product or service, and roughly what price range?", placeholder: "e.g. We sell a project management tool, plans from ₦20K-₦200K/month..." },
    { key: "pricing_handling", question: "When someone asks about pricing, should I share details directly or book them a call with your team?", placeholder: "e.g. Share pricing for Starter/Growth, but book a call for Scale..." },
    { key: "handoff_contact", question: "Who should I hand off hot leads to? (name and email)", placeholder: "e.g. Tunde Bakare - tunde@company.com" },
  ],
  support: [
    { key: "top_issues", question: "What are the top 3 issues customers contact you about?", placeholder: "e.g. 1. Login problems, 2. Billing questions, 3. Feature requests..." },
    { key: "support_hours", question: "What are your support hours?", placeholder: "e.g. 9am - 6pm WAT, Monday to Friday" },
    { key: "escalation_rules", question: "When should I escalate to a human vs try to resolve myself?", placeholder: "e.g. Escalate billing disputes, refund requests, and anything technical..." },
    { key: "sla_target", question: "Do you have an SLA target for response and resolution times?", placeholder: "e.g. First response in 10 minutes, resolution within 4 hours" },
  ],
  success: [
    { key: "onboarded_customer", question: "What does a successfully onboarded customer look like?", placeholder: "e.g. They've connected their CRM, run their first automation, and invited 2+ team members" },
    { key: "milestones", question: "What are the key milestones in your customer journey?", placeholder: "e.g. First login, first automation, first 100 conversations, first integration..." },
    { key: "churn_signals", question: "What signals tell you a customer might churn?", placeholder: "e.g. No login for 7 days, multiple support tickets, declining usage..." },
    { key: "renewal_timing", question: "How far before a renewal should I start the conversation?", placeholder: "e.g. 60 days before expiry, with a follow-up at 30 days" },
  ],
};

/* ---- Summary generation ---- */

function generateWorkflowSummaries(agentId: string, context: Record<string, string>, automations: Automation[]): Record<string, string> {
  const summaries: Record<string, string> = {};

  if (agentId === "sales") {
    const lead = context.qualified_lead || "your ideal customer profile";
    const handoff = context.handoff_contact || "your sales team";

    automations.forEach((a) => {
      if (a.id === "s1") summaries[a.id] = `I'll respond to every lead within 60 seconds and qualify them based on: ${lead}. Hot leads get routed to ${handoff} instantly.`;
      if (a.id === "s2") summaries[a.id] = `I'll send personalized outreach highlighting ${context.product_pricing || "your product"}. Follow-ups are tailored to their engagement level.`;
      if (a.id === "s3") summaries[a.id] = `Every conversation gets auto-logged to your CRM with enriched contact data so nothing falls through the cracks.`;
      if (a.id === "s4") summaries[a.id] = `I'll handle scheduling and send calendar invites with pre-meeting briefs about the prospect.`;
      if (a.id === "s5") summaries[a.id] = `Daily pipeline reports with win probability. I'll flag stalled deals and suggest next steps for ${handoff}.`;
    });
  }

  if (agentId === "support") {
    const issues = context.top_issues || "common customer issues";
    const hours = context.support_hours || "your business hours";
    const escalation = context.escalation_rules || "complex issues";
    const sla = context.sla_target || "your SLA targets";

    automations.forEach((a) => {
      if (a.id === "su1") summaries[a.id] = `I'll triage every ticket instantly, auto-resolving common issues like: ${issues}. Complex ones get escalated with full context.`;
      if (a.id === "su2") summaries[a.id] = `During ${hours}, I respond instantly on WhatsApp and chat. Outside hours, I'll set expectations and queue for the next day.`;
      if (a.id === "su3") summaries[a.id] = `I'll suggest relevant KB articles during conversations and draft new articles from frequently resolved tickets.`;
      if (a.id === "su4") summaries[a.id] = `CSAT surveys go out after every resolution. I'll flag detractors for immediate follow-up.`;
      if (a.id === "su5") summaries[a.id] = `I'll monitor against ${sla} and alert you before any breach happens. Escalation triggers for: ${escalation}.`;
    });
  }

  if (agentId === "success") {
    const onboarded = context.onboarded_customer || "key activation milestones";
    const milestones = context.milestones || "your customer milestones";
    const churn = context.churn_signals || "declining usage patterns";
    const renewal = context.renewal_timing || "ahead of renewal dates";

    automations.forEach((a) => {
      if (a.id === "c1") summaries[a.id] = `I'll guide new customers through onboarding, tracking progress against: ${onboarded}. Nudges go out when they stall.`;
      if (a.id === "c2") summaries[a.id] = `I'll watch for churn signals like: ${churn}. At-risk accounts get flagged with retention recommendations.`;
      if (a.id === "c3") summaries[a.id] = `NPS surveys at key milestones: ${milestones}. Health scores combine usage, support history, and survey data.`;
      if (a.id === "c4") summaries[a.id] = `I'll start renewal conversations ${renewal} with personalized offers based on their usage patterns.`;
      if (a.id === "c5") summaries[a.id] = `Dormant accounts get re-engagement campaigns with tips and content tailored to their last active features.`;
    });
  }

  return summaries;
}

/* ---- Component ---- */

interface Props {
  agentId: string;
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onComplete: () => void;
}

const WorkflowsStep = ({ agentId, config, onUpdate, onComplete }: Props) => {
  const agent = agents.find((a) => a.id === agentId);
  const questions = agentQuestions[agentId] || [];
  const chatRef = useRef<HTMLDivElement>(null);

  const hasExistingContext = Object.keys(config.workflowContext).length >= questions.length;

  const [phase, setPhase] = useState<"browse" | "chat" | "review">(
    hasExistingContext ? "review" : "browse"
  );
  const [messages, setMessages] = useState<{ from: "agent" | "user"; text: string }[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<Record<string, string>>(config.workflowContext);

  if (!agent) return null;

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startChat = () => {
    const greeting = `Great! Now let me tailor these workflows to your business. I'll ask ${questions.length} quick questions so I can configure everything for you.`;
    setMessages([
      { from: "agent", text: greeting },
      { from: "agent", text: questions[0]?.question || "" },
    ]);
    setCurrentQ(0);
    setContext({});
    setPhase("chat");
  };

  const handleSend = () => {
    const answer = inputValue.trim();
    if (!answer || isTyping) return;

    const q = questions[currentQ];
    const newContext = { ...context, [q.key]: answer };
    setContext(newContext);
    setMessages((prev) => [...prev, { from: "user", text: answer }]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const nextQ = currentQ + 1;

      if (nextQ < questions.length) {
        setMessages((prev) => [...prev, { from: "agent", text: questions[nextQ].question }]);
        setCurrentQ(nextQ);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: "agent", text: "Perfect! I've got everything I need. Let me configure my workflows based on your answers..." },
        ]);

        const allWorkflowIds = agent.automations.map((a) => a.id);
        const summaries = generateWorkflowSummaries(agentId, newContext, agent.automations);

        onUpdate({
          workflowContext: newContext,
          workflows: allWorkflowIds,
          workflowConfigs: Object.fromEntries(
            Object.entries(summaries).map(([id, summary]) => [id, { summary }])
          ),
        });

        setTimeout(() => setPhase("review"), 1500);
      }
    }, 1200);
  };

  const toggleWorkflow = (automationId: string) => {
    const current = config.workflows;
    if (current.includes(automationId)) {
      onUpdate({ workflows: current.filter((w) => w !== automationId) });
    } else {
      onUpdate({ workflows: [...current, automationId] });
    }
  };

  const summaries = generateWorkflowSummaries(agentId, config.workflowContext, agent.automations);

  /* ======== BROWSE PHASE ======== */
  if (phase === "browse") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground mb-1">
            What {agent.name} Can Do
          </h3>
          <p className="text-sm text-muted-foreground">
            These are {agent.name}'s standard workflows - battle-tested across hundreds of businesses. Review them, then we'll customize for yours.
          </p>
        </div>

        <div className="space-y-3">
          {agent.automations.map((auto, i) => (
            <motion.div
              key={auto.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{auto.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{auto.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-success font-medium">ROI: {auto.roiMultiplier}x</span>
                    <span className="text-[10px] text-muted-foreground">Saves {auto.timeSavedPerMonth}/mo</span>
                    <span className="text-[10px] text-muted-foreground">{auto.triggerFrequency}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {auto.toolsUsed.map((tool) => (
                      <span key={tool} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{tool}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Button onClick={startChat} className="w-full gap-2">
          <Sparkles className="w-4 h-4" /> Customize for My Business
        </Button>
      </div>
    );
  }

  /* ======== REVIEW PHASE ======== */
  if (phase === "review") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground mb-1">Here's how I'll work for you</h3>
          <p className="text-sm text-muted-foreground">
            Based on your answers, I've configured {agent.automations.length} workflows tailored to your business. Toggle any off if you don't need them.
          </p>
        </div>

        <div className="space-y-3">
          {agent.automations.map((auto, i) => {
            const enabled = config.workflows.includes(auto.id);
            const summary = summaries[auto.id] || auto.description;
            return (
              <motion.div
                key={auto.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  enabled ? "border-primary/30 bg-primary/5" : "border-border opacity-60"
                )}
              >
                <button onClick={() => toggleWorkflow(auto.id)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {enabled ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{auto.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{summary}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-success font-medium">ROI: {auto.roiMultiplier}x</span>
                        <span className="text-[10px] text-muted-foreground">Saves {auto.timeSavedPerMonth}/mo</span>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={startChat} className="flex-1">
            Redo Questions
          </Button>
          <Button onClick={onComplete} disabled={config.workflows.length === 0} className="flex-1 gap-2">
            Looks Good
          </Button>
        </div>
      </div>
    );
  }

  /* ======== CHAT PHASE ======== */
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Customize Workflows</h3>
        <p className="text-sm text-muted-foreground">
          {agent.name} is learning about your business to tailor workflows for you.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full object-cover" />
          <div>
            <p className="text-sm font-medium text-foreground">{agent.name}</p>
            <p className="text-[10px] text-muted-foreground">{agent.title}</p>
          </div>
        </div>

        <div ref={chatRef} className="p-4 space-y-3 min-h-[300px] max-h-[380px] overflow-y-auto">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5",
                msg.from === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card border border-border rounded-tl-sm"
              )}>
                {msg.from === "agent" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="w-3 h-3 text-primary" />
                    <p className="text-[10px] font-medium text-primary">{agent.name}</p>
                  </div>
                )}
                <p className="text-sm">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={questions[currentQ]?.placeholder || "Type your answer..."}
              disabled={isTyping || currentQ >= questions.length}
              className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping || currentQ >= questions.length}
              className="h-10 px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Question {Math.min(currentQ + 1, questions.length)} of {questions.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsStep;
