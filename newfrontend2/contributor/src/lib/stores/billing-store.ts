/**
 * Per-invoice metadata + payout batches. Persists to localStorage so
 * drafts, approvals, disputes, and payout batches survive reloads in
 * mock mode.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  InvoiceMetadata,
  InvoiceState,
  ApprovalRecord,
  DisputeRecord,
  InvoiceFlag,
  PayoutBatch,
} from "@/types/billing";

interface BillingStoreState {
  metaById: Record<string, InvoiceMetadata>;
  payoutBatches: PayoutBatch[];

  /** Initialize metadata for a derived invoice that hasn't been touched yet. */
  ensureMeta: (
    invoiceId: string,
    initialState: InvoiceState,
    seededAudit?: InvoiceMetadata["audit"],
  ) => InvoiceMetadata;

  transitionState: (
    invoiceId: string,
    next: InvoiceState,
    actor: string,
    detail?: string,
  ) => void;

  setApprovers: (invoiceId: string, approvers: ApprovalRecord[]) => void;
  recordApproval: (
    invoiceId: string,
    approvalId: string,
    state: "approved" | "rejected",
    actor: string,
    note?: string,
  ) => void;

  raiseDispute: (
    invoiceId: string,
    dispute: Omit<DisputeRecord, "id" | "raisedAt">,
    actor: string,
  ) => void;
  resolveDispute: (
    invoiceId: string,
    disputeId: string,
    resolution: DisputeRecord["resolution"],
    actor: string,
  ) => void;

  setFlags: (invoiceId: string, flags: InvoiceFlag[]) => void;

  recordPartialPayment: (
    invoiceId: string,
    receivedCents: number,
    actor: string,
  ) => void;

  upsertPayoutBatch: (batch: PayoutBatch) => void;
  removePayoutBatch: (id: string) => void;

  /** Hard reset for dev — wipes everything in this slice. */
  reset: () => void;
}

function emptyMeta(invoiceId: string, state: InvoiceState): InvoiceMetadata {
  return {
    invoiceId,
    state,
    flags: [],
    approvals: [],
    disputes: [],
    audit: [],
  };
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useBillingStore = create<BillingStoreState>()(
  persist(
    (set, get) => ({
      metaById: {},
      payoutBatches: [],

      ensureMeta: (invoiceId, initialState, seededAudit) => {
        const existing = get().metaById[invoiceId];
        if (existing) return existing;
        const seeded: InvoiceMetadata = {
          ...emptyMeta(invoiceId, initialState),
          audit: seededAudit ?? [],
        };
        set((s) => ({ metaById: { ...s.metaById, [invoiceId]: seeded } }));
        return seeded;
      },

      transitionState: (invoiceId, next, actor, detail) => {
        set((s) => {
          const prev = s.metaById[invoiceId] ?? emptyMeta(invoiceId, next);
          const at = new Date().toISOString();
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: kindForTransition(next),
              actor,
              detail,
            },
          ];
          const stamp: Partial<InvoiceMetadata> = {};
          if (next === "draft") stamp.draftedAt = at;
          else if (next === "pending_approval") stamp.submittedForApprovalAt = at;
          else if (next === "approved") stamp.approvedAt = at;
          else if (next === "sent") stamp.sentAt = at;
          else if (next === "paid") stamp.paidAt = at;
          else if (next === "reconciled") stamp.reconciledAt = at;
          return {
            metaById: {
              ...s.metaById,
              [invoiceId]: { ...prev, state: next, audit, ...stamp },
            },
          };
        });
      },

      setApprovers: (invoiceId, approvers) => {
        set((s) => {
          const prev = s.metaById[invoiceId] ?? emptyMeta(invoiceId, "draft");
          return {
            metaById: {
              ...s.metaById,
              [invoiceId]: { ...prev, approvals: approvers },
            },
          };
        });
      },

      recordApproval: (invoiceId, approvalId, state, actor, note) => {
        set((s) => {
          const prev = s.metaById[invoiceId];
          if (!prev) return s;
          const approvals = prev.approvals.map((a) =>
            a.id === approvalId
              ? { ...a, state, decidedAt: new Date().toISOString(), note }
              : a,
          );
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at: new Date().toISOString(),
              kind: state === "approved" ? ("approved" as const) : ("rejected" as const),
              actor,
              detail: note,
            },
          ];
          return {
            metaById: { ...s.metaById, [invoiceId]: { ...prev, approvals, audit } },
          };
        });
      },

      raiseDispute: (invoiceId, dispute, actor) => {
        set((s) => {
          const prev = s.metaById[invoiceId] ?? emptyMeta(invoiceId, "sent");
          const newDispute: DisputeRecord = {
            id: uid("dsp"),
            raisedAt: new Date().toISOString(),
            ...dispute,
          };
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at: newDispute.raisedAt,
              kind: "disputed" as const,
              actor,
              detail: dispute.reason,
            },
          ];
          const flags = prev.flags.includes("disputed")
            ? prev.flags
            : [...prev.flags, "disputed" as const];
          return {
            metaById: {
              ...s.metaById,
              [invoiceId]: {
                ...prev,
                disputes: [...prev.disputes, newDispute],
                audit,
                flags,
              },
            },
          };
        });
      },

      resolveDispute: (invoiceId, disputeId, resolution, actor) => {
        set((s) => {
          const prev = s.metaById[invoiceId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const disputes = prev.disputes.map((d) =>
            d.id === disputeId ? { ...d, resolvedAt: at, resolution } : d,
          );
          const allResolved = disputes.every((d) => !!d.resolvedAt);
          const flags = allResolved
            ? prev.flags.filter((f) => f !== "disputed")
            : prev.flags;
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "dispute_resolved" as const,
              actor,
              detail: resolution,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [invoiceId]: { ...prev, disputes, flags, audit },
            },
          };
        });
      },

      setFlags: (invoiceId, flags) => {
        set((s) => {
          const prev = s.metaById[invoiceId] ?? emptyMeta(invoiceId, "draft");
          return {
            metaById: { ...s.metaById, [invoiceId]: { ...prev, flags } },
          };
        });
      },

      recordPartialPayment: (invoiceId, receivedCents, actor) => {
        set((s) => {
          const prev = s.metaById[invoiceId] ?? emptyMeta(invoiceId, "sent");
          const at = new Date().toISOString();
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "partial_paid" as const,
              actor,
              detail: `${(receivedCents / 100).toFixed(2)} received`,
            },
          ];
          const flags = prev.flags.includes("partial_payment")
            ? prev.flags
            : [...prev.flags, "partial_payment" as const];
          return {
            metaById: {
              ...s.metaById,
              [invoiceId]: { ...prev, paidCents: receivedCents, flags, audit },
            },
          };
        });
      },

      upsertPayoutBatch: (batch) => {
        set((s) => ({
          payoutBatches: s.payoutBatches.some((b) => b.id === batch.id)
            ? s.payoutBatches.map((b) => (b.id === batch.id ? batch : b))
            : [...s.payoutBatches, batch],
        }));
      },

      removePayoutBatch: (id) => {
        set((s) => ({
          payoutBatches: s.payoutBatches.filter((b) => b.id !== id),
        }));
      },

      reset: () => set({ metaById: {}, payoutBatches: [] }),
    }),
    { name: "enterprise-billing-v3" },
  ),
);

function kindForTransition(next: InvoiceState) {
  switch (next) {
    case "draft":
      return "drafted" as const;
    case "pending_approval":
      return "submitted_for_approval" as const;
    case "approved":
      return "approved" as const;
    case "sent":
      return "sent" as const;
    case "paid":
      return "paid" as const;
    case "reconciled":
      return "reconciled" as const;
    case "eligible":
      return "edited" as const;
  }
}
