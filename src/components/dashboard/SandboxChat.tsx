import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { sendMessage } from "@/services/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SandboxChatProps {
  orgId: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  agentColor: string;
  onBack: () => void;
}

const SandboxChat = ({
  orgId,
  agentId,
  agentName,
  agentRole,
  agentColor,
  onBack,
}: SandboxChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customerId] = useState(() => `sandbox-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessage(orgId, agentId, text, customerId);
      setConversationId(res.conversation_id);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const roleColor: Record<string, string> = {
    "agent-sales": "from-orange-500/20 to-orange-600/5",
    "agent-support": "from-blue-500/20 to-blue-600/5",
    "agent-success": "from-green-500/20 to-green-600/5",
  };

  const dotColor: Record<string, string> = {
    "agent-sales": "bg-agent-sales",
    "agent-support": "bg-agent-support",
    "agent-success": "bg-agent-success",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-secondary to-transparent">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br",
            roleColor[agentColor]
          )}
        >
          <Bot className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-sm text-foreground">
            {agentName}
          </h3>
          <p className="text-[10px] text-muted-foreground capitalize">
            {agentRole} Agent · Sandbox
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              dotColor[agentColor]
            )}
          />
          Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              Start a conversation with {agentName}
            </p>
            <p className="text-xs mt-1 max-w-xs">
              This is a sandbox environment. Test how your agent responds to
              customer messages.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br",
                    roleColor[agentColor]
                  )}
                >
                  <Bot className="w-4 h-4 text-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br",
                roleColor[agentColor]
              )}
            >
              <Bot className="w-4 h-4 text-foreground" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card">
        {conversationId && (
          <p className="text-[9px] text-muted-foreground mb-2 px-1">
            Conversation: {conversationId.slice(0, 8)}...
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Message ${agentName}...`}
            disabled={loading}
            className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SandboxChat;
