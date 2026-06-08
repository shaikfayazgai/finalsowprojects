/**
 * Contributor Portal V2 — workspace mock data.
 *
 * Productivity-first shape. Built around the 11-state contributor lifecycle:
 *   assigned · accepted · in_progress · blocked · awaiting_clarification ·
 *   ready_for_submission · under_review · revision_requested · approved ·
 *   completed · escalated
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

export type ContributorState =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "blocked"
  | "awaiting_clarification"
  | "ready_for_submission"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "completed"
  | "escalated";

export type ContributorPriority = "P0" | "P1" | "P2";

export interface AcceptanceCriterion {
  id: string;
  label: string;
  addressed: boolean;
}

export interface MentorCorrection {
  id: string;
  criterion: string;
  description: string;
  severity: "blocker" | "major" | "nit";
  addressed: boolean;
}

export interface MentorFeedback {
  received: boolean;
  receivedAt?: string;
  mentorName?: string;
  whatWorked?: string;
  requiredCorrections?: MentorCorrection[];
  suggestions?: string[];
}

export interface ContributorTask {
  id: string;
  title: string;
  description: string;
  project: string;
  portfolio: string;
  priority: ContributorPriority;
  skill: string;
  skillLevel: string;
  deadline: string;
  deadlineHoursRemaining: number;
  state: ContributorState;
  progressPct: number;
  estimatedMinutesRemaining: number;
  payoutAmount: string;
  acceptanceCriteria: AcceptanceCriterion[];
  evidenceCompleteness: number;
  readinessScore: number;
  blockers?: { reason: string; expectedResolution?: string }[];
  mentorFeedback?: MentorFeedback;
  reworkRound?: number;
  totalRounds?: number;
  aiCue?: string;
  aiNextAction?: string;
  lastActivityAt: string;
  reviewWindowHours?: number;
  nextAction: string;
}

/* ─────────────────────── Tasks ─────────────────────── */

export const contributorTasks: ContributorTask[] = [];

/* ─────────────────────── KPIs ─────────────────────── */

export interface ProductivityKpi {
  key: string;
  label: string;
  value: string;
  delta?: string;
  caption?: string;
  tone?: "positive" | "neutral" | "warning";
}

export const productivityKpis: ProductivityKpi[] = [];

/* ─────────────────────── AI suggestions ─────────────────────── */

export interface AiSuggestion {
  id: string;
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  cta: string;
  kind: "next_task" | "submission_check" | "revision_help" | "workflow_tip";
  relatedTaskId?: string;
}

export const aiSuggestions: AiSuggestion[] = [];

/* ─────────────────────── Momentum ─────────────────────── */

export interface MomentumSignals {
  acceptedThisWeek: number;
  acceptedLastWeek: number;
  streak: number;
  reliability: number;
  reliabilityTrend: number;
  skillProgress: { skill: string; level: string; nextLevelProgress: number }[];
  recentWins: { taskTitle: string; acceptedAt: string; payout: string }[];
}

export const momentumSignals: MomentumSignals = {
  acceptedThisWeek: 0,
  acceptedLastWeek: 0,
  streak: 0,
  reliability: 0,
  reliabilityTrend: 0,
  skillProgress: [],
  recentWins: [],
};

/* ─────────────────────── State display canon ─────────────────────── */

export const contributorStateLabel: Record<ContributorState, string> = {
  assigned: "New",
  accepted: "Accepted",
  in_progress: "In progress",
  blocked: "Paused",
  awaiting_clarification: "Awaiting reply",
  ready_for_submission: "Ready to submit",
  under_review: "Under review",
  revision_requested: "Action needed",
  approved: "Accepted",
  completed: "Completed",
  escalated: "Under platform review",
};

export const priorityLabel: Record<ContributorPriority, string> = {
  P0: "High priority",
  P1: "Standard",
  P2: "Flexible",
};

/* ─────────────────────── Helpers ─────────────────────── */

export function formatHoursToDeadline(hours: number): string {
  if (hours < 0) return `${Math.abs(hours)}h past deadline`;
  if (hours === 0) return "due now";
  if (hours < 24) return `${hours}h left`;
  const d = Math.floor(hours / 24);
  return `${d}d ${hours % 24}h left`;
}

export function isUrgent(task: ContributorTask): boolean {
  return (
    task.deadlineHoursRemaining <= 12 &&
    task.state !== "approved" &&
    task.state !== "completed" &&
    task.state !== "under_review"
  );
}

export function isActive(task: ContributorTask): boolean {
  return ["accepted", "in_progress", "awaiting_clarification", "ready_for_submission"].includes(
    task.state
  );
}
