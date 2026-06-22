/**
 * Mentor Workspace V2 — severity & state token canon.
 *
 * Single source of truth for the visual treatment of every operational tone
 * across the platform. Every page that surfaces severity, policy risk,
 * impact tier, AI confidence band, or workflow trend should map through
 * this file. The grammar is:
 *
 *   tone → { rail, chip, label }
 *
 * `rail`  — 3px-wide vertical bar color (Tailwind bg-*).
 * `chip`  — full chip class string (border + bg + text).
 * `label` — canonical label string for that tone.
 *
 * Adding a new tone to a surface? Extend this file first; never inline a
 * new color/label in a component.
 */

import type {
  AiConfidenceBand,
  RiskSeverity,
  SlaTier,
} from "@/mocks/data/mentor-workspace";

/* ─────────────────────── SLA tier tone ─────────────────────── */

export const slaTierToken: Record<
  SlaTier,
  { rail: string; chip: string; dot: string; label: string; pulse: boolean }
> = {
  breached: {
    rail: "bg-red-600",
    chip: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-600",
    label: "Breached",
    pulse: true,
  },
  critical: {
    rail: "bg-red-500",
    chip: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    label: "Critical",
    pulse: false,
  },
  warning: {
    rail: "bg-gold-500",
    chip: "border-gold-200 bg-gold-50 text-gold-700",
    dot: "bg-gold-500",
    label: "Warning",
    pulse: false,
  },
  watch: {
    rail: "bg-teal-400",
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    dot: "bg-teal-500",
    label: "Watch",
    pulse: false,
  },
  healthy: {
    rail: "bg-forest-500",
    chip: "border-forest-200 bg-forest-50 text-forest-700",
    dot: "bg-forest-500",
    label: "Healthy",
    pulse: false,
  },
};

/* ─────────────────────── Risk severity tone ─────────────────────── */

export const riskSeverityToken: Record<
  RiskSeverity,
  { rail: string; chip: string; label: string }
> = {
  high: {
    rail: "bg-red-500",
    chip: "border-red-200 bg-red-50 text-red-700",
    label: "High",
  },
  medium: {
    rail: "bg-gold-500",
    chip: "border-gold-200 bg-gold-50 text-gold-700",
    label: "Medium",
  },
  low: {
    rail: "bg-gray-300",
    chip: "border-gray-200 bg-gray-50 text-gray-600",
    label: "Low",
  },
};

/* ─────────────────────── Policy risk tone ─────────────────────── */

export type PolicyRiskTier = "critical" | "high" | "medium" | "low";

export const policyRiskToken: Record<
  PolicyRiskTier,
  { rail: string; chip: string; label: string }
> = {
  critical: {
    rail: "bg-red-600",
    chip: "border-red-300 bg-red-100 text-red-800",
    label: "Critical",
  },
  high: {
    rail: "bg-red-500",
    chip: "border-red-200 bg-red-50 text-red-700",
    label: "High",
  },
  medium: {
    rail: "bg-gold-500",
    chip: "border-gold-200 bg-gold-50 text-gold-700",
    label: "Medium",
  },
  low: {
    rail: "bg-gray-300",
    chip: "border-gray-200 bg-gray-50 text-gray-600",
    label: "Low",
  },
};

/* ─────────────────────── Operational impact tone ─────────────────────── */

export type ImpactTier = "critical" | "high" | "medium" | "low";

export const impactToken: Record<
  ImpactTier,
  { rail: string; chip: string; bg: string; label: string }
> = {
  critical: {
    rail: "bg-red-500",
    chip: "border-red-200 bg-red-50 text-red-700",
    bg: "border-red-200 bg-red-50/40",
    label: "Critical",
  },
  high: {
    rail: "bg-gold-500",
    chip: "border-gold-200 bg-gold-50 text-gold-700",
    bg: "border-gold-200 bg-gold-50/40",
    label: "High",
  },
  medium: {
    rail: "bg-teal-500",
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    bg: "border-teal-200 bg-teal-50/30",
    label: "Medium",
  },
  low: {
    rail: "bg-gray-300",
    chip: "border-gray-200 bg-gray-50 text-gray-600",
    bg: "border-gray-200 bg-gray-50/40",
    label: "Low",
  },
};

/* ─────────────────────── AI confidence band tone ─────────────────────── */

export const confidenceToken: Record<
  AiConfidenceBand,
  { bar: string; text: string; label: string }
> = {
  high: { bar: "bg-forest-500", text: "text-forest-700", label: "High" },
  medium: { bar: "bg-gold-500", text: "text-gold-700", label: "Medium" },
  low: { bar: "bg-red-500", text: "text-red-700", label: "Low" },
};

/**
 * Derive the confidence band from a 0–100 confidence number.
 * Canonical thresholds across the platform: ≥85 high · ≥65 medium · <65 low.
 */
export function bandFromConfidence(value: number): AiConfidenceBand {
  if (value >= 85) return "high";
  if (value >= 65) return "medium";
  return "low";
}

/* ─────────────────────── Workflow trend tone ─────────────────────── */

export type WorkflowTrend = "improving" | "flat" | "declining";

export const trendToken: Record<
  WorkflowTrend,
  { chip: string; text: string; glyph: "up" | "down" | "flat" }
> = {
  improving: { chip: "border-forest-200 bg-forest-50 text-forest-700", text: "text-forest-700", glyph: "up" },
  flat: { chip: "border-gray-200 bg-gray-50 text-gray-600", text: "text-gray-600", glyph: "flat" },
  declining: { chip: "border-red-200 bg-red-50 text-red-700", text: "text-red-700", glyph: "down" },
};

/* ─────────────────────── Reliability tone (contributor score) ───── */

/**
 * Canonical reliability bands across the platform.
 *  ≥80 forest · ≥65 gold · <65 red.
 * Use for contributor.reliability and any other 0–100 reliability score.
 */
export function reliabilityTone(value: number): {
  text: string;
  label: "strong" | "watch" | "at-risk";
} {
  if (value >= 80) return { text: "text-forest-700", label: "strong" };
  if (value >= 65) return { text: "text-gold-700", label: "watch" };
  return { text: "text-red-700", label: "at-risk" };
}

/* ─────────────────────── Canonical vocabulary ─────────────────────── */

/**
 * Canonical operator-facing labels. Use these instead of inlining strings.
 * If a label is wrong, change it here and every consumer updates.
 */
export const VOCAB = {
  // Time / SLA
  slaRemaining: "Resolution SLA",
  slaBreached: "SLA breached",
  slaCountdown: "SLA",
  timeOnHold: "Time on hold",
  resolutionSla: "Resolution SLA",

  // Identity
  governanceOwner: "Governance owner",
  reviewerOwner: "Reviewer",
  mentorOwner: "Mentor",
  contributor: "Contributor",

  // States
  awaitingClarification: "Awaiting clarification",
  clarificationPending: "Awaiting clarification",
  governanceConsultation: "Governance consultation",
  workflowHalted: "Workflow halted",

  // Audit
  auditable: "Auditable",
  signedAudit: "Signed · ledger-anchored",
  auditTimeline: "Audit timeline",

  // Risk
  riskScore: "Risk score",
  riskSeverity: "Risk severity",
  policyRisk: "Policy risk",
  governanceSeverity: "Governance severity",
  impactTier: "Impact tier",

  // AI
  aiConfidence: "AI confidence",
  aiRecommendation: "Recommendation",
  aiInsight: "AI insight",
  modelLabel: "Model v3.2",
} as const;

/* ─────────────────────── Operational kpi emphasis tone ───────────── */

export type KpiEmphasis = "critical" | "warning" | "default";

export const kpiEmphasisToken: Record<
  KpiEmphasis,
  { container: string; iconWrap: string; rail: string }
> = {
  critical: {
    container: "border-red-200 bg-gradient-to-br from-red-50/60 to-white",
    iconWrap: "border-red-200 bg-red-50 text-red-700",
    rail: "bg-red-500",
  },
  warning: {
    container: "border-gold-200 bg-gradient-to-br from-gold-50/60 to-white",
    iconWrap: "border-gold-200 bg-gold-50 text-gold-700",
    rail: "bg-gold-500",
  },
  default: {
    container: "border-gray-200 bg-white",
    iconWrap: "border-brown-200 bg-brown-50 text-brown-700",
    rail: "",
  },
};

/* ─────────────────────── Bucket tone (priority bars) ─────────────── */

export type BucketTone = "danger" | "warn" | "info" | "neutral" | "ok";

export const bucketToken: Record<
  BucketTone,
  { chip: string; chipDim: string; rail: string }
> = {
  danger: {
    chip: "border-red-200 bg-red-50 text-red-700",
    chipDim: "border-gray-200 bg-gray-50 text-gray-500",
    rail: "bg-red-500",
  },
  warn: {
    chip: "border-gold-200 bg-gold-50 text-gold-700",
    chipDim: "border-gray-200 bg-gray-50 text-gray-500",
    rail: "bg-gold-500",
  },
  info: {
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    chipDim: "border-gray-200 bg-gray-50 text-gray-500",
    rail: "bg-teal-500",
  },
  neutral: {
    chip: "border-brown-200 bg-brown-50 text-brown-700",
    chipDim: "border-gray-200 bg-gray-50 text-gray-500",
    rail: "bg-brown-500",
  },
  ok: {
    chip: "border-forest-200 bg-forest-50 text-forest-700",
    chipDim: "border-gray-200 bg-gray-50 text-gray-500",
    rail: "bg-forest-500",
  },
};
