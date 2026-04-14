import {
  Mail, MessageCircle, Phone, Linkedin, Send,
  Info, CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";

// ── API ──
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const ORG_KEY = "vaigence_org_id";

// ── Contact-status colours (bg-* classes for dots / badges) ──
export const STATUS_COLORS: Record<string, string> = {
  queued: "bg-muted-foreground",
  active: "bg-primary",
  paused: "bg-warning",
  replied: "bg-success",
  converted: "bg-emerald-500",
  completed: "bg-muted-foreground",
  opted_out: "bg-destructive",
  lost: "bg-destructive/60",
};

// ── Contact-status display labels ──
export const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  active: "In Sequence",
  paused: "Paused",
  replied: "Replied",
  converted: "Converted",
  completed: "Completed",
  opted_out: "Opted Out",
  lost: "Lost",
};

// ── Activity-log status styling (text-* classes for icons) ──
export const ACTIVITY_STATUS_ICONS: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  pending: Clock,
};
export const ACTIVITY_STATUS_COLORS: Record<string, string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  pending: "text-primary",
};

// ── Channel configuration ──
export const CHANNEL_CONFIG: Record<string, { icon: typeof Mail; label: string; color: string }> = {
  email: { icon: Mail, label: "Email", color: "text-blue-500" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-green-500" },
  sms: { icon: Phone, label: "SMS", color: "text-purple-500" },
  linkedin: { icon: Linkedin, label: "LinkedIn", color: "text-sky-600" },
  telegram: { icon: Send, label: "Telegram", color: "text-blue-400" },
};
