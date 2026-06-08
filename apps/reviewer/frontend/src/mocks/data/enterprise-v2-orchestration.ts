/**
 * Enterprise Portal V2 — Orchestration mock.
 *
 * Lightweight SOW + Project shape that complements the unified contributor
 * task store. Enterprise V2 surfaces project tiles, SOW approval state,
 * and budget envelopes derived from the same task universe Contributor
 * and Mentor V2 read from.
 *
 * Mock-only. Phase 1B keeps Enterprise V2 as a projection layer over the
 * existing unified task store — no separate Enterprise data ecosystem.
 */

import type { ContributorPriority } from "./contributor-workspace";

/* ─────────────────────── SOW model ─────────────────────── */

export type SowState =
  | "draft"
  | "in_review"
  | "approval"
  | "approved"
  | "decomposing"
  | "in_delivery"
  | "completed";

export type SowApprovalStage =
  | "business"
  | "commercial"
  | "legal"
  | "security"
  | "final";

export interface SowApprovalGate {
  stage: SowApprovalStage;
  label: string;
  status: "pending" | "in_review" | "approved" | "blocked";
  decidedAt?: string;
}

export type DeliveryClassification =
  | "design_system"
  | "platform_engineering"
  | "data_reporting"
  | "mobile_platform"
  | "accessibility_uplift"
  | "compliance_evidence";

export interface ComplianceReadiness {
  framework: "SOC2" | "GDPR" | "HIPAA" | "ISO27001" | "PODL" | "ESG";
  status: "ready" | "needs_evidence" | "blocked" | "not_required";
  detail?: string;
}

export interface WorkforceImpact {
  estimatedTasks: number;
  estimatedSkills: string[];
  estimatedDuration: string;
  capacityPctOfQuarter: number;
}

export interface ScopeSummary {
  oneLiner: string;
  keyDeliverables: string[];
  outOfScope: string[];
  assumptions: string[];
}

export interface SowAiObservation {
  id: string;
  kind: "scope" | "complexity" | "risk" | "compliance" | "workforce";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface EnterpriseSow {
  id: string;
  title: string;
  client: string;
  portfolio: string;
  state: SowState;
  riskScore: number;
  budget: number;
  committed: number;
  approvalStages: SowApprovalGate[];
  createdAt: string;
  approvedAt?: string;
  ownerInitials: string;
  taskIds: string[];
  // SOW workspace detail fields (Phase 1B)
  classification: DeliveryClassification;
  scope: ScopeSummary;
  compliance: ComplianceReadiness[];
  workforce: WorkforceImpact;
  aiObservations: SowAiObservation[];
  decompositionReadiness: number; // 0–100
}

/* ─────────────────────── Project model ─────────────────────── */

export type ProjectHealth = "on_track" | "watch" | "at_risk" | "completed";

export interface EnterpriseProject {
  id: string;
  sowId: string;
  title: string;
  client: string;
  portfolio: string;
  startedAt: string;
  targetDate: string;
  health: ProjectHealth;
  budget: number; // cents
  spent: number; // cents
  milestones: { id: string; label: string; status: "done" | "active" | "upcoming" }[];
  taskIds: string[]; // links into unified task store
  ownerInitials: string;
}

/* ─────────────────────── Operational alerts ─────────────────────── */

export type AlertSeverity = "info" | "watch" | "warning" | "critical";

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  source: "delivery" | "governance" | "compliance" | "financial" | "workforce";
  raisedAt: string;
  linkLabel?: string;
  linkHref?: string;
}

/* ─────────────────────── Billing snapshot ─────────────────────── */

export interface BillingSnapshot {
  quarterToDate: number; // cents
  quarterBudget: number; // cents
  outstandingInvoices: { count: number; total: number };
  pendingPayouts: { count: number; total: number };
  upcomingInvoiceDate: string;
}

/* ─────────────────────── Canonical mocks ─────────────────────── */

const cents = (dollars: number) => Math.round(dollars * 100);

export const enterpriseSows: EnterpriseSow[] = [];

export const enterpriseProjects: EnterpriseProject[] = [];

export const enterpriseAlerts: OperationalAlert[] = [];

export const billingSnapshot: BillingSnapshot = {
  quarterToDate: cents(63_280),
  quarterBudget: cents(184_500),
  outstandingInvoices: { count: 4, total: cents(14_240) },
  pendingPayouts: { count: 7, total: cents(5_960) },
  upcomingInvoiceDate: "Jun 3, 2026",
};

/* ─────────────────────── Helpers ─────────────────────── */

export function formatMoney(c: number): string {
  const v = c / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatMoneyDetailed(c: number): string {
  const v = c / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function sowStateTone(s: SowState): { chip: string; label: string } {
  switch (s) {
    case "draft":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Draft" };
    case "in_review":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "In review" };
    case "approval":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Approval gates" };
    case "approved":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", label: "Approved" };
    case "decomposing":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", label: "Decomposing" };
    case "in_delivery":
      return { chip: "border-brown-200 bg-brown-50 text-brown-800", label: "In delivery" };
    case "completed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Completed" };
  }
}

export function projectHealthTone(h: ProjectHealth): { chip: string; bar: string; label: string } {
  switch (h) {
    case "on_track":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", bar: "bg-forest-500", label: "On track" };
    case "watch":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", bar: "bg-gold-500", label: "Watch" };
    case "at_risk":
      return { chip: "border-brown-300 bg-brown-50 text-brown-800", bar: "bg-brown-500", label: "At risk" };
    case "completed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", bar: "bg-forest-400", label: "Completed" };
  }
}

export function alertSeverityTone(s: AlertSeverity): { chip: string; ring: string; tint: string; label: string } {
  switch (s) {
    case "critical":
      return {
        chip: "border-brown-300 bg-brown-50 text-brown-800",
        ring: "ring-brown-200 bg-brown-50",
        tint: "text-brown-700",
        label: "Critical",
      };
    case "warning":
      return {
        chip: "border-gold-300 bg-gold-50 text-gold-800",
        ring: "ring-gold-200 bg-gold-50",
        tint: "text-gold-700",
        label: "Warning",
      };
    case "watch":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-700",
        ring: "ring-gold-200 bg-gold-50",
        tint: "text-gold-700",
        label: "Watch",
      };
    case "info":
      return {
        chip: "border-beige-200 bg-beige-50 text-beige-700",
        ring: "ring-beige-200 bg-beige-50",
        tint: "text-beige-700",
        label: "Info",
      };
  }
}

export function classificationLabel(c: DeliveryClassification): string {
  switch (c) {
    case "design_system":
      return "Design system";
    case "platform_engineering":
      return "Platform engineering";
    case "data_reporting":
      return "Data + reporting";
    case "mobile_platform":
      return "Mobile platform";
    case "accessibility_uplift":
      return "Accessibility uplift";
    case "compliance_evidence":
      return "Compliance evidence";
  }
}

export function complianceTone(
  s: ComplianceReadiness["status"],
): { chip: string; label: string } {
  switch (s) {
    case "ready":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Ready" };
    case "needs_evidence":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Needs evidence" };
    case "blocked":
      return { chip: "border-brown-300 bg-brown-50 text-brown-800", label: "Blocked" };
    case "not_required":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "N/A" };
  }
}

export function riskScoreTone(
  score: number,
): { chip: string; bar: string; label: string } {
  if (score >= 60) return { chip: "border-brown-300 bg-brown-50 text-brown-800", bar: "bg-brown-500", label: "High risk" };
  if (score >= 35) return { chip: "border-gold-200 bg-gold-50 text-gold-800", bar: "bg-gold-500", label: "Watch" };
  return { chip: "border-forest-200 bg-forest-50 text-forest-700", bar: "bg-forest-500", label: "Low risk" };
}

/* Re-exports of types used by hooks/components downstream */
export type { ContributorPriority };
