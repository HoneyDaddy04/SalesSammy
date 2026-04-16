import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { chatWithTeammate } from "@/services/api";
import type { ChatResult, FlowPreview as FlowPreviewType, ConfigChange, ChatHistoryMessage } from "@/services/api";
import FlowPreview from "./FlowPreview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { ORG_KEY } from "@/lib/constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  flowPreview?: FlowPreviewType | null;
  changes?: ConfigChange[];
}

const TeammateChat = () => {
  const orgId = localStorage.getItem(ORG_KEY) || "";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm Sammy, your sales teammate. You can adjust how I work by just telling me — I'll show you exactly what changed so you can see the full picture.\n\nTry things like:\n\"follow up every 3 days instead of 5\"\n\"never mention pricing unless they ask\"\n\"be more casual on WhatsApp\"\n\"add a guardrail: always mention our 30-day guarantee\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build conversation history for multi-turn context
  const getHistory = useCallback((): ChatHistoryMessage[] => {
    return messages
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  const handleUndo = async (revisionId: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/teammate/rollback/${revisionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        toast.success("Change undone");
        // Re-send a no-op to refresh the flow preview
        const refreshRes = await chatWithTeammate(orgId, "show me the current setup", getHistory());
        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: "Done, I've rolled that back. Here's how things look now:",
            flowPreview: refreshRes.flowPreview,
            changes: [],
          },
        ]);
      } else {
        toast.error("Couldn't undo — the revision may no longer exist");
      }
    } catch {
      toast.error("Undo failed");
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setLoading(true);

    try {
      const history = getHistory();
      const res: ChatResult = await chatWithTeammate(orgId, text, history);
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
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Chat with Sammy</h2>
        <p className="text-sm text-muted-foreground mt-1">Tell Sammy how to work — see the changes live</p>
      </div>

      <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="flex flex-col gap-2 max-w-[85%]">
                  {/* Text message */}
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

                  {/* Flow preview (only for assistant messages with changes) */}
                  {msg.role === "assistant" && msg.flowPreview && (
                    <FlowPreview
                      flowPreview={msg.flowPreview}
                      changes={msg.changes || []}
                      onUndo={handleUndo}
                    />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Sammy is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tell Sammy what to change..."
              disabled={loading}
              className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeammateChat;
