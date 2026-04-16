import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MessageCircle, Phone, Linkedin, Send,
  Shield, Quote, ArrowRight, Zap, AlertTriangle,
  RotateCcw, ChevronDown, ChevronUp, Target,
} from "lucide-react";
import { useState } from "react";
import type { FlowPreview as FlowPreviewType, ConfigChange, SequencePreview } from "@/services/api";
import { cn } from "@/lib/utils";

// ── Channel visual config ──

const CHANNEL_VISUAL: Record<string, { icon: typeof Mail; label: string; bg: string; text: string; border: string }> = {
  email:     { icon: Mail,           label: "Email",    bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200" },
  whatsapp:  { icon: MessageCircle,  label: "WhatsApp", bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
  sms:       { icon: Phone,          label: "SMS",      bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  linkedin:  { icon: Linkedin,       label: "LinkedIn", bg: "bg-sky-50",    text: "text-sky-600",    border: "border-sky-200" },
  telegram:  { icon: Send,           label: "Telegram", bg: "bg-blue-50",   text: "text-blue-500",   border: "border-blue-200" },
};

const ANGLE_LABELS: Record<string, string> = {
  intro: "Introduction",
  value_add: "Value Add",
  social_proof: "Social Proof",
  case_study: "Case Study",
  check_in: "Check-in",
  break_up: "Final Follow-up",
  pain_point: "Pain Point",
  fomo: "Urgency",
  personalized: "Personalized",
  referral: "Referral Ask",
};

function getChannelVisual(channel: string) {
  return CHANNEL_VISUAL[channel] || CHANNEL_VISUAL.email;
}

// ── Sequence Timeline ──

function SequenceTimeline({ sequence }: { sequence: SequencePreview }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            sequence.active ? "bg-success" : "bg-muted-foreground"
          )} />
          <span className="font-medium text-sm text-foreground">
            {sequence.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {sequence.touches.length} touch{sequence.touches.length !== 1 ? "es" : ""} over {sequence.touches.length > 0 ? sequence.touches[sequence.touches.length - 1].day_offset : 0} days
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Visual timeline */}
              <div className="relative flex items-start gap-0 overflow-x-auto pb-2 pt-2">
                {sequence.touches.map((touch, i) => {
                  const ch = getChannelVisual(touch.channel_resolved);
                  const Icon = ch.icon;
                  const isLast = i === sequence.touches.length - 1;
                  const dayGap = i > 0 ? touch.day_offset - sequence.touches[i - 1].day_offset : touch.day_offset;

                  return (
                    <div key={i} className="flex items-start shrink-0">
                      {/* Connector line with day gap */}
                      {i > 0 && (
                        <div className="flex flex-col items-center justify-center px-1.5 pt-5">
                          <div className="h-px w-8 bg-border relative">
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                              +{dayGap}d
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Touch node */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex flex-col items-center gap-1.5 min-w-[80px]"
                      >
                        {/* Day label */}
                        <span className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">
                          Day {touch.day_offset}
                        </span>

                        {/* Channel icon bubble */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border",
                          ch.bg, ch.border
                        )}>
                          <Icon className={cn("w-4.5 h-4.5", ch.text)} />
                        </div>

                        {/* Channel label */}
                        <span className={cn("text-[11px] font-medium", ch.text)}>
                          {ch.label}
                        </span>

                        {/* Angle */}
                        <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[72px]">
                          {ANGLE_LABELS[touch.angle] || touch.angle.replace(/_/g, " ")}
                        </span>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Change Summary Cards ──

function ChangeSummary({ changes, onUndo }: { changes: ConfigChange[]; onUndo?: (revisionId: string) => void }) {
  if (changes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 px-1">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
          {changes.length} change{changes.length !== 1 ? "s" : ""} made
        </span>
      </div>

      {changes.map((change, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-lg border border-primary/15 bg-primary/[0.03] px-3.5 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{change.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{change.detail}</p>

              {change.before && change.after && change.before !== change.after && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-muted-foreground line-through truncate max-w-[120px]">{change.before}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-foreground font-medium truncate max-w-[120px]">{change.after}</span>
                </div>
              )}
            </div>

            {change.revision_id && onUndo && (
              <button
                onClick={() => onUndo(change.revision_id!)}
                className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded hover:bg-destructive/5"
              >
                <RotateCcw className="w-3 h-3" />
                Undo
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Guardrails & Voice ──

function GuardrailsSection({ guardrails }: { guardrails: string[] }) {
  if (guardrails.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-3.5 h-3.5 text-warning" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Guardrails</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {guardrails.map((g, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-[11px] font-medium border border-warning/20">
            <AlertTriangle className="w-3 h-3" />
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}

function VoiceSection({ examples }: { examples: string[] }) {
  if (examples.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Quote className="w-3.5 h-3.5 text-info" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Voice</span>
      </div>
      <div className="space-y-1.5">
        {examples.map((e, i) => (
          <p key={i} className="text-xs text-muted-foreground italic pl-3 border-l-2 border-info/30">
            "{e}"
          </p>
        ))}
      </div>
    </div>
  );
}

function OverridesSection({ overrides }: { overrides: FlowPreviewType["overrides"] }) {
  if (overrides.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Channel & Segment Overrides</span>
      </div>
      <div className="space-y-1.5">
        {overrides.map((o, i) => {
          const ch = o.scope_type === "channel" ? getChannelVisual(o.scope_id) : null;
          return (
            <div key={i} className="flex items-start gap-2 text-xs">
              {ch ? (
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", ch.bg, ch.text, ch.border)}>
                  {ch.label}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                  {o.scope_type}: {o.scope_id}
                </span>
              )}
              <span className="text-muted-foreground">
                {o.instruction_additions || o.persona_additions || "Custom behavior"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main FlowPreview Component ──

interface FlowPreviewProps {
  flowPreview: FlowPreviewType;
  changes: ConfigChange[];
  onUndo?: (revisionId: string) => void;
}

const FlowPreview = ({ flowPreview, changes, onUndo }: FlowPreviewProps) => {
  const { teammate, sequences, guardrails, voice_examples, overrides } = flowPreview;
  const activeSequences = sequences.filter(s => s.active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 mt-2"
    >
      {/* Changes summary */}
      <ChangeSummary changes={changes} onUndo={onUndo} />

      {/* Goal bar */}
      {teammate.goal && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
          <Target className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs text-foreground"><span className="font-medium">Goal:</span> {teammate.goal}</span>
        </div>
      )}

      {/* Sequence timelines */}
      {activeSequences.map(seq => (
        <SequenceTimeline key={seq.template_key} sequence={seq} />
      ))}

      {/* Guardrails */}
      <GuardrailsSection guardrails={guardrails} />

      {/* Voice examples */}
      <VoiceSection examples={voice_examples} />

      {/* Channel overrides */}
      <OverridesSection overrides={overrides} />
    </motion.div>
  );
};

export default FlowPreview;
