"use client";

/**
 * Task-interest store — the "price-visible → I'm interested → enterprise selects"
 * model from the locked GTPROJECT flow.
 *
 * A published task collects interest from contributors. The enterprise then
 * selects ONE interested contributor; the rest are marked not-selected. This is
 * a local (Zustand + localStorage) mock until a backend endpoint ships.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TaskInterest {
  contributorId: string;
  name: string;
  email?: string;
  at: string; // ISO
}

interface TaskInterestState {
  /** taskId → interested contributors */
  interestsByTask: Record<string, TaskInterest[]>;
  /** taskId → selected contributorId (enterprise pick) */
  selectedByTask: Record<string, string>;

  expressInterest: (taskId: string, c: TaskInterest) => void;
  withdrawInterest: (taskId: string, contributorId: string) => void;
  hasInterest: (taskId: string, contributorId: string) => boolean;
  listInterest: (taskId: string) => TaskInterest[];
  selectContributor: (taskId: string, contributorId: string) => void;
  selectedFor: (taskId: string) => string | undefined;
}

export const useTaskInterestStore = create<TaskInterestState>()(
  persist(
    (set, get) => ({
      interestsByTask: {},
      selectedByTask: {},

      expressInterest: (taskId, c) =>
        set((s) => {
          const existing = s.interestsByTask[taskId] ?? [];
          if (existing.some((x) => x.contributorId === c.contributorId)) return s;
          return {
            interestsByTask: {
              ...s.interestsByTask,
              [taskId]: [...existing, c],
            },
          };
        }),

      withdrawInterest: (taskId, contributorId) =>
        set((s) => ({
          interestsByTask: {
            ...s.interestsByTask,
            [taskId]: (s.interestsByTask[taskId] ?? []).filter(
              (x) => x.contributorId !== contributorId,
            ),
          },
        })),

      hasInterest: (taskId, contributorId) =>
        (get().interestsByTask[taskId] ?? []).some(
          (x) => x.contributorId === contributorId,
        ),

      listInterest: (taskId) => get().interestsByTask[taskId] ?? [],

      selectContributor: (taskId, contributorId) =>
        set((s) => ({
          selectedByTask: { ...s.selectedByTask, [taskId]: contributorId },
        })),

      selectedFor: (taskId) => get().selectedByTask[taskId],
    }),
    { name: "glm-task-interest-v1" },
  ),
);
