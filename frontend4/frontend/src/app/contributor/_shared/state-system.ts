/**
 * Contributor Portal V2 — canonical state taxonomy.
 *
 * Single source of truth for the contributor workflow lifecycle. Every
 * V2 surface that touches state (chip color, next-step CTA, queue filter,
 * order-of-operations) should import from this file rather than reinventing.
 *
 * Two related state systems coexist:
 *   - ContributorState (top-level lifecycle) — workspace.ts
 *   - RevisionWorkflowState (sub-states of revision_requested) — revision-queue.ts
 *
 * This file documents the mapping and exposes derivation helpers used
 * across Dashboard, Workroom, Submission, Revision, Profile, Progress,
 * Completed Work surfaces.
 */

import type { ContributorState } from "@/mocks/data/contributor-workspace";
import type { RevisionWorkflowState } from "@/mocks/data/contributor-revision-queue";

/**
 * Canonical ordering of the contributor lifecycle.
 *
 * Reads top-to-bottom as the operational journey of a piece of work,
 * from assignment through completion. Used wherever we need a stable
 * "this state happens before that state" understanding.
 */
export const contributorStateOrder: ContributorState[] = [
  "assigned",
  "accepted",
  "in_progress",
  "blocked",
  "awaiting_clarification",
  "ready_for_submission",
  "under_review",
  "revision_requested",
  "approved",
  "completed",
  "escalated",
];

/**
 * Forward-momentum grouping — used to decide which surface owns a given
 * task and what the contributor's next operational action should be.
 */
export const stateGroups = {
  /** Pre-commitment — work hasn't started. */
  preFlight: ["assigned"] as ContributorState[],
  /** Actively in flight — the workroom owns it. */
  active: ["accepted", "in_progress", "blocked", "awaiting_clarification"] as ContributorState[],
  /** Submission-adjacent — readiness or submission surfaces own it. */
  submitting: ["ready_for_submission"] as ContributorState[],
  /** Mentor's turn — contributor is waiting. */
  mentorOwned: ["under_review"] as ContributorState[],
  /** Needs correction — revisions workspace owns it. */
  correcting: ["revision_requested"] as ContributorState[],
  /** Finished — completed work archive owns it. */
  done: ["approved", "completed"] as ContributorState[],
  /** Outside the normal lane. */
  exception: ["escalated"] as ContributorState[],
} as const;

/**
 * One-sentence "next step" copy per state, written in calm contributor
 * voice. Used by `NextStepCard` and inline CTAs across surfaces.
 */
export const stateNextStep: Record<
  ContributorState,
  { headline: string; helper: string; cta: string; href: (taskId: string) => string }
> = {
  assigned: {
    headline: "Accept the task to get started",
    helper: "Read the brief in the workroom. Accept when you're ready to commit.",
    cta: "Open workroom",
    href: (id) => `/contributor/tasks/${id}`,
  },
  accepted: {
    headline: "Start working in the workroom",
    helper: "Brief, instructions, and the evidence drop zone are all there.",
    cta: "Open workroom",
    href: (id) => `/contributor/tasks/${id}`,
  },
  in_progress: {
    headline: "Continue where you left off",
    helper: "Draft notes and uploaded evidence are already saved.",
    cta: "Resume workroom",
    href: (id) => `/contributor/tasks/${id}`,
  },
  blocked: {
    headline: "Resolve the blocker",
    helper: "A dependency or external input is missing. The workroom shows what.",
    cta: "Open workroom",
    href: (id) => `/contributor/tasks/${id}`,
  },
  awaiting_clarification: {
    headline: "Mentor reply pending",
    helper: "SLA is paused. Pre-draft the fix or pick another task while you wait.",
    cta: "View thread",
    href: (id) => `/contributor/tasks/${id}`,
  },
  ready_for_submission: {
    headline: "Ready to submit",
    helper: "Readiness checks pass. Send when you're confident.",
    cta: "Open submission",
    href: (id) => `/contributor/tasks/${id}/submit`,
  },
  under_review: {
    headline: "Mentor reviewing — no action needed",
    helper: "Typical mentor turnaround sits inside 24 hours.",
    cta: "View submission",
    href: (id) => `/contributor/tasks/${id}`,
  },
  revision_requested: {
    headline: "Mentor sent revision feedback",
    helper: "Walk the correction checklist in the revision workspace.",
    cta: "Open revision",
    href: (id) => `/contributor/tasks/${id}/revision`,
  },
  approved: {
    headline: "Accepted · payout queued",
    helper: "Submission moved into your completed archive.",
    cta: "View completed",
    href: () => `/contributor/tasks/completed`,
  },
  completed: {
    headline: "Filed in completed work",
    helper: "Credential and payout reference are attached.",
    cta: "View archive",
    href: () => `/contributor/tasks/completed`,
  },
  escalated: {
    headline: "Under platform review",
    helper: "Glimmora staff is handling this. No action from you right now.",
    cta: "View status",
    href: (id) => `/contributor/tasks/${id}`,
  },
};

/**
 * Revision sub-state → top-level ContributorState mapping.
 *
 * Every revision sub-state nests under `revision_requested` from the
 * contributor's lifecycle perspective. The sub-state adds nuance for
 * the revisions workspace.
 */
export const revisionToTopState: Record<RevisionWorkflowState, ContributorState> = {
  feedback_received: "revision_requested",
  in_correction: "revision_requested",
  awaiting_clarification: "awaiting_clarification",
  ready_for_resubmission: "ready_for_submission",
  resubmitted_under_review: "under_review",
};

/**
 * Determine the urgency tier of an active task. Used by sidebars and
 * cross-surface alerts to decide whether to highlight the next step.
 */
export function urgencyForHours(hours: number | undefined): "due_now" | "due_soon" | "comfortable" {
  if (typeof hours !== "number") return "comfortable";
  if (hours <= 12) return "due_now";
  if (hours <= 48) return "due_soon";
  return "comfortable";
}
