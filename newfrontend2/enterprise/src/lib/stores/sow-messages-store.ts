import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApprovalMessage } from "@/types/enterprise";

interface SowMessagesState {
  threads: Record<string, ApprovalMessage[]>; // keyed by sowId
  addMessage: (sowId: string, msg: Omit<ApprovalMessage, "id" | "sentAt" | "read">) => void;
  markRead: (sowId: string, messageId: string) => void;
  getThread: (sowId: string) => ApprovalMessage[];
  getThreadForStage: (sowId: string, stageIndex: number) => ApprovalMessage[];
  clearThread: (sowId: string) => void;
}

export const useSowMessagesStore = create<SowMessagesState>()(
  persist(
    (set, get) => ({
      threads: {},

      addMessage: (sowId, msg) => {
        const newMsg: ApprovalMessage = {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sentAt: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          threads: {
            ...state.threads,
            [sowId]: [newMsg, ...(state.threads[sowId] ?? [])],
          },
        }));
      },

      markRead: (sowId, messageId) =>
        set((state) => ({
          threads: {
            ...state.threads,
            [sowId]: (state.threads[sowId] ?? []).map((m) =>
              m.id === messageId ? { ...m, read: true } : m
            ),
          },
        })),

      getThread: (sowId) => get().threads[sowId] ?? [],

      getThreadForStage: (sowId, stageIndex) =>
        (get().threads[sowId] ?? []).filter((m) => m.stageIndex === stageIndex),

      clearThread: (sowId) =>
        set((state) => {
          const { [sowId]: _, ...rest } = state.threads;
          return { threads: rest };
        }),
    }),
    { name: "gt-sow-messages" }
  )
);
