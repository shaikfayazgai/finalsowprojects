"use client";

/**
 * Delivery-task store — the single source of truth for a SOW-flow task's
 * delivery lifecycle, keyed by the REAL project taskId (e.g.
 * "task-plan-acme-mq0wixi8-0"). Unlike the pre-seeded contributor-tasks-store
 * (demo data), this connects the actual SOW → project → task to the
 * submit → Mentor gate → Reviewer gate → pay chain.
 *
 * EVERY submission is stored as an immutable version (v1, v2, …) so a full
 * history of the work is retained across the revision loop.
 *
 * Status machine (locked flow):
 *   assigned → submitted → mentor_changes ⇄ submitted → mentor_approved
 *            → reviewer_accepted   (then enterprise pays the milestone)
 *   reviewer can also send back → reviewer_changes ⇄ submitted
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DeliveryTaskStatus =
  | "assigned" //          contributor has the task, no submission yet
  | "submitted" //         awaiting Mentor gate
  | "mentor_changes" //    mentor sent back — contributor must resubmit
  | "mentor_approved" //   mentor passed → awaiting Reviewer gate
  | "reviewer_changes" //  reviewer sent back — contributor must resubmit
  | "reviewer_accepted"; // reviewer accepted → milestone payable

export interface WorkVersion {
  version: number;
  note: string;
  links: string[]; // artifact URLs the contributor attaches
  submittedAt: string; // ISO
}

export interface GateDecision {
  by: string; //   actor name
  decision: "approve" | "changes" | "accept";
  comment: string;
  at: string; // ISO
  version: number; // which submission version this decision was on
}

export interface DeliveryTask {
  taskId: string;
  projectId: string;
  title: string;
  contributorId: string;
  contributorName: string;
  mentorName?: string;
  reviewerName?: string;
  status: DeliveryTaskStatus;
  versions: WorkVersion[];
  decisions: GateDecision[];
}

interface DeliveryTaskState {
  tasksById: Record<string, DeliveryTask>;

  /** Called when the enterprise selects a contributor for a published task. */
  initTask: (input: {
    taskId: string;
    projectId: string;
    title: string;
    contributorId: string;
    contributorName: string;
    mentorName?: string;
    reviewerName?: string;
  }) => void;

  setReviewer: (taskId: string, reviewerName: string) => void;

  /** Contributor submits (or resubmits) work — stores a new version. */
  submitWork: (taskId: string, note: string, links: string[]) => void;

  /** Mentor gate. */
  mentorDecision: (taskId: string, by: string, decision: "approve" | "changes", comment: string) => void;

  /** Reviewer gate (only valid after mentor_approved). */
  reviewerDecision: (taskId: string, by: string, decision: "accept" | "changes", comment: string) => void;

  get: (taskId: string) => DeliveryTask | undefined;
  listForContributor: (contributorId: string) => DeliveryTask[];
  listForMentor: () => DeliveryTask[]; // tasks awaiting mentor (submitted)
  listForReviewer: () => DeliveryTask[]; // tasks awaiting reviewer (mentor_approved)
}

const now = () => new Date().toISOString();

export const useDeliveryTaskStore = create<DeliveryTaskState>()(
  persist(
    (set, get) => ({
      tasksById: {},

      initTask: (input) =>
        set((s) => {
          const existing = s.tasksById[input.taskId];
          // Preserve history if already initialised; just refresh assignment fields.
          return {
            tasksById: {
              ...s.tasksById,
              [input.taskId]: {
                taskId: input.taskId,
                projectId: input.projectId,
                title: input.title,
                contributorId: input.contributorId,
                contributorName: input.contributorName,
                mentorName: input.mentorName ?? existing?.mentorName,
                reviewerName: input.reviewerName ?? existing?.reviewerName,
                status: existing?.status ?? "assigned",
                versions: existing?.versions ?? [],
                decisions: existing?.decisions ?? [],
              },
            },
          };
        }),

      setReviewer: (taskId, reviewerName) =>
        set((s) => {
          const t = s.tasksById[taskId];
          if (!t) return s;
          return { tasksById: { ...s.tasksById, [taskId]: { ...t, reviewerName } } };
        }),

      submitWork: (taskId, note, links) =>
        set((s) => {
          const t = s.tasksById[taskId];
          if (!t) return s;
          const version = t.versions.length + 1;
          return {
            tasksById: {
              ...s.tasksById,
              [taskId]: {
                ...t,
                status: "submitted",
                versions: [...t.versions, { version, note, links, submittedAt: now() }],
              },
            },
          };
        }),

      mentorDecision: (taskId, by, decision, comment) =>
        set((s) => {
          const t = s.tasksById[taskId];
          if (!t || t.status !== "submitted") return s;
          const version = t.versions.length;
          return {
            tasksById: {
              ...s.tasksById,
              [taskId]: {
                ...t,
                status: decision === "approve" ? "mentor_approved" : "mentor_changes",
                decisions: [...t.decisions, { by, decision, comment, at: now(), version }],
              },
            },
          };
        }),

      reviewerDecision: (taskId, by, decision, comment) =>
        set((s) => {
          const t = s.tasksById[taskId];
          if (!t || t.status !== "mentor_approved") return s;
          const version = t.versions.length;
          return {
            tasksById: {
              ...s.tasksById,
              [taskId]: {
                ...t,
                status: decision === "accept" ? "reviewer_accepted" : "reviewer_changes",
                decisions: [...t.decisions, { by, decision, comment, at: now(), version }],
              },
            },
          };
        }),

      get: (taskId) => get().tasksById[taskId],
      listForContributor: (contributorId) =>
        Object.values(get().tasksById).filter((t) => t.contributorId === contributorId),
      listForMentor: () =>
        Object.values(get().tasksById).filter((t) => t.status === "submitted"),
      listForReviewer: () =>
        Object.values(get().tasksById).filter((t) => t.status === "mentor_approved"),
    }),
    { name: "glm-delivery-tasks-v1" },
  ),
);
