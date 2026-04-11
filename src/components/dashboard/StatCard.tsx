import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  colorClass?: string;
}

const StatCard = ({ label, value, change, icon: Icon, colorClass = "text-primary" }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl border border-border bg-card p-5 shadow-sm"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-display font-bold mt-1 text-foreground">{value}</p>
        {change && (
          <p className={cn("text-xs mt-1 font-medium", colorClass)}>{change}</p>
        )}
      </div>
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-secondary", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

export default StatCard;
