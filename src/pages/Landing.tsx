import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, Mail, Clock, TrendingDown,
  Users, DollarSign, Brain, Shield, Eye, Link2, ChevronRight,
  Check, AlertTriangle, Target, BarChart3, Menu, X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/branding/mark-dark.svg";
import teammateAvatar from "@/assets/agent-sales.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "#teammates", label: "Team" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#channels", label: "Channels" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Sales Sammy" className="w-8 h-8 rounded-md" />
            <span className="font-display text-xl font-bold tracking-tight">Sales Sammy</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden md:inline-flex">Log in</Button>
            <Button size="sm" onClick={() => navigate("/onboarding")} className="gap-1.5 hidden md:inline-flex">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary" aria-label="Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-border bg-card px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2">{link.label}</a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="justify-start h-9">Log in</Button>
              <Button size="sm" onClick={() => { navigate("/onboarding"); setMobileMenuOpen(false); }} className="gap-1.5 h-9">Get Started <ArrowRight className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )}
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="pt-32 pb-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/5 border border-destructive/10 text-sm text-destructive mb-8">
            <AlertTriangle className="w-3.5 h-3.5" /> 80% of sales happen after the 5th contact. Most businesses quit after 1.
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Never lose a<br />
            <span className="text-gradient-primary">customer again</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Sammy reaches out to every potential customer in your list and keeps going until they buy, book, or say no. Personalized messages in your voice across email, WhatsApp, and more. Set up in 15 minutes.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/onboarding")} className="gap-2 px-8 h-12 text-base">
              Start Free <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")} className="gap-2 px-8 h-12 text-base">
              <Play className="w-4 h-4" /> See Dashboard Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ━━━ STATS BAR ━━━ */}
      <section className="py-12 px-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { value: "2x", label: "More sales from the same customers", icon: Target },
            { value: "15 min", label: "To set up. No tech skills needed", icon: Clock },
            { value: "24/7", label: "Works while you sleep", icon: Shield },
            { value: "Week 1", label: "See results, not months", icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <stat.icon className="w-4 h-4 text-primary" />
                <p className="font-display text-3xl md:text-4xl font-bold text-foreground">{stat.value}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ━━━ THE PROBLEM ━━━ */}
      <section id="problem" className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs uppercase tracking-[0.2em] text-destructive font-medium mb-4">The Problem</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Interested customers are slipping away.<br />Every single day.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: TrendingDown, title: "Potential customers never hear from you",
                stat: "48%", statLabel: "of businesses never follow up with their leads",
                desc: "Whether they came from your website, a referral, or a cold list, most potential customers never get a second message. 48% get zero follow-up. Those are sales you'll never know you lost.",
                sources: "Invesp, MTD Sales Training",
              },
              {
                icon: Clock, title: "One message isn't enough to make a sale",
                stat: "80%", statLabel: "of sales happen after the 5th+ contact",
                desc: "Most people don't buy the first time they hear from you. They buy the 5th, 8th, or 12th time. But who has time to send 12 personalized messages to every interested person? Nobody. That's why sales get lost.",
                sources: "Invesp, HubSpot",
              },
              {
                icon: DollarSign, title: "Hiring someone to do it is expensive and unreliable",
                stat: "$135K", statLabel: "average cost of a sales hire per year",
                desc: "You hire someone. They take 3 months to learn your business. Work for about a year. Then leave. 34% turnover rate. You start over. Meanwhile, customers keep slipping through the cracks.",
                sources: "SalesHive, Bandalier",
              },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="p-8 rounded-2xl border border-border bg-background">
                <item.icon className="w-8 h-8 text-destructive mb-4" />
                <div className="mb-4">
                  <span className="font-display text-4xl font-bold text-foreground">{item.stat}</span>
                  <p className="text-xs text-muted-foreground mt-1">{item.statLabel}</p>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                <p className="text-[9px] text-muted-foreground/60">Sources: {item.sources}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ MEET SALES SAMMY ━━━ */}
      <section id="teammates" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">The Solution</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              More sales. Less effort.<br />No one falls through the cracks.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mb-16">
              Sammy reaches out to every potential customer on your list and stays on them until they convert. He writes like you, stays persistent across email, WhatsApp, and more. You just approve the messages and watch the sales come in.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="rounded-2xl border-2 border-primary/20 bg-card p-8 md:p-10 shadow-lg max-w-3xl mx-auto">
            <div className="flex items-start gap-6">
              <img src={teammateAvatar} alt="Sales Sammy" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/20 shadow-md hidden sm:block" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-display text-2xl font-bold">Sales Sammy</h3>
                  <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" /> Always On
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  The output of a full-time salesperson for less than the cost of a team lunch. Sammy works every name on your list until they become a customer. More sales. Less work for you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { icon: Brain, text: "Catches new leads from your website, WhatsApp, and email" },
                    { icon: Target, text: "Responds instantly and qualifies every person" },
                    { icon: Mail, text: "Follows up persistently across multiple channels" },
                    { icon: Eye, text: "Starts in shadow mode. You approve everything" },
                    { icon: Link2, text: "Routes support questions to your team, keeps sales for himself" },
                    { icon: Shield, text: "Guardrails you set. Never goes off-script" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-start gap-2.5">
                      <f.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{f.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-8 pt-5 border-t border-border/50">
                  {[
                    { value: "2x", label: "More sales" },
                    { value: "+35%", label: "Conversion rate" },
                    { value: "0", label: "Customers forgotten" },
                    { value: "24/7", label: "Always working" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="font-display text-xl font-bold text-primary">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            className="mt-12 text-center">
            <Button size="lg" onClick={() => navigate("/onboarding")} className="gap-2 px-8 h-12 text-base">
              Hire Sales Sammy <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section id="how-it-works" className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">How It Works</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Live in 15 minutes, not months</h2>
            <p className="text-lg text-muted-foreground max-w-xl mb-16">Four steps. No engineering required.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "10-minute interview", desc: "Tell us about your business, your customers, and how you write. Sammy learns your voice from real messages you've sent.", icon: Users },
              { step: "02", title: "Connect your channels", desc: "Plug in WhatsApp, email, your website, and more. Sammy starts listening for messages and capturing leads automatically.", icon: Link2 },
              { step: "03", title: "Add your existing contacts", desc: "Upload a CSV, connect a sheet, or sync from your CRM. Sammy starts working them immediately alongside new inbound leads.", icon: BarChart3 },
              { step: "04", title: "Sammy handles everything", desc: "New message comes in? Sammy responds. Existing lead goes quiet? Sammy follows up. You approve what goes out and watch the sales come in.", icon: Target },
            ].map((item, i) => (
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="relative">
                {i < 3 && <div className="hidden md:block absolute top-8 left-full w-full"><ChevronRight className="w-5 h-5 text-border -ml-2.5" /></div>}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-primary font-mono font-bold">{item.step}</span>
                <h3 className="font-display text-lg font-bold mt-1 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={5}
            className="mt-16 text-center">
            <Button size="lg" onClick={() => navigate("/onboarding")} className="gap-2 px-8 h-12 text-base">
              Start Your 10-Minute Setup <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ━━━ CHANNELS ━━━ */}
      <section id="channels" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">Deploy Everywhere</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Deploy Sammy to every channel</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Sammy listens on your channels for new messages and responds instantly. He also follows up with existing contacts across channels. One agent, everywhere your customers are.</p>
          </motion.div>

          {/* Channel grid with brand logos */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { name: "Email", color: "bg-red-500/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#EA4335"/></svg> },
              { name: "WhatsApp", color: "bg-green-500/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.1-1.13l-.29-.174-3.01.79.8-2.93-.19-.3A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="#25D366"/></svg> },
              { name: "LinkedIn", color: "bg-blue-700/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/></svg> },
              { name: "SMS", color: "bg-blue-500/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z" fill="#2196F3"/></svg> },
              { name: "Telegram", color: "bg-sky-500/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#229ED9"/></svg> },
              { name: "Slack", color: "bg-purple-500/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" fill="#E01E5A"/></svg> },
              { name: "Website", color: "bg-gray-500/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#6B7280"/></svg> },
              { name: "Facebook", color: "bg-blue-600/10", svg: <svg viewBox="0 0 24 24" className="w-7 h-7"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg> },
            ].map((ch) => (
              <div key={ch.name} className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", ch.color)}>
                  {ch.svg}
                </div>
                <span className="text-sm font-medium text-foreground">{ch.name}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">Pricing</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Costs less than a coffee a day</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">Hiring someone to follow up costs $135K/year. Sammy does it better, for a fraction of the price, and never takes a day off.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Starter", price: "$49", period: "/mo", desc: "For solo founders and small teams", touches: "500 touches/mo", extra: "$0.50 per extra",
                features: ["Sales Sammy (always on)", "Email + WhatsApp channels", "5 lead source connections", "Basic analytics", "Email support"],
                popular: false,
              },
              {
                name: "Growth", price: "$149", period: "/mo", desc: "For growing sales teams", touches: "2,000 touches/mo", extra: "$0.40 per extra",
                features: ["Everything in Starter", "All deployment channels", "15 lead source connections", "Advanced analytics + reports", "Priority support + Slack", "Custom brand voice tuning"],
                popular: true,
              },
              {
                name: "Scale", price: "$499", period: "/mo", desc: "For high-volume outbound", touches: "10,000 touches/mo", extra: "$0.30 per extra",
                features: ["Everything in Growth", "Unlimited lead sources", "Full analytics + API access", "Dedicated account manager", "Custom workflows", "SLA guarantees"],
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className={cn("rounded-2xl border-2 p-6 relative", plan.popular ? "border-primary bg-background shadow-lg" : "border-border bg-background")}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary text-primary-foreground">Most Popular</span>
                )}
                <div className="mb-6">
                  <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.desc}</p>
                  <div className="mt-4">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.touches}</p>
                  <p className="text-[10px] text-muted-foreground">{plan.extra}</p>
                </div>
                <Button onClick={() => navigate("/onboarding")} className={cn("w-full gap-2 mb-6")}
                  variant={plan.popular ? "default" : "outline"}>
                  Start with {plan.name} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <div className="space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> {f}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* SDR comparison */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="mt-12 rounded-xl bg-secondary p-6 max-w-2xl mx-auto">
            <h4 className="font-display font-semibold text-foreground mb-4 text-center">The math is simple</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Hiring someone</p>
                <p className="text-sm text-muted-foreground">$98K-$173K/year</p>
                <p className="text-sm text-muted-foreground">3 months before they're useful</p>
                <p className="text-sm text-muted-foreground">Works 8 hours, takes breaks</p>
                <p className="text-sm text-muted-foreground">Might leave after a year</p>
              </div>
              <div>
                <p className="text-xs text-primary uppercase tracking-wider mb-2">Sales Sammy</p>
                <p className="text-sm text-foreground font-medium">From $49/month</p>
                <p className="text-sm text-foreground font-medium">Ready in 15 minutes</p>
                <p className="text-sm text-foreground font-medium">Works 24/7, never stops</p>
                <p className="text-sm text-foreground font-medium">Never forgets a customer</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Every name on your list<br />is a potential sale
          </h2>
          <p className="text-lg opacity-80 mb-4 max-w-xl mx-auto">
            Cold prospect or warm lead, someone on your list is ready to buy. They just need to hear from you. Sammy makes sure they do. 15-minute setup, no credit card, results this week.
          </p>
          <p className="text-sm opacity-60 mb-10">
            Stop losing customers to silence. Start today.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/onboarding")} className="gap-2 px-8 h-12 text-base">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Sales Sammy" className="w-6 h-6 rounded" />
            <span className="font-display text-sm font-bold">Sales Sammy</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Sales Sammy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
