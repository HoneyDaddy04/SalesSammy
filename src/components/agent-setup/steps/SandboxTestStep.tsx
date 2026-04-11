import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgentConfig } from "@/hooks/useAgentSetup";
import { agents } from "@/data/agents";
import { Send, Bot, User, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const testConversations: Record<string, { customer: string; agent: string }[]> = {
  sales: [
    { customer: "Hi, I'm interested in your product. What plans do you have?", agent: "" },
    { customer: "We're a team of about 20 people. What would you recommend?", agent: "" },
  ],
  support: [
    { customer: "I can't reset my password. The link keeps expiring.", agent: "" },
    { customer: "It's been happening since yesterday. Very frustrating.", agent: "" },
  ],
  success: [
    { customer: "We signed up last week but haven't set up automations yet.", agent: "" },
    { customer: "We're not sure where to start honestly.", agent: "" },
  ],
};

const agentResponses: Record<string, (tone: string) => string[]> = {
  sales: (tone) => [
    tone === "casual"
      ? "Hey! Welcome. We've got Starter, Growth, and Scale plans. For a team of your size, Growth would be perfect - want me to walk you through it?"
      : "Thank you for your interest! We offer three plans tailored to different team sizes. For 20 people, our Growth plan at ₦100,000/month would be ideal. Would you like to schedule a quick demo?",
    tone === "casual"
      ? "Growth is definitely the move for 20 people. You get 2 AI teammates and 500 conversations/month. Want me to book a demo so you can see it in action?"
      : "For a team of 20, I'd recommend the Growth plan. It includes 2 AI teammates, 500 monthly conversations, and priority support. Shall I schedule a demo to walk through the features?",
  ],
  support: (tone) => [
    tone === "casual"
      ? "Oh no, sorry about that! Let me look into this. Can you check if you're using the same email you signed up with? Sometimes that's the issue."
      : "I apologize for the inconvenience. Let me help resolve this right away. Could you confirm the email address associated with your account? I'll send a fresh reset link.",
    tone === "casual"
      ? "Got it, that's definitely not great. I've just sent a new reset link to your email - this one's valid for 24 hours. Let me know if it works!"
      : "I understand the frustration. I've generated a new reset link with an extended 24-hour validity period and sent it to your registered email. Please let me know once you've received it.",
  ],
  success: (tone) => [
    tone === "casual"
      ? "No worries, you're still early! Automations are honestly the best part. Want me to help you set up your first one? Takes about 5 minutes."
      : "Welcome aboard! It's completely normal to take time getting oriented. Automations are where you'll see the biggest value. I'd love to guide you through setting up your first workflow.",
    tone === "casual"
      ? "Totally get it! How about we start with something simple - like auto-responding to new leads? I'll walk you through it step by step right now."
      : "That's perfectly understandable. I'd suggest starting with our most popular workflow - automatic lead response. It's straightforward to set up and delivers immediate value. Shall we do it together now?",
  ],
};

interface Props {
  agentId: string;
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onComplete: () => void;
}

const SandboxTestStep = ({ agentId, config, onComplete }: Props) => {
  const agent = agents.find((a) => a.id === agentId);
  const [messages, setMessages] = useState<{ from: "customer" | "agent"; text: string }[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  const conversation = testConversations[agentId] || testConversations.sales;
  const responses = agentResponses[agentId]?.(config.voice.tone || "professional") || agentResponses.sales("professional");

  const sendNextMessage = () => {
    if (testIndex >= conversation.length) return;

    const customerMsg = conversation[testIndex].customer;
    setMessages((prev) => [...prev, { from: "customer", text: customerMsg }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { from: "agent", text: responses[testIndex] }]);
      if (testIndex + 1 >= conversation.length) {
        setTestComplete(true);
      }
      setTestIndex((i) => i + 1);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Sandbox Test</h3>
        <p className="text-sm text-muted-foreground">
          See how {agent?.name} handles a real conversation using your configuration. Click "Send" to simulate customer messages.
        </p>
      </div>

      {/* Chat window */}
      <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <img src={agent?.avatar} alt={agent?.name} className="w-8 h-8 rounded-full object-cover" />
          <div>
            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
            <p className="text-[10px] text-success">Sandbox mode</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 min-h-[280px] max-h-[350px] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Click "Send Test Message" to start the conversation
            </p>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.from === "customer" ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5",
                msg.from === "customer"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card border border-border rounded-tl-sm"
              )}>
                {msg.from === "agent" && (
                  <p className="text-[10px] font-medium text-primary mb-1">{agent?.name}</p>
                )}
                <p className="text-sm">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">{agent?.name} is typing</span>
                  <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Send button */}
        <div className="px-4 py-3 border-t border-border bg-card">
          {!testComplete ? (
            <Button
              onClick={sendNextMessage}
              disabled={isTyping || testIndex >= conversation.length}
              variant="outline"
              className="w-full gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {messages.length === 0 ? "Send Test Message" : "Send Next Message"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-success justify-center py-1">
              <CheckCircle2 className="w-4 h-4" />
              Sandbox test complete
            </div>
          )}
        </div>
      </div>

      {/* Result summary */}
      {testComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-success/30 bg-success/5 p-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{agent?.name} is working as expected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tone: {config.voice.tone || "professional"} -
                Response time: 1.2s avg -
                {config.escalation.sentimentEscalate ? " Escalation rules active" : " No escalation triggered"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <Button
        onClick={onComplete}
        disabled={!testComplete}
        className="w-full gap-2"
      >
        Save & Continue to Deploy
      </Button>
    </div>
  );
};

export default SandboxTestStep;
