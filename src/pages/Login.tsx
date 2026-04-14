import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Play, Loader2 } from "lucide-react";
import { ORG_KEY, API_BASE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/branding/mark-dark.svg";


const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    autoDetectOrg().then(() => navigate("/dashboard"));
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    await autoDetectOrg();
    setDemoLoading(false);
    navigate("/dashboard");
  };

  const autoDetectOrg = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/demo`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(ORG_KEY, data.id);
      }
    } catch {
      // Backend not running, proceed anyway
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Sales Sammy" className="w-9 h-9 rounded-md brightness-0 invert" />
          <span className="text-xl font-semibold">Sales Sammy</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight mb-4">
            Your teammate is<br />working right now.
          </h1>
          <p className="text-lg opacity-80 max-w-md leading-relaxed">
            Log in to see what your follow-up teammate has been doing. Drafts ready for approval, replies handled, pipeline moving.
          </p>
        </div>
        <div className="flex gap-10 pt-6 border-t border-white/20">
          {[
            { value: "24/7", label: "Always following up" },
            { value: "80%", label: "Sales need 5+ touches" },
            { value: "100x", label: "Better if you reply in 5 min" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-sm opacity-70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src={logo} alt="Sales Sammy" className="w-8 h-8 rounded-md" />
            <span className="text-lg font-semibold">Sales Sammy</span>
          </div>

          <h2 className="text-3xl font-semibold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Log in to your Sales Sammy dashboard</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" className="rounded border-border" /> Remember me</label>
              <button type="button" className="text-sm text-primary hover:underline">Forgot password?</button>
            </div>
            <Button type="submit" className="w-full h-11 gap-2">Log in <ArrowRight className="w-4 h-4" /></Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or</span></div>
          </div>

          <Button variant="outline" onClick={handleDemoLogin} disabled={demoLoading} className="w-full h-11 gap-2 border-border border-dashed">
            {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Try Demo Dashboard
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <button onClick={() => navigate("/onboarding")} className="text-primary hover:underline font-medium">Get Started</button>
          </p>

          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 mx-auto">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
