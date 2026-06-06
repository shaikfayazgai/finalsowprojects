import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SOW, SOWApprovalStage } from "@/types/enterprise";

/* ── Empty seed (cleared dummy data) ── */
const FRESH_SOWS: SOW[] = [];

interface SowStoreState {
  sows: SOW[];
  addSow: (sow: SOW) => void;
  updateSow: (id: string, patch: Partial<SOW>) => void;
}

export const useSowStore = create<SowStoreState>()(
  persist(
    (set, get) => ({
      sows: FRESH_SOWS,

      addSow: (sow) => {
        const exists = get().sows.some((s) => s.id === sow.id);
        if (exists) {
          set((state) => ({ sows: state.sows.map((s) => (s.id === sow.id ? sow : s)) }));
        } else {
          set((state) => ({ sows: [sow, ...state.sows] }));
        }
      },

      updateSow: (id, patch) =>
        set((state) => ({
          sows: state.sows.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
    }),
    /* version bump forces a fresh empty list, clearing any persisted dummy SOWs in localStorage */
    { name: "gt-sow-list", version: 2, migrate: () => ({ sows: FRESH_SOWS }) }
  )
);

export const INITIAL_APPROVAL_STAGES: SOWApprovalStage[] = [
  { stage: "business",            status: "in_review", reviewer: "Enterprise Admin" },
  { stage: "glimmora_commercial", status: "pending" },
  { stage: "legal",               status: "pending" },
  { stage: "security",            status: "pending" },
  { stage: "final",               status: "pending" },
];
