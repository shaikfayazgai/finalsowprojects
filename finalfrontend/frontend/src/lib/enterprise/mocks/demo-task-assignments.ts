/**
 * Cross-portal demo assignments — enterprise assign → contributor inbox.
 * Persisted in localStorage until real POST /api/tasks/:id/assign ships.
 */

import type { TaskPricing } from "@/lib/pricing";
import { createOverlayStore } from "./overlay";

export interface DemoTaskAssignment {
  taskId: string;
  projectId: string;
  projectName: string;
  title: string;
  contributorId: string;
  contributorName: string;
  contributorEmail: string;
  requiredSkills: string[];
  estimatedHours: number;
  agreedRatePerHour: number;
  agreedCurrency: "INR";
  /**
   * Typed pricing (preferred). When present, `agreedRatePerHour`/
   * `agreedCurrency` are derived from `pricing` for back-compat with
   * existing UI. Phase 5 sets `pricing.lockedAt` on selection.
   */
  pricing?: TaskPricing;
  status: "matched" | "in_progress";
  assignedAt: string;
  acceptedAt?: string;
}

export const demoAssignmentOverlay = createOverlayStore<DemoTaskAssignment>(
  "glimmora.demo.task-assignments.v1",
);

const DEFAULT_RATE_PER_HOUR = 1200;

export function recordDemoTaskAssignment(input: Omit<DemoTaskAssignment, "assignedAt" | "status">): DemoTaskAssignment {
  const row: DemoTaskAssignment = {
    ...input,
    agreedRatePerHour: input.agreedRatePerHour ?? DEFAULT_RATE_PER_HOUR,
    agreedCurrency: input.agreedCurrency ?? "INR",
    status: "matched",
    assignedAt: new Date().toISOString(),
  };
  demoAssignmentOverlay.insert(input.taskId, row);
  return row;
}

export function acceptDemoTaskAssignment(taskId: string): DemoTaskAssignment | undefined {
  const current = demoAssignmentOverlay.read()[taskId];
  if (!current || current.__deletedAt) return undefined;
  const next: DemoTaskAssignment = {
    taskId: current.taskId ?? taskId,
    projectId: current.projectId ?? "",
    projectName: current.projectName ?? "",
    title: current.title ?? taskId,
    contributorId: current.contributorId ?? "",
    contributorName: current.contributorName ?? "",
    contributorEmail: current.contributorEmail ?? "",
    requiredSkills: current.requiredSkills ?? [],
    estimatedHours: current.estimatedHours ?? 0,
    agreedRatePerHour: current.agreedRatePerHour ?? DEFAULT_RATE_PER_HOUR,
    agreedCurrency: current.agreedCurrency ?? "INR",
    status: "in_progress",
    assignedAt: current.assignedAt ?? new Date().toISOString(),
    acceptedAt: new Date().toISOString(),
  };
  demoAssignmentOverlay.insert(taskId, next);
  return next;
}

/** Contributor declines an assignment — drop the overlay row so it leaves
 *  their inbox. Caller reopens the marketplace task for re-selection. */
export function declineDemoTaskAssignment(taskId: string): DemoTaskAssignment | undefined {
  const current = getDemoAssignment(taskId);
  if (!current) return undefined;
  demoAssignmentOverlay.remove(taskId);
  return current;
}

export function listDemoAssignmentsForEmail(email: string | null | undefined): DemoTaskAssignment[] {
  if (!email) return [];
  const needle = email.toLowerCase();
  return Object.values(demoAssignmentOverlay.read())
    .filter((a) => !a.__deletedAt && a.contributorEmail?.toLowerCase() === needle)
    .map((a) => ({
      taskId: a.taskId ?? "",
      projectId: a.projectId ?? "",
      projectName: a.projectName ?? "",
      title: a.title ?? "",
      contributorId: a.contributorId ?? "",
      contributorName: a.contributorName ?? "",
      contributorEmail: a.contributorEmail ?? "",
      requiredSkills: a.requiredSkills ?? [],
      estimatedHours: a.estimatedHours ?? 0,
      agreedRatePerHour: a.agreedRatePerHour ?? DEFAULT_RATE_PER_HOUR,
      agreedCurrency: a.agreedCurrency ?? "INR",
      ...(a.pricing ? { pricing: a.pricing } : {}),
      status: a.status ?? "matched",
      assignedAt: a.assignedAt ?? new Date().toISOString(),
      acceptedAt: a.acceptedAt,
    }));
}

export function getDemoAssignment(taskId: string): DemoTaskAssignment | undefined {
  const a = demoAssignmentOverlay.read()[taskId];
  if (!a || a.__deletedAt) return undefined;
  return {
    taskId: a.taskId ?? taskId,
    projectId: a.projectId ?? "",
    projectName: a.projectName ?? "",
    title: a.title ?? taskId,
    contributorId: a.contributorId ?? "",
    contributorName: a.contributorName ?? "",
    contributorEmail: a.contributorEmail ?? "",
    requiredSkills: a.requiredSkills ?? [],
    estimatedHours: a.estimatedHours ?? 0,
    agreedRatePerHour: a.agreedRatePerHour ?? DEFAULT_RATE_PER_HOUR,
    agreedCurrency: a.agreedCurrency ?? "INR",
    ...(a.pricing ? { pricing: a.pricing } : {}),
    status: a.status ?? "matched",
    assignedAt: a.assignedAt ?? new Date().toISOString(),
    acceptedAt: a.acceptedAt,
  };
}
