import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgentSetup } from "@/hooks/useAgentSetup";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { initDemoMode } = useAgentSetup();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  const handleDemoLogin = () => {
    initDemoMode();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Vaigence" className="w-10 h-10 brightness-0 invert" />
          <span className="font-display text-2xl font-bold">Vaigence</span>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">
            Your AI teammates<br />are waiting.
          </h1>
          <p className="text-lg opacity-80 max-w-md">
            Log in to manage your Sales, Support, and Success agents - track conversations, monitor performance, and grow revenue.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { value: "24/7", label: "Always on" },
            { value: "< 60s", label: "Response time" },
            { value: "3×", label: "Revenue impact" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src={logo} alt="Vaigence" className="w-8 h-8" />
            <span className="font-display text-xl font-bold">Vaigence</span>
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Log in to your Vaigence dashboard</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-12"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="rounded border-border" />
                Remember me
              </label>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full h-12 gap-2 text-base">
              Log in <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleDemoLogin}
            className="w-full h-12 gap-2 text-base border-dashed"
          >
            <Play className="w-4 h-4" /> Try Demo Dashboard
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <button onClick={() => navigate("/onboarding")} className="text-primary hover:underline font-medium">
              Get Started
            </button>
          </p>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
