import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", sales: 420, support: 580, success: 310 },
  { day: "Tue", sales: 510, support: 620, success: 340 },
  { day: "Wed", sales: 480, support: 710, success: 290 },
  { day: "Thu", sales: 620, support: 680, success: 380 },
  { day: "Fri", sales: 590, support: 750, success: 410 },
  { day: "Sat", sales: 340, support: 420, success: 190 },
  { day: "Sun", sales: 280, support: 380, success: 160 },
];

const PerformanceChart = () => (
  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
    <h3 className="font-display font-semibold text-foreground mb-4">Conversations Handled (7 days)</h3>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(24, 85%, 48%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(24, 85%, 48%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="supportGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(200, 80%, 45%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(200, 80%, 45%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
          <XAxis dataKey="day" stroke="hsl(220, 10%, 46%)" fontSize={12} />
          <YAxis stroke="hsl(220, 10%, 46%)" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(220, 13%, 88%)",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Area type="monotone" dataKey="support" stroke="hsl(200, 80%, 45%)" fill="url(#supportGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="sales" stroke="hsl(24, 85%, 48%)" fill="url(#salesGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="success" stroke="hsl(152, 60%, 42%)" fill="url(#successGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default PerformanceChart;
