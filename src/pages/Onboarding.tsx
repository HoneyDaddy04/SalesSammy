import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Headphones,
  Heart,
  MessageCircle,
  MessageSquare,
  Mail,
  Globe,
  Phone,
  TestTube,
  Building2,
  Users,
  Briefcase,
  UserPlus,
  Settings,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAgentSetup } from "@/hooks/useAgentSetup";
import logo from "@/assets/logo.png";

const steps = [
  { id: "signup", label: "Sign Up", num: "01" },
  { id: "configure", label: "Configure", num: "02" },
  { id: "deploy", label: "Deploy", num: "03" },
  { id: "manage", label: "Manage", num: "04" },
];

const agentTemplates = [
  {
    id: "sales",
    name: "Sales Agent",
    icon: TrendingUp,
    color: "border-agent-sales bg-agent-sales/5",
    activeColor: "border-agent-sales bg-agent-sales/10 ring-2 ring-agent-sales/30",
    desc: "Captures leads, qualifies prospects, books meetings, and follows up relentlessly.",
    stats: "Avg 2× pipeline increase",
    tasks: ["Lead qualification", "Email outreach", "Meeting booking", "CRM logging", "Pipeline reporting"],
  },
  {
    id: "support",
    name: "Support Agent",
    icon: Headphones,
    color: "border-agent-support bg-agent-support/5",
    activeColor: "border-agent-support bg-agent-support/10 ring-2 ring-agent-support/30",
    desc: "Resolves tickets instantly, escalates complex issues, and monitors customer satisfaction.",
    stats: "Avg 94% CSAT score",
    tasks: ["Ticket triage", "WhatsApp replies", "KB suggestions", "SLA monitoring", "CSAT surveys"],
  },
  {
    id: "success",
    name: "Success Agent",
    icon: Heart,
    color: "border-agent-success bg-agent-success/5",
    activeColor: "border-agent-success bg-agent-success/10 ring-2 ring-agent-success/30",
    desc: "Monitors onboarding, prevents churn, and identifies expansion opportunities.",
    stats: "Avg 97% retention rate",
    tasks: ["Onboarding sequences", "Churn prediction", "NPS tracking", "Renewal alerts", "Upsell signals"],
  },
];

const channels = [
  { id: "sandbox", name: "Sandbox", icon: TestTube, desc: "Test in a safe environment first", color: "bg-primary/10 text-primary" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, desc: "Connect via WhatsApp Business", color: "bg-green-500/10 text-green-600" },
  { id: "telegram", name: "Telegram", icon: MessageSquare, desc: "Deploy to Telegram bot", color: "bg-blue-500/10 text-blue-500" },
  { id: "slack", name: "Slack", icon: Briefcase, desc: "Add to your Slack workspace", color: "bg-purple-500/10 text-purple-500" },
  { id: "facebook", name: "Facebook", icon: MessageCircle, desc: "Connect Messenger", color: "bg-blue-600/10 text-blue-600" },
  { id: "email", name: "Email", icon: Mail, desc: "Handle email conversations", color: "bg-orange-500/10 text-orange-500" },
  { id: "website", name: "Website", icon: Globe, desc: "Embed chat widget on your site", color: "bg-primary/10 text-primary" },
  { id: "sms", name: "SMS", icon: Phone, desc: "Send and receive text messages", color: "bg-emerald-500/10 text-emerald-600" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { saveOnboarding } = useAgentSetup();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    industry: "",
  });
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["sandbox"]);
  const [brandTone, setBrandTone] = useState("professional");

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.name && formData.email && formData.company;
    if (currentStep === 1) return selectedAgents.length > 0;
    if (currentStep === 2) return selectedChannels.length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    } else {
      saveOnboarding({
        user: formData,
        selectedAgents,
        selectedChannels,
        brandTone,
      });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar - steps */}
      <div className="hidden lg:flex w-80 bg-card border-r border-border flex-col">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <img src={logo} alt="Vaigence" className="w-8 h-8" />
          <span className="font-display text-lg font-bold">Vaigence</span>
        </div>

        <div className="flex-1 px-6 py-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-8">Setup Progress</p>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => i <= currentStep && setCurrentStep(i)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all",
                  i === currentStep && "bg-primary/10 border border-primary/20",
                  i < currentStep && "text-muted-foreground",
                  i > currentStep && "text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    i < currentStep && "bg-accent text-accent-foreground",
                    i === currentStep && "bg-primary text-primary-foreground",
                    i > currentStep && "bg-secondary text-muted-foreground"
                  )}
                >
                  {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                </div>
                <div>
                  <p className={cn("text-sm font-medium", i === currentStep && "text-foreground")}>
                    {step.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Vaigence" className="w-7 h-7" />
            <span className="font-display font-bold">Vaigence</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of 4
          </p>
        </div>

        {/* Step indicator mobile */}
        <div className="lg:hidden flex gap-1.5 px-6 pt-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= currentStep ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {/* Step 0: Sign Up */}
              {currentStep === 0 && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                    Let's get you started
                  </h2>
                  <p className="text-muted-foreground mb-10">
                    Tell us about your business and the conversations you want handled.
                  </p>

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="name">Your name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Chidi Okafor"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1.5 h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Work email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="chidi@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1.5 h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company name</Label>
                      <Input
                        id="company"
                        placeholder="e.g. TechFlow Inc."
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="mt-1.5 h-12"
                      />
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <div className="grid grid-cols-2 gap-3 mt-1.5">
                        {[
                          { id: "ecommerce", label: "E-commerce", icon: Briefcase },
                          { id: "saas", label: "SaaS / Tech", icon: Globe },
                          { id: "services", label: "Services", icon: Users },
                          { id: "other", label: "Other", icon: Building2 },
                        ].map((ind) => (
                          <button
                            key={ind.id}
                            onClick={() => setFormData({ ...formData, industry: ind.id })}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                              formData.industry === ind.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border hover:border-primary/30"
                            )}
                          >
                            <ind.icon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{ind.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Configure */}
              {currentStep === 1 && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                    Choose your AI teammates
                  </h2>
                  <p className="text-muted-foreground mb-10">
                    Pick proven templates and tune them to your brand in a single guided pass.
                  </p>

                  <div className="space-y-4 mb-8">
                    {agentTemplates.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => toggleAgent(agent.id)}
                        className={cn(
                          "w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
                          selectedAgents.includes(agent.id) ? agent.activeColor : agent.color
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0">
                          <agent.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold">{agent.name}</h3>
                            {selectedAgents.includes(agent.id) && (
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{agent.desc}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {agent.tasks.map((task) => (
                              <span key={task} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{task}</span>
                            ))}
                          </div>
                          <span className="text-xs font-medium text-primary">{agent.stats}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Brand tone */}
                  <div>
                    <Label className="mb-3 block">Brand tone</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Professional", "Friendly", "Casual"].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setBrandTone(tone.toLowerCase())}
                          className={cn(
                            "py-3 rounded-xl border text-sm font-medium transition-all",
                            brandTone === tone.toLowerCase()
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Deploy */}
              {currentStep === 2 && (
                <motion.div
                  key="deploy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                    Choose your channels
                  </h2>
                  <p className="text-muted-foreground mb-10">
                    Deploy across every channel your customers use. Start with sandbox to test first.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => toggleChannel(channel.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                          selectedChannels.includes(channel.id)
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className={`w-10 h-10 rounded-lg ${channel.color} flex items-center justify-center shrink-0`}>
                          <channel.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">{channel.name}</h4>
                            {selectedChannels.includes(channel.id) && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{channel.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedChannels.includes("sandbox") && (
                    <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <p className="text-sm text-accent font-medium mb-1">✓ Sandbox selected</p>
                      <p className="text-xs text-muted-foreground">
                        You can test your AI teammates in a safe environment before going live on other channels.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Manage */}
              {currentStep === 3 && (
                <motion.div
                  key="manage"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                      You're all set!
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Your AI teammates are being deployed. Head to the dashboard to manage performance, track conversations, and adjust on the fly.
                    </p>

                    <div className="rounded-xl border border-border bg-card p-6 mb-8 text-left max-w-md mx-auto">
                      <h3 className="font-display font-bold mb-4">Deployment Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Company</span>
                          <span className="font-medium">{formData.company || "Your Company"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Agents</span>
                          <span className="font-medium">
                            {selectedAgents.length > 0
                              ? selectedAgents.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(", ")
                              : "None selected"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Channels</span>
                          <span className="font-medium">
                            {selectedChannels.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tone</span>
                          <span className="font-medium capitalize">{brandTone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10">
              <Button
                variant="ghost"
                onClick={() => currentStep > 0 ? setCurrentStep((s) => s - 1) : navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {currentStep === 0 ? "Home" : "Back"}
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2 px-6"
              >
                {currentStep === 3 ? "Go to Dashboard" : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
