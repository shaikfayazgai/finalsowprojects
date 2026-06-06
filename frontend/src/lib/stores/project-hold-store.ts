import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HoldReason = "payment_overdue" | "manual";

export interface HeldProjectInfo {
  reason: HoldReason;
  heldAt: number;
  note?: string;
}

interface ProjectHoldStore {
  /** projectId → ms timestamp when M1 was paid */
  m1PaidTimestamps: Record<string, number>;
  /** projectId → hold info */
  heldProjects: Record<string, HeldProjectInfo>;
  setM1Paid: (projectId: string) => void;
  /** Dev/demo: set M1 paid timestamp 8 days in the past to trigger immediate auto-hold */
  simulateOverdue: (projectId: string) => void;
  holdProject: (projectId: string, reason: HoldReason, note?: string) => void;
  resumeProject: (projectId: string) => void;
}

export const useProjectHoldStore = create<ProjectHoldStore>()(
  persist(
    (set) => ({
      m1PaidTimestamps: {},
      heldProjects: {},

      setM1Paid: (projectId) =>
        set((s) => ({
          m1PaidTimestamps: { ...s.m1PaidTimestamps, [projectId]: Date.now() },
        })),

      simulateOverdue: (projectId) =>
        set((s) => ({
          // 8 days ago — past the 7-day M2 deadline
          m1PaidTimestamps: { ...s.m1PaidTimestamps, [projectId]: Date.now() - 8 * 24 * 60 * 60 * 1000 },
        })),

      holdProject: (projectId, reason, note) =>
        set((s) => ({
          heldProjects: {
            ...s.heldProjects,
            [projectId]: { reason, heldAt: Date.now(), note },
          },
        })),

      resumeProject: (projectId) =>
        set((s) => {
          const { [projectId]: _removed, ...rest } = s.heldProjects;
          return { heldProjects: rest };
        }),
    }),
    { name: "project-hold-store", skipHydration: true }
  )
);
