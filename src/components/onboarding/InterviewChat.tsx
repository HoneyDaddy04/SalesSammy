import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { startOnboarding, answerOnboarding, sendOnboardingFeedback } from "@/services/api";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const InterviewChat = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "interview" | "feedback" | "done">("signup");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [sampleMessage, setSampleMessage] = useState("");

  // Signup fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartInterview = async () => {
    if (!company.trim()) return;
    setLoading(true);
    try {
      const res = await startOnboarding(name, email, company);
      setSessionId(res.session_id);
      setOrgId(res.org_id);
      setQuestionIndex(res.question_index);
      setTotalQuestions(res.total_questions);
      setStep("interview");
      setMessages([{ id: "start", role: "assistant", content: res.message }]);
      localStorage.setItem("vaigence_org_id", res.org_id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnswer = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setLoading(true);

    try {
      if (step === "feedback") {
        await sendOnboardingFeedback(orgId, text);
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: "Got it — I'll adjust based on your feedback. Let's get to work." },
        ]);
        setStep("done");
        setTimeout(() => navigate("/dashboard"), 2000);
        return;
      }

      const res = await answerOnboarding(sessionId, text);
      setQuestionIndex(res.question_index);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: res.message }]);

      if (res.complete) {
        setSampleMessage(res.sample_message || "");
        setOrgId(res.org_id || orgId);
        setStep("feedback");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Signup Screen ---
  if (step === "signup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <img src={logo} alt="Vaigence" className="w-12 h-12 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground">Hire your AI Teammate</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Quick interview to learn your business. Takes about 15 minutes.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              onKeyDown={(e) => e.key === "Enter" && handleStartInterview()}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            onClick={handleStartInterview}
            disabled={!company.trim() || loading}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start Interview"}
          </button>
        </motion.div>
      </div>
    );
  }

  // --- Interview + Feedback Chat ---
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Vaigence" className="w-8 h-8" />
          <div>
            <h1 className="font-display text-sm font-bold text-foreground">Teammate Interview</h1>
            <p className="text-[10px] text-muted-foreground">
              {step === "done"
                ? "All set!"
                : step === "feedback"
                ? "Review sample message"
                : `Question ${questionIndex + 1} of ${totalQuestions}`}
            </p>
          </div>
        </div>
        {step === "interview" && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${((questionIndex) / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{Math.round((questionIndex / totalQuestions) * 100)}%</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {step !== "done" && (
        <div className="border-t border-border bg-card px-4 py-3 max-w-2xl mx-auto w-full">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendAnswer(); }
              }}
              placeholder={step === "feedback" ? "Tell me what to change, or just hit send to continue..." : "Type your answer..."}
              disabled={loading}
              rows={2}
              className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-50"
            />
            <button
              onClick={handleSendAnswer}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewChat;
