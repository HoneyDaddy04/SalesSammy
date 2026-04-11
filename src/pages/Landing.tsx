import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Users,
  ChevronRight,
  Play,
  UserPlus,
  TrendingUp,
  Headphones,
  Heart,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  Briefcase,
  Target,
  Settings,
  BarChart3,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import salesAvatar from "@/assets/agent-sales.jpg";
import supportAvatar from "@/assets/agent-support.jpg";
import successAvatar from "@/assets/agent-success.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const plans = [
  {
    name: "Starter",
    price: "₦50,000",
    period: "/month",
    teammates: 1,
    conversations: 100,
    extra: "₦1,000",
    features: [
      "1 AI teammate (Sales, Support, or Success)",
      "100 conversations/month included",
      "₦1,000 per extra conversation",
      "All channels (WhatsApp, Email, Web, etc.)",
      "Basic analytics dashboard",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: "₦100,000",
    period: "/month",
    teammates: 2,
    conversations: 500,
    extra: "₦500",
    features: [
      "2 AI teammates",
      "500 conversations/month included",
      "₦500 per extra conversation",
      "All channels + Google Workspace",
      "Advanced analytics & reports",
      "Priority support + Slack channel",
      "Custom brand tone & voice",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Scale",
    price: "₦200,000",
    period: "/month",
    teammates: 3,
    conversations: 2000,
    extra: "₦250",
    features: [
      "All 3 AI teammates",
      "2,000 conversations/month included",
      "₦250 per extra conversation",
      "All channels + Google Workspace",
      "Full analytics, exports & API access",
      "Dedicated account manager",
      "Custom integrations & workflows",
      "Team roles & permissions",
    ],
    cta: "Get Started",
    popular: false,
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Vaigence" className="w-8 h-8" />
            <span className="font-display text-xl font-bold tracking-tight">Vaigence</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#teammates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Teammates</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#channels" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Channels</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate("/onboarding")} className="gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm text-primary mb-8"
          >
            <Users className="w-3.5 h-3.5" /> AI teammates for customer conversations
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
          >
            Never lose a<br />
            <span className="text-gradient-primary">customer again</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI teammates that turn every conversation into revenue. Always on, always responds, never drops the ball.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" onClick={() => navigate("/onboarding")} className="gap-2 px-8 h-12 text-base">
              Start Free <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")} className="gap-2 px-8 h-12 text-base">
              <Play className="w-4 h-4" /> See Dashboard Demo
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: "< 60s", label: "Response time" },
              { value: "24/7", label: "Always on" },
              { value: "96%", label: "Qualification rate" },
              { value: "3x", label: "Revenue impact" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Meet Your AI Teammates */}
      <section id="teammates" className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">Meet Your AI Teammates</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Three specialists. One mission.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mb-16">
              Always on. Always responds. Never drops the ball.
            </p>
          </motion.div>

          {/* Three pillars */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {[
              { num: "01", title: "Captures every lead", desc: "The moment a lead lands, your AI teammate replies, qualifies them, and books the meeting - so you're always the first responder.", icon: Target },
              { num: "02", title: "Relentless follow-up", desc: "No lead goes cold, no thread gets forgotten. It nudges, re-engages, and keeps every conversation moving.", icon: MessageSquare },
              { num: "03", title: "Handles support 24/7", desc: "Responds instantly, resolves what it can, escalates what it can't, and follows up - turning support into retention.", icon: Headphones },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="p-8 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground font-mono font-bold">{item.num}</span>
                <h3 className="font-display text-xl font-bold mt-2 mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Agent Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Kofi",
                role: "Sales",
                title: "Senior SDR",
                avatar: salesAvatar,
                color: "border-agent-sales",
                icon: TrendingUp,
                stats: [{ v: "2×", l: "Pipeline" }, { v: "+35%", l: "Close rate" }],
                desc: "Captures every inbound lead within seconds, qualifies prospects, and books meetings before competitors respond.",
                tasks: ["Lead qualification", "Email outreach", "Meeting booking", "CRM logging", "Pipeline reporting"],
              },
              {
                name: "Amara",
                role: "Support",
                title: "Support Specialist",
                avatar: supportAvatar,
                color: "border-agent-support",
                icon: Headphones,
                stats: [{ v: "94%", l: "CSAT" }, { v: "0.8s", l: "Response" }],
                desc: "Resolves tickets instantly, escalates what she can't fix, and ensures no customer waits more than 10 minutes.",
                tasks: ["Ticket triage", "WhatsApp replies", "KB suggestions", "SLA monitoring", "CSAT surveys"],
              },
              {
                name: "Zuri",
                role: "Success",
                title: "Success Manager",
                avatar: successAvatar,
                color: "border-agent-success",
                icon: Heart,
                stats: [{ v: "97%", l: "Retention" }, { v: "3.2×", l: "Expansion" }],
                desc: "Monitors onboarding, tracks adoption, detects churn signals early, and proactively re-engages accounts.",
                tasks: ["Onboarding sequences", "Churn prediction", "NPS tracking", "Renewal alerts", "Upsell signals"],
              },
            ].map((agent, i) => (
              <motion.div
                key={agent.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className={`rounded-2xl border-2 ${agent.color} bg-background overflow-hidden hover:shadow-lg transition-shadow`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <agent.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{agent.role}</span>
                  </div>
                  <h4 className="font-display text-xl font-bold">{agent.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{agent.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{agent.desc}</p>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-foreground mb-2">Key tasks</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tasks.map((task) => (
                        <span key={task} className="text-[10px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{task}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-6">
                    {agent.stats.map((s) => (
                      <div key={s.l}>
                        <p className="font-display text-lg font-bold">{s.v}</p>
                        <p className="text-xs text-muted-foreground">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">How It Works</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Live in days, not months
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mb-16">
              Four steps from sign-up to a fully deployed AI teammate.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Sign up", desc: "Tell us about your business, your customers, and the conversations you want handled.", icon: UserPlus },
              { step: "02", title: "Configure", desc: "Pick your AI teammates and tune them to your brand, tone, and workflows in a single guided pass.", icon: Settings },
              { step: "03", title: "Deploy", desc: "Go live across your channels: WhatsApp, email, Slack, Telegram, Facebook, or your website.", icon: Globe },
              { step: "04", title: "Manage", desc: "Track activity, performance, and cost from a single dashboard. Adjust on the fly.", icon: BarChart3 },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="relative"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <ChevronRight className="w-5 h-5 text-border -ml-2.5" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-primary font-mono font-bold">{item.step}</span>
                <h3 className="font-display text-lg font-bold mt-1 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}
            className="mt-16 text-center"
          >
            <Button size="lg" onClick={() => navigate("/onboarding")} className="gap-2 px-8 h-12 text-base">
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">Pricing</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a plan based on the number of AI teammates you need. Scale conversations as you grow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className={`relative rounded-2xl border-2 bg-background p-8 ${
                  plan.popular ? "border-primary shadow-lg" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-4 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}

                <h3 className="font-display text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.teammates} AI teammate{plan.teammates > 1 ? "s" : ""}
                </p>

                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <div className="mb-6 p-3 rounded-lg bg-secondary">
                  <p className="text-sm text-foreground font-medium">{plan.conversations.toLocaleString()} conversations/mo</p>
                  <p className="text-xs text-muted-foreground">{plan.extra} per extra conversation</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate("/onboarding")}
                  className="w-full gap-2"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta} <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section id="channels" className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">Deploy Everywhere</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Wherever your customers are
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
              Deploy your AI teammates across every channel your customers use.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { name: "WhatsApp", icon: MessageCircle, color: "bg-green-500/10 text-green-600" },
              { name: "Telegram", icon: MessageSquare, color: "bg-blue-500/10 text-blue-500" },
              { name: "Slack", icon: Briefcase, color: "bg-purple-500/10 text-purple-500" },
              { name: "Facebook", icon: MessageCircle, color: "bg-blue-600/10 text-blue-600" },
              { name: "Email", icon: Mail, color: "bg-orange-500/10 text-orange-500" },
              { name: "Website", icon: Globe, color: "bg-primary/10 text-primary" },
              { name: "SMS", icon: Phone, color: "bg-emerald-500/10 text-emerald-600" },
            ].map((channel, i) => (
              <motion.div
                key={channel.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${channel.color} flex items-center justify-center`}>
                  <channel.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">{channel.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Stop losing customers to slow replies
          </h2>
          <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto">
            Your AI teammates are ready. Sign up in minutes, deploy in days, and never miss a conversation again.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/onboarding")}
            className="gap-2 px-8 h-12 text-base"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Vaigence" className="w-6 h-6" />
            <span className="font-display text-sm font-bold">Vaigence</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Vaigence. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
