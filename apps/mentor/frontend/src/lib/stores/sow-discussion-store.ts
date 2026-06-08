// Per-SOW discussion thread. Persists to localStorage.

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SowComment {
  id: string;
  sowId: string;
  authorName: string;
  authorInitials: string;
  text: string;
  createdAt: string;
}

interface SowDiscussionState {
  threads: Record<string, SowComment[]>;
  addComment: (input: Omit<SowComment, "id" | "createdAt">) => void;
  deleteComment: (sowId: string, commentId: string) => void;
}

export const useSowDiscussionStore = create<SowDiscussionState>()(
  persist(
    (set) => ({
      threads: {},
      addComment: (input) =>
        set((s) => {
          const id = `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const next: SowComment = {
            id,
            createdAt: new Date().toISOString(),
            ...input,
          };
          const existing = s.threads[input.sowId] ?? [];
          return {
            threads: { ...s.threads, [input.sowId]: [...existing, next] },
          };
        }),
      deleteComment: (sowId, commentId) =>
        set((s) => {
          const existing = s.threads[sowId];
          if (!existing) return s;
          return {
            threads: {
              ...s.threads,
              [sowId]: existing.filter((c) => c.id !== commentId),
            },
          };
        }),
    }),
    { name: "enterprise-sow-discussions-v1" },
  ),
);
