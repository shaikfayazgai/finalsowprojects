/**
 * Enterprise Portal V2 — Decomposition Workspace mock.
 *
 * Workstream plans + task unit graphs per SOW. This is the operational
 * transformation layer between enterprise scope (SOW) and workforce
 * execution (Contributor V2 Assigned Work). Committed task units link
 * to the unified contributor task store by `taskIdInStore`.
 *
 * Mock-only. Phase 1B keeps Decomposition as a projection layer over
 * the existing unified task store — no separate Decomposition data
 * ecosystem.
 */

export type Complexity = "low" | "medium" | "high";
export type TaskUnitStatus = "proposed" | "committed" | "in_flight" | "completed";

export interface TaskUnit {
  id: string;
  label: string;
  detail: string;
  skill: string;
  skillLevel: "L1" | "L2" | "L3" | "L4";
  complexity: Complexity;
  estimatedHours: number;
  status: TaskUnitStatus;
  taskIdInStore?: string; // links to unified contributor task store
  dependsOn?: string[]; // task unit IDs within the same plan
  governanceMarkers?: string[];
}

export interface Workstream {
  id: string;
  label: string;
  description: string;
  status: "proposed" | "committed" | "in_flight" | "completed";
  taskUnits: TaskUnit[];
  riskScore: number; // 0–100
  governanceFlags: string[];
  dependsOn?: string[];
  sequenceIndex: number;
}

export interface SkillRequirement {
  skill: string;
  level: "L1" | "L2" | "L3" | "L4";
  tasksNeeding: number;
  workforceAvailable: number;
  matchPct: number; // 0–100
}

export interface DecompositionAiHint {
  id: string;
  kind: "segmentation" | "estimation" | "skill_match" | "dependency" | "risk" | "governance";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface DecompositionPlan {
  sowId: string;
  state: "not_started" | "drafting" | "ready_for_commit" | "committed" | "in_delivery";
  workstreams: Workstream[];
  skillRequirements: SkillRequirement[];
  governanceCheckpoints: { framework: string; status: "ready" | "needs_evidence" | "blocked"; detail?: string }[];
  aiHints: DecompositionAiHint[];
  totalEstimatedHours: number;
  totalCommittedTasks: number;
  totalProposedTasks: number;
  readinessScore: number; // 0–100 — gate for "Commit to workforce"
  notes?: string;
}

/* ─────────────────────── Canonical mocks ─────────────────────── */

export const decompositionPlans: DecompositionPlan[] = [];

/* ─────────────────────── Selectors ─────────────────────── */

export function getDecompositionPlan(sowId: string): DecompositionPlan | undefined {
  return decompositionPlans.find((p) => p.sowId === sowId);
}

export function decompositionStateLabel(s: DecompositionPlan["state"]): string {
  switch (s) {
    case "not_started":
      return "Not started";
    case "drafting":
      return "Drafting plan";
    case "ready_for_commit":
      return "Ready to commit";
    case "committed":
      return "Committed";
    case "in_delivery":
      return "In delivery";
  }
}

export function decompositionStateTone(
  s: DecompositionPlan["state"],
): { chip: string; dot: string; label: string } {
  switch (s) {
    case "not_started":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", dot: "bg-beige-400", label: "Not started" };
    case "drafting":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", dot: "bg-gold-500", label: "Drafting" };
    case "ready_for_commit":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", dot: "bg-teal-600", label: "Ready to commit" };
    case "committed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500", label: "Committed" };
    case "in_delivery":
      return { chip: "border-brown-200 bg-brown-50 text-brown-800", dot: "bg-brown-500", label: "In delivery" };
  }
}

export function workstreamStatusTone(
  s: Workstream["status"],
): { chip: string; dot: string; label: string } {
  switch (s) {
    case "proposed":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", dot: "bg-beige-400", label: "Proposed" };
    case "committed":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", dot: "bg-teal-600", label: "Committed" };
    case "in_flight":
      return { chip: "border-brown-200 bg-brown-50 text-brown-800", dot: "bg-brown-500", label: "In flight" };
    case "completed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500", label: "Completed" };
  }
}

export function complexityTone(c: Complexity): { chip: string; label: string } {
  switch (c) {
    case "low":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Low" };
    case "medium":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Medium" };
    case "high":
      return { chip: "border-brown-300 bg-brown-50 text-brown-800", label: "High" };
  }
}

export function taskUnitStatusTone(s: TaskUnitStatus): { chip: string; label: string } {
  switch (s) {
    case "proposed":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Proposed" };
    case "committed":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", label: "Committed" };
    case "in_flight":
      return { chip: "border-brown-200 bg-brown-50 text-brown-800", label: "In flight" };
    case "completed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Completed" };
  }
}

export function skillMatchTone(pct: number): { bar: string; tint: string } {
  if (pct >= 90) return { bar: "bg-forest-500", tint: "text-forest-700" };
  if (pct >= 70) return { bar: "bg-teal-500", tint: "text-teal-700" };
  if (pct >= 50) return { bar: "bg-gold-500", tint: "text-gold-700" };
  return { bar: "bg-brown-500", tint: "text-brown-700" };
}
