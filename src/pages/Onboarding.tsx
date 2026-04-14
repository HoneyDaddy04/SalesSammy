import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Building2, Users, Target, MessageSquare, Database, Mail, Mic, Shield, UserPlus, Loader2, Bot, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ORG_KEY, API_BASE } from "@/lib/constants";
import { startOnboarding, answerOnboarding, sendOnboardingFeedback } from "@/services/api";
import logo from "@/assets/logo.png";

const steps = [
  { id: "signup", label: "Sign Up", num: "01" },
  { id: "business", label: "Your Business", num: "02" },
  { id: "audience", label: "Your Audience", num: "03" },
  { id: "triggers", label: "Triggers & Goals", num: "04" },
  { id: "sources", label: "Lead Sources", num: "05" },
  { id: "channels", label: "Channels", num: "06" },
  { id: "voice", label: "Your Voice", num: "07" },
  { id: "guardrails", label: "Guardrails", num: "08" },
  { id: "escalation", label: "Escalation", num: "09" },
  { id: "review", label: "Review", num: "10" },
];

const channelOptions = [
  { id: "email", label: "Email (Gmail)", icon: Mail, desc: "Primary outreach channel" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, desc: "Conversational follow-ups" },
  { id: "linkedin", label: "LinkedIn DM", icon: Briefcase, desc: "Professional outreach" },
  { id: "sms", label: "SMS", icon: MessageSquare, desc: "Direct, short messages" },
];

const sourceOptions = [
  { id: "csv", label: "CSV Upload", desc: "Upload a spreadsheet" },
  { id: "sheets", label: "Google Sheets", desc: "Connect a live sheet" },
  { id: "hubspot", label: "HubSpot", desc: "Sync from CRM" },
  { id: "manual", label: "Add Manually", desc: "Enter leads one by one" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [sampleMessage, setSampleMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({
    business_description: "", target_audience: "", lead_source_type: "",
    lead_trigger_signals: "", goal: "", voice_examples: "", guardrails: "", escalation: "",
  });
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email"]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const updateAnswer = (key: string, value: string) => setAnswers(prev => ({ ...prev, [key]: value }));

  const canProceed = () => {
    switch (step) {
      case 0: return company.trim().length > 0;
      case 1: return answers.business_description.trim().length > 0;
      case 2: return answers.target_audience.trim().length > 0;
      case 3: return answers.lead_trigger_signals.trim().length > 0 && answers.goal.trim().length > 0;
      case 4: return selectedSources.length > 0;
      case 5: return selectedChannels.length > 0;
      case 6: return answers.voice_examples.trim().length > 0;
      default: return true;
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const startRes = await startOnboarding(name, email, company);
      const sid = startRes.session_id;
      const oid = startRes.org_id;

      const orderedAnswers = [
        answers.business_description, answers.target_audience,
        answers.lead_source_type || selectedSources.join(", "),
        answers.lead_trigger_signals, answers.goal,
        selectedSources.join(", "), selectedChannels.join(", "),
        answers.voice_examples, answers.guardrails || "None specified",
        answers.escalation || "Not specified",
      ];

      let lastRes;
      for (const answer of orderedAnswers) {
        lastRes = await answerOnboarding(sid, answer || "Not specified");
      }

      localStorage.setItem(ORG_KEY, oid);
      setOrgId(oid);
      setSampleMessage(lastRes?.sample_message || "");
      setStep(9);
    } catch (err) { console.error("Onboarding error:", err); }
    finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (orgId) await sendOnboardingFeedback(orgId, "Looks good").catch(() => {});
    navigate("/dashboard");
  };

  const nextStep = () => { if (step === 8) handleFinish(); else if (step < 9) setStep(step + 1); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Step progress sidebar */}
      <div className="hidden lg:flex w-72 border-r border-border bg-sidebar flex-col p-6">
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Vaigence" className="w-8 h-8" />
          <h1 className="font-display text-lg font-bold text-foreground">Vaigence</h1>
        </div>
        <div className="flex-1 space-y-1">
          {steps.map((s, i) => (
            <div key={s.id} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              i === step ? "bg-primary/10 text-primary font-medium" : i < step ? "text-success" : "text-muted-foreground"
            )}>
              {i < step ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> :
                <span className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0",
                  i === step ? "border-primary text-primary" : "border-muted-foreground/30")}>{s.num}</span>}
              {s.label}
            </div>
          ))}
        </div>
        <div className="mt-auto pt-4">
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(step / 9) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">{Math.round((step / 9) * 100)}% complete</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

                {step === 0 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Meet Sammy, your sales agent</h2><p className="text-sm text-muted-foreground mt-2">Quick setup, about 10 minutes. Your follow-up specialist will be ready to work.</p></div>
                    <div className="space-y-3">
                      <div><Label className="text-xs">Your name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" /></div>
                      <div><Label className="text-xs">Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@company.com" /></div>
                      <div><Label className="text-xs">Company name</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" /></div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">What does your business do?</h2><p className="text-sm text-muted-foreground mt-2">Like you'd explain it at a coffee shop. One paragraph.</p></div>
                    <textarea value={answers.business_description} onChange={e => updateAnswer("business_description", e.target.value)}
                      placeholder="We sell project management software for small teams. Monthly plans from $29. We help teams stop losing work in spreadsheets and chat threads."
                      rows={5} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Who are you trying to reach?</h2><p className="text-sm text-muted-foreground mt-2">Role, industry, company size.whatever matters.</p></div>
                    <textarea value={answers.target_audience} onChange={e => updateAnswer("target_audience", e.target.value)}
                      placeholder="Founders and ops leads at companies with 5-30 people. Usually overwhelmed, juggling too many tools."
                      rows={4} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Triggers & Goals</h2><p className="text-sm text-muted-foreground mt-2">The most important step.what signals say someone needs you now?</p></div>
                    <div className="space-y-4">
                      <div><Label className="text-xs font-medium">What's a sign they need you right now?</Label>
                        <textarea value={answers.lead_trigger_signals} onChange={e => updateAnswer("lead_trigger_signals", e.target.value)}
                          placeholder="They just raised funding, hired new people, or complained about losing track of tasks on social media."
                          rows={3} className="w-full mt-1.5 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" /></div>
                      <div><Label className="text-xs font-medium">What do you want them to do?</Label><Input value={answers.goal} onChange={e => updateAnswer("goal", e.target.value)} placeholder="Book a 15-minute demo call" /></div>
                      <div><Label className="text-xs font-medium">How do leads usually come to you?</Label><Input value={answers.lead_source_type} onChange={e => updateAnswer("lead_source_type", e.target.value)} placeholder="Inbound from website, cold outreach, referrals..." /></div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Where do your leads live?</h2><p className="text-sm text-muted-foreground mt-2">Select where Sammy should pull contacts from.</p></div>
                    <div className="grid grid-cols-2 gap-3">
                      {sourceOptions.map(src => (
                        <button key={src.id} onClick={() => setSelectedSources(prev => prev.includes(src.id) ? prev.filter(s => s !== src.id) : [...prev, src.id])}
                          className={cn("text-left rounded-xl border p-4 transition-all", selectedSources.includes(src.id) ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card hover:border-primary/30")}>
                          <p className="text-sm font-semibold text-foreground">{src.label}</p><p className="text-xs text-muted-foreground mt-0.5">{src.desc}</p>
                        </button>))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Where do you message them?</h2><p className="text-sm text-muted-foreground mt-2">Sammy will follow up across these channels.</p></div>
                    <div className="grid grid-cols-2 gap-3">
                      {channelOptions.map(ch => (
                        <button key={ch.id} onClick={() => setSelectedChannels(prev => prev.includes(ch.id) ? prev.filter(c => c !== ch.id) : [...prev, ch.id])}
                          className={cn("text-left rounded-xl border p-4 transition-all", selectedChannels.includes(ch.id) ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card hover:border-primary/30")}>
                          <ch.icon className="w-5 h-5 text-muted-foreground mb-2" /><p className="text-sm font-semibold text-foreground">{ch.label}</p><p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
                        </button>))}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Your voice</h2><p className="text-sm text-muted-foreground mt-2">Paste 2-3 messages you've sent that got good responses. This is how Sammy learns to sound like you.</p></div>
                    <textarea value={answers.voice_examples} onChange={e => updateAnswer("voice_examples", e.target.value)}
                      placeholder={"Hey Sarah.saw you just brought on 3 new people. Congrats! That's usually when task tracking starts breaking.\n\n---\n\nQuick one.noticed your team's growing fast. Most founders at your stage spend 5+ hours/week just keeping everyone aligned."}
                      rows={8} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Anything off-limits?</h2><p className="text-sm text-muted-foreground mt-2">Things Sammy should never say or promise.</p></div>
                    <textarea value={answers.guardrails} onChange={e => updateAnswer("guardrails", e.target.value)}
                      placeholder={"Never discuss competitor pricing\nDon't promise custom features\nDon't commit to delivery timelines"}
                      rows={5} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Who should Sammy escalate to?</h2><p className="text-sm text-muted-foreground mt-2">When a lead asks something beyond scope, who gets the ping?</p></div>
                    <textarea value={answers.escalation} onChange={e => updateAnswer("escalation", e.target.value)}
                      placeholder="Alex.alex@company.com.ping on Slack or email"
                      rows={3} className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  </div>
                )}

                {step === 9 && (
                  <div className="space-y-6">
                    <div><h2 className="font-display text-2xl font-bold text-foreground">Sammy is ready</h2><p className="text-sm text-muted-foreground mt-2">Here's a sample message. This is how they'll sound.</p></div>
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Bot className="w-5 h-5 text-primary" /></div>
                        <div><p className="text-sm font-semibold text-foreground">Sammy</p><p className="text-[10px] text-muted-foreground">Sample first-touch message</p></div>
                      </div>
                      <div className="bg-secondary rounded-xl px-4 py-3">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{sampleMessage || "Setting up..."}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-success/5 border border-success/20 p-4">
                      <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-success" /><p className="text-sm font-medium text-foreground">Setup Complete</p></div>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                        <li>Business context captured</li><li>Voice calibrated from your samples</li>
                        <li>Channels: {selectedChannels.join(", ")}</li><li>Starting in Shadow Mode.all messages need your approval</li>
                      </ul>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="border-t border-border bg-card px-8 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || loading} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          {step === 9 ? (
            <Button onClick={handleComplete} className="gap-2">Go to Dashboard <ArrowRight className="w-4 h-4" /></Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed() || loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {step === 8 ? "Finish Setup" : "Continue"} <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
