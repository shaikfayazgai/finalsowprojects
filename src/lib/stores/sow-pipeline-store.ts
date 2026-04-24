import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ── Types ── */

export type SLAStatus = "on-track" | "at-risk" | "overdue";

export interface ChangeRequestHistoryEntry {
  reason: string;
  requestedBy: string;
  requestedAt: string;
  resolvedAt: string;
  resolveMessage?: string;
  stageAtRequest: number;
}

export interface PipelineSOW {
  id: string;
  title: string;
  client: string;
  currentStage: number;
  stageApprover: string;
  slaStatus: SLAStatus;
  submittedDate: string;
  totalValue: string;
  completedStages: number[];
  submittedBy?: string;
  changesRequested?: boolean;
  changeRequestReason?: string;
  changeRequestedAt?: string;
  changeRequestedBy?: string;
  changeRequestHistory?: ChangeRequestHistoryEntry[];
}

/* ── Empty seed (dummy data cleared) ── */

const INITIAL_SOWS: PipelineSOW[] = [];

/* ── Store ── */

interface SOWPipelineState {
  sows: PipelineSOW[];
  addSOW: (sow: PipelineSOW) => void;
  removeSOW: (id: string) => void;
  updateSOW: (id: string, patch: Partial<PipelineSOW>) => void;
}

export const useSOWPipelineStore = create<SOWPipelineState>()(
  persist(
    (set) => ({
      sows: INITIAL_SOWS,
      addSOW: (sow) => set((s) => ({ sows: [sow, ...s.sows] })),
      removeSOW: (id) => set((s) => ({ sows: s.sows.filter((sow) => sow.id !== id) })),
      updateSOW: (id, patch) =>
        set((s) => ({ sows: s.sows.map((sow) => (sow.id === id ? { ...sow, ...patch } : sow)) })),
    }),
    {
      name: "gt-sow-pipeline",
      /* version bump forces fresh empty list, clearing persisted dummy SOWs */
      version: 5,
      migrate: () => ({ sows: INITIAL_SOWS }),
    }
  )
);
