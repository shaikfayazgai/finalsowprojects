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
  | "glimmora_commercial"
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

export const enterpriseSows: EnterpriseSow[] = [
  {
    id: "sow-helios-2026q2",
    title: "Helios Design System · component library expansion",
    client: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    state: "in_delivery",
    riskScore: 32,
    budget: cents(48_000),
    committed: cents(32_400),
    approvalStages: [
      { stage: "business", label: "Business", status: "approved", decidedAt: "Mar 14" },
      { stage: "commercial", label: "Commercial", status: "approved", decidedAt: "Mar 16" },
      { stage: "legal", label: "Legal", status: "approved", decidedAt: "Mar 19" },
      { stage: "security", label: "Security", status: "approved", decidedAt: "Mar 21" },
      { stage: "final", label: "Final", status: "approved", decidedAt: "Mar 22" },
    ],
    createdAt: "Mar 8, 2026",
    approvedAt: "Mar 22, 2026",
    ownerInitials: "JM",
    taskIds: ["t-4821", "t-4711", "t-4622", "t-4188"],
    classification: "design_system",
    scope: {
      oneLiner: "Expand the Helios design system with accessible primitives and tokenized variants for the enterprise foundation tier.",
      keyDeliverables: [
        "20+ accessible component primitives (date picker · buttons · empty states · forms)",
        "WCAG 2.2 AA compliance across the component surface",
        "Storybook documentation + visual regression coverage",
        "Adoption pilot with two internal product teams",
      ],
      outOfScope: ["Theming system rewrite", "Mobile-specific component variants"],
      assumptions: ["Token foundation v2 is stable", "JAWS verification provided by Acme"],
    },
    compliance: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "ready" },
      { framework: "PODL", status: "ready", detail: "PODL contributors flagged across the SOW" },
    ],
    workforce: {
      estimatedTasks: 24,
      estimatedSkills: ["React L3", "Accessibility WCAG 2.2", "Design Systems L2"],
      estimatedDuration: "12 weeks",
      capacityPctOfQuarter: 18,
    },
    aiObservations: [
      {
        id: "obs-helios-1",
        kind: "complexity",
        title: "Above-average accessibility scope detected",
        detail: "9 of 20 deliverables reference accessibility primitives. Plan for JAWS verification on every component.",
        confidence: "high",
        source: "Scope-text pattern scan",
      },
      {
        id: "obs-helios-2",
        kind: "workforce",
        title: "L3 React + L3 a11y mix required",
        detail: "Match Amelia Stone's specialization. One additional L3 a11y contributor recommended for coverage.",
        confidence: "medium",
        source: "Workforce skill-gap analysis",
      },
    ],
    decompositionReadiness: 100,
  },
  {
    id: "sow-stratum-onboarding",
    title: "Stratum-Pay · onboarding wizard rebuild",
    client: "Stratum-Pay",
    portfolio: "Onboarding",
    state: "in_delivery",
    riskScore: 41,
    budget: cents(22_000),
    committed: cents(14_800),
    approvalStages: [
      { stage: "business", label: "Business", status: "approved", decidedAt: "Apr 2" },
      { stage: "commercial", label: "Commercial", status: "approved", decidedAt: "Apr 4" },
      { stage: "legal", label: "Legal", status: "approved", decidedAt: "Apr 8" },
      { stage: "security", label: "Security", status: "approved", decidedAt: "Apr 9" },
      { stage: "final", label: "Final", status: "approved", decidedAt: "Apr 10" },
    ],
    createdAt: "Mar 28, 2026",
    approvedAt: "Apr 10, 2026",
    ownerInitials: "RM",
    taskIds: ["t-3417", "t-3970"],
    classification: "platform_engineering",
    scope: {
      oneLiner: "Rebuild Stratum-Pay's onboarding wizard with client-side validation and progressive disclosure.",
      keyDeliverables: [
        "5-step wizard with field-level validation",
        "Validation rule extraction utility",
        "Onboarding tooltip + product tour",
        "≥80% unit test coverage",
      ],
      outOfScope: ["Backend onboarding API changes", "KYC/identity vendor integration"],
      assumptions: ["Validation library choice: zod", "Existing design tokens reused as-is"],
    },
    compliance: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "ready", detail: "Personal-data flows in validation only" },
    ],
    workforce: {
      estimatedTasks: 12,
      estimatedSkills: ["React L2-L3", "TypeScript L3", "Testing L2"],
      estimatedDuration: "8 weeks",
      capacityPctOfQuarter: 8,
    },
    aiObservations: [
      {
        id: "obs-stratum-1",
        kind: "scope",
        title: "Scope is tight and well-bounded",
        detail: "Clear deliverable boundaries with explicit out-of-scope. Low scope-creep risk.",
        confidence: "high",
        source: "Scope-density analysis",
      },
    ],
    decompositionReadiness: 100,
  },
  {
    id: "sow-lighthouse-reporting",
    title: "Lighthouse-Ops · reporting + analytics suite",
    client: "Lighthouse-Ops",
    portfolio: "Reporting",
    state: "approval",
    riskScore: 58,
    budget: cents(36_500),
    committed: cents(0),
    approvalStages: [
      { stage: "business", label: "Business", status: "approved", decidedAt: "May 12" },
      { stage: "commercial", label: "Commercial", status: "approved", decidedAt: "May 14" },
      { stage: "legal", label: "Legal", status: "in_review" },
      { stage: "security", label: "Security", status: "pending" },
      { stage: "final", label: "Final", status: "pending" },
    ],
    createdAt: "May 6, 2026",
    ownerInitials: "HP",
    taskIds: [],
    classification: "data_reporting",
    scope: {
      oneLiner: "Build a reporting + analytics suite covering rate-limit telemetry, usage analytics, and exportable dashboards.",
      keyDeliverables: [
        "API rate-limit telemetry dashboard",
        "Usage analytics with per-route breakdowns",
        "CSV/PDF export pipeline",
        "Locale-aware date and currency formatting",
      ],
      outOfScope: ["BI tool integration (Tableau, Looker)", "Real-time streaming analytics"],
      assumptions: ["Lighthouse provides anonymized aggregated data", "Locale data is read from user session"],
    },
    compliance: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "needs_evidence", detail: "Legal review of cross-region aggregation pending" },
      { framework: "ISO27001", status: "ready" },
    ],
    workforce: {
      estimatedTasks: 18,
      estimatedSkills: ["TypeScript L3", "Data viz L2", "React L3"],
      estimatedDuration: "10 weeks",
      capacityPctOfQuarter: 14,
    },
    aiObservations: [
      {
        id: "obs-lighthouse-1",
        kind: "compliance",
        title: "GDPR evidence pending — blocking legal gate",
        detail: "Cross-region aggregation triggers GDPR scrutiny. Provide DPIA document to unblock the legal review.",
        confidence: "high",
        source: "Compliance framework check",
      },
      {
        id: "obs-lighthouse-2",
        kind: "risk",
        title: "Risk score 58 driven by scope ambiguity",
        detail: "Export pipeline format is loosely specified. Recommend a scope-clarification round before approval.",
        confidence: "medium",
        source: "Scope-ambiguity scan",
      },
    ],
    decompositionReadiness: 60,
  },
  {
    id: "sow-atlas-mobile",
    title: "Atlas-Insights · mobile platform expansion",
    client: "Atlas-Insights",
    portfolio: "Mobile",
    state: "in_delivery",
    riskScore: 28,
    budget: cents(58_000),
    committed: cents(40_200),
    approvalStages: [
      { stage: "business", label: "Business", status: "approved", decidedAt: "Feb 3" },
      { stage: "commercial", label: "Commercial", status: "approved", decidedAt: "Feb 5" },
      { stage: "legal", label: "Legal", status: "approved", decidedAt: "Feb 8" },
      { stage: "security", label: "Security", status: "approved", decidedAt: "Feb 10" },
      { stage: "final", label: "Final", status: "approved", decidedAt: "Feb 11" },
    ],
    createdAt: "Jan 28, 2026",
    approvedAt: "Feb 11, 2026",
    ownerInitials: "PI",
    taskIds: ["t-3711", "t-3601", "t-2114"],
    classification: "mobile_platform",
    scope: {
      oneLiner: "Expand Atlas mobile platform with notification infrastructure, engagement metrics, and beta release readiness.",
      keyDeliverables: [
        "FCM + APNS push adapters with retry policy",
        "Notification center with read/unread state",
        "Engagement metrics dashboard",
        "Beta release pipeline",
      ],
      outOfScope: ["iOS-specific UX polish", "Marketing notification campaigns"],
      assumptions: ["FCM/APNS credentials provided by Atlas", "Existing analytics pipeline reused"],
    },
    compliance: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "ready" },
      { framework: "HIPAA", status: "not_required" },
    ],
    workforce: {
      estimatedTasks: 20,
      estimatedSkills: ["Mobile L3", "React L3", "TypeScript L3"],
      estimatedDuration: "16 weeks",
      capacityPctOfQuarter: 22,
    },
    aiObservations: [
      {
        id: "obs-atlas-1",
        kind: "scope",
        title: "Largest in-flight SOW — well sequenced",
        detail: "16-week duration with 4 milestone-aligned deliverables. Pacing reads sustainable.",
        confidence: "high",
        source: "Duration vs scope analysis",
      },
    ],
    decompositionReadiness: 100,
  },
  {
    id: "sow-helios-core-search",
    title: "Helios-Core · search & shortcuts",
    client: "Helios-Core",
    portfolio: "Enterprise Foundations",
    state: "completed",
    riskScore: 18,
    budget: cents(14_500),
    committed: cents(14_500),
    approvalStages: [
      { stage: "business", label: "Business", status: "approved", decidedAt: "Mar 30" },
      { stage: "commercial", label: "Commercial", status: "approved", decidedAt: "Apr 1" },
      { stage: "legal", label: "Legal", status: "approved", decidedAt: "Apr 3" },
      { stage: "security", label: "Security", status: "approved", decidedAt: "Apr 4" },
      { stage: "final", label: "Final", status: "approved", decidedAt: "Apr 5" },
    ],
    createdAt: "Mar 26, 2026",
    approvedAt: "Apr 5, 2026",
    ownerInitials: "RV",
    taskIds: ["t-4188"],
    classification: "accessibility_uplift",
    scope: {
      oneLiner: "Add Cmd-K search invocation, arrow navigation, and recent-searches caching to Helios-Core.",
      keyDeliverables: [
        "Cmd-K invocation pattern",
        "Arrow key navigation across results",
        "Recent searches caching layer",
        "Accessibility pass · Esc-to-close from any focused option",
      ],
      outOfScope: ["Search backend changes", "Result-ranking algorithm"],
      assumptions: ["Existing search API stable", "Accessibility patterns reused from date picker"],
    },
    compliance: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "ready" },
    ],
    workforce: {
      estimatedTasks: 6,
      estimatedSkills: ["React L3", "Accessibility WCAG 2.2"],
      estimatedDuration: "5 weeks",
      capacityPctOfQuarter: 5,
    },
    aiObservations: [
      {
        id: "obs-helios-core-1",
        kind: "complexity",
        title: "Completed on time and on budget",
        detail: "Reference SOW for future scoping — clean scope, tight execution.",
        confidence: "high",
        source: "Completed SOW analysis",
      },
    ],
    decompositionReadiness: 100,
  },
  {
    id: "sow-acme-onboarding-helpers",
    title: "Acme-Helios · onboarding tooltip + tour",
    client: "Acme-Helios",
    portfolio: "Onboarding",
    state: "draft",
    riskScore: 22,
    budget: cents(8_800),
    committed: cents(0),
    approvalStages: [
      { stage: "business", label: "Business", status: "pending" },
      { stage: "commercial", label: "Commercial", status: "pending" },
      { stage: "legal", label: "Legal", status: "pending" },
      { stage: "security", label: "Security", status: "pending" },
      { stage: "final", label: "Final", status: "pending" },
    ],
    createdAt: "May 22, 2026",
    ownerInitials: "JM",
    taskIds: [],
    classification: "platform_engineering",
    scope: {
      oneLiner: "Add onboarding tooltip and product tour to Acme-Helios surfaces — light-touch, high-impact.",
      keyDeliverables: [
        "Sequenced product tour with skip + dismiss",
        "Returning-user detection (no re-prompt)",
        "Analytics on tour completion",
      ],
      outOfScope: ["Persistent in-product help center", "Multi-language tour content"],
      assumptions: ["Existing analytics pipeline reused", "Tour content provided by Acme content team"],
    },
    compliance: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "ready" },
    ],
    workforce: {
      estimatedTasks: 5,
      estimatedSkills: ["React L2", "UX writing L2"],
      estimatedDuration: "4 weeks",
      capacityPctOfQuarter: 3,
    },
    aiObservations: [
      {
        id: "obs-acme-1",
        kind: "scope",
        title: "Tight scope · ready for approval gates",
        detail: "Single-track scope with clear assumptions. Ready to enter business approval.",
        confidence: "high",
        source: "Scope clarity check",
      },
    ],
    decompositionReadiness: 80,
  },
];

export const enterpriseProjects: EnterpriseProject[] = [
  {
    id: "proj-helios-ds-q2",
    sowId: "sow-helios-2026q2",
    title: "Helios DS · component expansion",
    client: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    startedAt: "Mar 24, 2026",
    targetDate: "Jun 28, 2026",
    health: "watch",
    budget: cents(48_000),
    spent: cents(32_400),
    milestones: [
      { id: "m1", label: "Core components", status: "done" },
      { id: "m2", label: "Accessible patterns", status: "active" },
      { id: "m3", label: "Documentation", status: "upcoming" },
      { id: "m4", label: "Adoption pilot", status: "upcoming" },
    ],
    taskIds: ["t-4821", "t-4711", "t-4622"],
    ownerInitials: "JM",
  },
  {
    id: "proj-stratum-onboarding",
    sowId: "sow-stratum-onboarding",
    title: "Stratum-Pay onboarding rebuild",
    client: "Stratum-Pay",
    portfolio: "Onboarding",
    startedAt: "Apr 12, 2026",
    targetDate: "Jun 14, 2026",
    health: "on_track",
    budget: cents(22_000),
    spent: cents(14_800),
    milestones: [
      { id: "m1", label: "Wizard structure", status: "done" },
      { id: "m2", label: "Validation flows", status: "active" },
      { id: "m3", label: "Testing + polish", status: "upcoming" },
    ],
    taskIds: ["t-3417", "t-3970"],
    ownerInitials: "RM",
  },
  {
    id: "proj-atlas-mobile",
    sowId: "sow-atlas-mobile",
    title: "Atlas mobile platform",
    client: "Atlas-Insights",
    portfolio: "Mobile",
    startedAt: "Feb 14, 2026",
    targetDate: "Aug 1, 2026",
    health: "on_track",
    budget: cents(58_000),
    spent: cents(40_200),
    milestones: [
      { id: "m1", label: "FCM + APNS adapter", status: "done" },
      { id: "m2", label: "Notification center", status: "done" },
      { id: "m3", label: "Engagement metrics", status: "active" },
      { id: "m4", label: "Beta release", status: "upcoming" },
    ],
    taskIds: ["t-3711", "t-3601", "t-2114"],
    ownerInitials: "PI",
  },
  {
    id: "proj-helios-core-search",
    sowId: "sow-helios-core-search",
    title: "Helios-Core search shortcuts",
    client: "Helios-Core",
    portfolio: "Enterprise Foundations",
    startedAt: "Apr 8, 2026",
    targetDate: "May 22, 2026",
    health: "completed",
    budget: cents(14_500),
    spent: cents(14_500),
    milestones: [
      { id: "m1", label: "Invocation pattern", status: "done" },
      { id: "m2", label: "Recent search caching", status: "done" },
      { id: "m3", label: "Accessibility pass", status: "done" },
    ],
    taskIds: ["t-4188"],
    ownerInitials: "RV",
  },
  {
    id: "proj-lighthouse-reporting",
    sowId: "sow-lighthouse-reporting",
    title: "Lighthouse reporting suite",
    client: "Lighthouse-Ops",
    portfolio: "Reporting",
    startedAt: "—",
    targetDate: "Aug 20, 2026",
    health: "at_risk",
    budget: cents(36_500),
    spent: cents(0),
    milestones: [
      { id: "m1", label: "Awaiting SOW final approval", status: "active" },
      { id: "m2", label: "Decomposition", status: "upcoming" },
      { id: "m3", label: "Delivery", status: "upcoming" },
    ],
    taskIds: [],
    ownerInitials: "HP",
  },
];

export const enterpriseAlerts: OperationalAlert[] = [
  {
    id: "al-1",
    severity: "warning",
    title: "Helios DS · accessible date picker · round 3 of 3",
    detail: "Final revision round in flight. Mentor approval will close the milestone.",
    source: "delivery",
    raisedAt: "an hour ago",
    linkLabel: "Open validation",
    linkHref: "/enterprise/reviewer/queue/t-4821",
  },
  {
    id: "al-2",
    severity: "warning",
    title: "Lighthouse SOW pending legal review",
    detail: "Legal gate has held the SOW for 4 days. Watch for SLA breach at 7d.",
    source: "governance",
    raisedAt: "today",
    linkLabel: "Open SOW",
    linkHref: "/enterprise/sow/sow-lighthouse-reporting",
  },
  {
    id: "al-3",
    severity: "watch",
    title: "Reporting CSV export · contributor awaiting clarification",
    detail: "Hana Park has not yet replied on locale source. SLA paused.",
    source: "delivery",
    raisedAt: "5 hours ago",
  },
  {
    id: "al-4",
    severity: "info",
    title: "Atlas-Insights · Q2 budget at 69%",
    detail: "On pace; no action needed. Surfaced for awareness.",
    source: "financial",
    raisedAt: "yesterday",
  },
];

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
