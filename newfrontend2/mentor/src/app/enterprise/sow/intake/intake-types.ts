/**
 * Enterprise SOW Intake — local state types.
 *
 * State is local to the intake flow (React useState). Submitting at
 * stage 5 routes to the Decomposition Workspace. In production this
 * would commit via the SOW API; for MVP walkthrough realism, the
 * downstream workspaces already surface seeded SOWs.
 */

import type {
  DeliveryClassification,
} from "@/mocks/data/enterprise-v2-orchestration";

export type EngagementClass =
  | "platform"
  | "design_system"
  | "feature_delivery"
  | "compliance_uplift"
  | "research"
  | "platform_modernization";

export type ReviewModel = "mentor_only" | "mentor_plus_reviewer" | "full_governance";

export interface IntakeState {
  // Stage 1 — Scope Intake
  title: string;
  client: string;
  portfolio: string;
  engagementClass: EngagementClass | "";
  classification: DeliveryClassification | "";
  scopeText: string;
  fileNames: string[];

  // Stage 3 — Operational Classification
  priority: "P0" | "P1" | "P2" | "";
  targetWeeks: number;
  reviewModel: ReviewModel | "";
  governanceFrameworks: string[]; // SOC2, GDPR, HIPAA, ISO27001, PODL, ESG

  // Derived (Stage 2 + 4) — set from AI scope simulation
  estimatedHours: number;
  estimatedTasks: number;
  workforceCapacityPct: number;
  decompositionReadiness: number;
  detectedSkills: string[];
  detectedRisks: string[];
}

export function emptyIntake(): IntakeState {
  return {
    title: "",
    client: "",
    portfolio: "",
    engagementClass: "",
    classification: "",
    scopeText: "",
    fileNames: [],
    priority: "",
    targetWeeks: 8,
    reviewModel: "",
    governanceFrameworks: [],
    estimatedHours: 0,
    estimatedTasks: 0,
    workforceCapacityPct: 0,
    decompositionReadiness: 0,
    detectedSkills: [],
    detectedRisks: [],
  };
}

/**
 * Mock AI scope analysis — synthesizes derived metrics from the
 * intake state. In production this would call a backend scope-analysis
 * service. The simulation reads scope length + classification +
 * governance + engagement class to produce a believable derivation.
 */
export function simulateAiAnalysis(s: IntakeState): {
  estimatedHours: number;
  estimatedTasks: number;
  workforceCapacityPct: number;
  decompositionReadiness: number;
  detectedSkills: string[];
  detectedRisks: string[];
  scopeOneLiner: string;
} {
  const scopeLen = s.scopeText.length;
  const hasFiles = s.fileNames.length > 0;

  // Hours estimate: rough linear scaling with scope length
  const estimatedHours = Math.max(40, Math.min(640, Math.round((scopeLen / 8) + s.targetWeeks * 8)));
  const estimatedTasks = Math.max(3, Math.min(40, Math.round(estimatedHours / 18)));
  const workforceCapacityPct = Math.max(3, Math.min(40, Math.round(estimatedHours / 16)));

  // Skill detection by classification
  const classSkills: Record<DeliveryClassification, string[]> = {
    design_system: ["React L3", "Design Systems L2", "Accessibility WCAG 2.2"],
    platform_engineering: ["TypeScript L3", "React L3", "Testing L2"],
    data_reporting: ["TypeScript L3", "Data viz L2", "React L3"],
    mobile_platform: ["Mobile L3", "React L3", "TypeScript L3"],
    accessibility_uplift: ["React L3", "Accessibility WCAG 2.2", "Testing L2"],
    compliance_evidence: ["TypeScript L3", "Documentation L2", "Compliance L2"],
  };
  const detectedSkills = s.classification ? classSkills[s.classification] : [];

  // Risk detection
  const detectedRisks: string[] = [];
  if (s.governanceFrameworks.includes("GDPR") || s.governanceFrameworks.includes("HIPAA")) {
    detectedRisks.push("Personal-data flows — DPIA may be required");
  }
  if (s.governanceFrameworks.includes("PODL")) {
    detectedRisks.push("PODL contributor flagging required");
  }
  if (scopeLen < 200) {
    detectedRisks.push("Scope reads thin — recommend additional context before commit");
  }
  if (estimatedHours > 400) {
    detectedRisks.push("Large delivery envelope — sequence as multiple workstreams");
  }
  if (!hasFiles && scopeLen < 500) {
    detectedRisks.push("No file evidence — pure-text scope may produce ambiguous decomposition");
  }

  // Decomposition readiness gate
  let readiness = 60;
  if (s.title.length > 5) readiness += 5;
  if (s.client.length > 2) readiness += 5;
  if (s.classification) readiness += 10;
  if (s.engagementClass) readiness += 5;
  if (scopeLen >= 200) readiness += 10;
  if (s.priority) readiness += 5;
  if (s.reviewModel) readiness += 5;
  if (s.governanceFrameworks.length > 0) readiness += 5;
  readiness = Math.min(100, readiness);

  const scopeOneLiner = s.scopeText
    ? s.scopeText.split(/[\.\n]/)[0].trim().slice(0, 160)
    : "Scope text not yet provided — paste or upload to enable AI summary.";

  return {
    estimatedHours,
    estimatedTasks,
    workforceCapacityPct,
    decompositionReadiness: readiness,
    detectedSkills,
    detectedRisks,
    scopeOneLiner,
  };
}

export type IntakeStageId = 1 | 2 | 3 | 4 | 5;

export const stageLabels: Record<IntakeStageId, { label: string; sub: string }> = {
  1: { label: "Scope Intake", sub: "Upload + classify the engagement" },
  2: { label: "AI Scope Analysis", sub: "Derived signals from the brief" },
  3: { label: "Operational Classification", sub: "Priority · SLA · governance · review model" },
  4: { label: "Decomposition Readiness", sub: "Gates + workforce match" },
  5: { label: "Create Delivery Program", sub: "Commit · route to decomposition" },
};
