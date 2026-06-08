/**
 * Cross-portal demo assignments — enterprise assign → contributor inbox.
 * Persisted in localStorage until real POST /api/tasks/:id/assign ships.
 */

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
  status: "matched" | "in_progress";
  assignedAt: string;
  acceptedAt?: string;
}

export const demoAssignmentOverlay = createOverlayStore<DemoTaskAssignment>(
  "glimmora.demo.task-assignments.v1",
);

export function recordDemoTaskAssignment(input: Omit<DemoTaskAssignment, "assignedAt" | "status">): DemoTaskAssignment {
  const row: DemoTaskAssignment = {
    ...input,
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
    status: "in_progress",
    assignedAt: current.assignedAt ?? new Date().toISOString(),
    acceptedAt: new Date().toISOString(),
  };
  demoAssignmentOverlay.insert(taskId, next);
  return next;
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
    status: a.status ?? "matched",
    assignedAt: a.assignedAt ?? new Date().toISOString(),
    acceptedAt: a.acceptedAt,
  };
}
