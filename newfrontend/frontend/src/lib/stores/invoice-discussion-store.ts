// Per-invoice discussion thread. Persists to localStorage so notes survive reloads in mock mode.

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface InvoiceComment {
  id: string;
  invoiceId: string;
  authorName: string;
  authorInitials: string;
  text: string;
  createdAt: string;
}

interface InvoiceDiscussionState {
  threads: Record<string, InvoiceComment[]>;
  addComment: (input: Omit<InvoiceComment, "id" | "createdAt">) => void;
  deleteComment: (invoiceId: string, commentId: string) => void;
}

export const useInvoiceDiscussionStore = create<InvoiceDiscussionState>()(
  persist(
    (set) => ({
      threads: {},
      addComment: (input) =>
        set((s) => {
          const id = `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const next: InvoiceComment = {
            id,
            createdAt: new Date().toISOString(),
            ...input,
          };
          const existing = s.threads[input.invoiceId] ?? [];
          return {
            threads: { ...s.threads, [input.invoiceId]: [...existing, next] },
          };
        }),
      deleteComment: (invoiceId, commentId) =>
        set((s) => {
          const existing = s.threads[invoiceId];
          if (!existing) return s;
          return {
            threads: {
              ...s.threads,
              [invoiceId]: existing.filter((c) => c.id !== commentId),
            },
          };
        }),
    }),
    { name: "enterprise-billing-discussions-v1" },
  ),
);
