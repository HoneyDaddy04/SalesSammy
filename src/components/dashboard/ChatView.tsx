import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { chatWithTeammate } from "@/services/api";
import type { ChatResult, FlowPreview as FlowPreviewType, ConfigChange, ChatHistoryMessage } from "@/services/api";
import FlowPreview from "./FlowPreview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ORG_KEY } from "@/lib/constants";
import teammateAvatar from "@/assets/agent-sales.jpg";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  flowPreview?: FlowPreviewType | null;
  changes?: ConfigChange[];
}

const SUGGESTIONS = [
  "Follow up every 3 days instead of 5",
  "Never mention pricing unless they ask",
  "Be more casual on WhatsApp",
  "Show me how the cold outbound sequence works",
  "Add a guardrail: always mention our free trial",
  "What are my current guardrails?",
];

const ChatView = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getHistory = useCallback((): ChatHistoryMessage[] => {
    return messages.map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  const handleUndo = async (revisionId: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/teammate/rollback/${revisionId}`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (res.ok) {
        toast.success("Change undone");
        const refreshRes = await chatWithTeammate(orgId, "show me the current setup", getHistory());
        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: "Rolled that back. Here's how things look now:",
            flowPreview: refreshRes.flowPreview,
            changes: [],
          },
        ]);
      } else {
        toast.error("Couldn't undo — revision may no longer exist");
      }
    } catch {
      toast.error("Undo failed");
    }
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: msg }]);
    setLoading(true);

    try {
      const history = getHistory();
      const res: ChatResult = await chatWithTeammate(orgId, msg, history);
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.response,
          flowPreview: res.flowPreview,
          changes: res.changes,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <img src={teammateAvatar} alt="Sammy" className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Talk to Sammy</h2>
          <p className="text-xs text-muted-foreground">Adjust behavior, timing, tone — see changes live</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Empty state with suggestions */}
          {isEmpty && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">What would you like to adjust?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tell Sammy how to work in plain English. Every change shows a visual preview.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground hover:bg-secondary hover:border-primary/20 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <img src={teammateAvatar} alt="Sammy" className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 ring-1 ring-border" />
                  )}
                  <div className="flex flex-col gap-2 max-w-[75%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "assistant" && msg.flowPreview && (
                      <FlowPreview
                        flowPreview={msg.flowPreview}
                        changes={msg.changes || []}
                        onUndo={handleUndo}
                      />
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex gap-3">
                <img src={teammateAvatar} alt="Sammy" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-border" />
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Sammy is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-5 py-3.5 border-t border-border bg-card">
          <div className="flex items-center gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tell Sammy what to change..."
              disabled={loading}
              className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
