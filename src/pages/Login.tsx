import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Play, Loader2 } from "lucide-react";
import { ORG_KEY, API_BASE } from "@/lib/constants";
import { DEMO_ORG_ID } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authLogin, setAuthToken } from "@/services/api";
import logo from "@/assets/branding/mark-dark.svg";
import logoLight from "@/assets/branding/mark-on-dark.svg";


const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);
    try {
      const res = await authLogin(email, password);
      if (res.access_token) {
        setAuthToken(res.access_token, res.refresh_token || undefined);
      }
      if (res.org_id) {
        localStorage.setItem(ORG_KEY, res.org_id);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
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
      // Backend not running — use demo mode
      localStorage.setItem(ORG_KEY, DEMO_ORG_ID);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex w-1/2 bg-primary text-primary-foreground flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <img src={logoLight} alt="Sales Sammy" className="w-9 h-9 rounded-lg" />
          <span className="font-display text-xl font-bold">Sales Sammy</span>
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight mb-3">
            Your teammate is<br />working right now.
          </h1>
          <p className="text-base opacity-80 max-w-md">
            Log in to see what your follow-up teammate has been doing. Drafts ready for approval, replies handled, pipeline moving.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "24/7", label: "Always following up" },
            { value: "80%", label: "Sales need 5+ touches" },
            { value: "100x", label: "Better if you reply in 5 min" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <img src={logo} alt="Sales Sammy" className="w-8 h-8 rounded-md" />
            <span className="font-display text-xl font-bold">Sales Sammy</span>
          </div>

          <h2 className="font-display text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">Log in to your Sales Sammy dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" className="rounded border-border" /> Remember me</label>
              <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loginLoading} className="w-full h-10 gap-2">{loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Log in <ArrowRight className="w-4 h-4" /></Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or</span></div>
          </div>

          <Button variant="outline" onClick={handleDemoLogin} disabled={demoLoading} className="w-full h-10 gap-2 border-dashed">
            {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Try Demo Dashboard
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button onClick={() => navigate("/onboarding")} className="text-primary hover:underline font-medium">Get Started</button>
          </p>

          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 mx-auto">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
