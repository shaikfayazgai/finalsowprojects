/**
 * Decomposition v3 store — persisted approval decisions, escalations,
 * holds, AI hint apply/dismiss, lifecycle transitions, and audit.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ApprovalGate,
  DecompAuditEntry,
  EscalationRecord,
  GateId,
  GateState,
  PlanHold,
  PlanMetadata,
  PlanState,
} from "@/types/decomposition";

interface DecompStoreState {
  metaById: Record<string, PlanMetadata>;

  ensureMeta: (
    planId: string,
    initialState: PlanState,
    seededGates?: ApprovalGate[],
  ) => PlanMetadata;

  transitionState: (
    planId: string,
    next: PlanState,
    actor: string,
    detail?: string,
  ) => void;

  setGate: (
    planId: string,
    gateId: GateId,
    state: GateState,
    actor: string,
    note?: string,
  ) => void;

  reassignGate: (
    planId: string,
    gateId: GateId,
    approverName: string,
    approverInitials: string,
    actor: string,
    note?: string,
  ) => void;

  raiseEscalation: (
    planId: string,
    esc: Omit<EscalationRecord, "id" | "raisedAt">,
  ) => void;

  resolveEscalation: (
    planId: string,
    escalationId: string,
    resolution: EscalationRecord["resolution"],
    actor: string,
  ) => void;

  applyHold: (planId: string, hold: Omit<PlanHold, "raisedAt">, actor: string) => void;
  releaseHold: (planId: string, actor: string) => void;

  applyHint: (planId: string, hintId: string, actor: string, detail?: string) => void;
  dismissHint: (planId: string, hintId: string, actor: string, detail?: string) => void;

  reset: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMeta(planId: string, state: PlanState, gates: ApprovalGate[]): PlanMetadata {
  return {
    planId,
    state,
    gates,
    escalations: [],
    audit: [],
    appliedHintIds: [],
    dismissedHintIds: [],
  };
}

function auditKindForState(s: PlanState): DecompAuditEntry["kind"] {
  switch (s) {
    case "drafting":
      return "drafted";
    case "scoped":
      return "scoped";
    case "ai_reviewed":
      return "ai_reviewed";
    case "pending_approval":
      return "submitted_for_approval";
    case "approved":
      return "approved";
    case "decomposed":
      return "decomposed";
    case "in_delivery":
      return "delivery_started";
  }
}

export const useDecompStoreV3 = create<DecompStoreState>()(
  persist(
    (set, get) => ({
      metaById: {},

      ensureMeta: (planId, initialState, seededGates) => {
        const existing = get().metaById[planId];
        if (existing) return existing;
        const meta = emptyMeta(planId, initialState, seededGates ?? []);
        set((s) => ({ metaById: { ...s.metaById, [planId]: meta } }));
        return meta;
      },

      transitionState: (planId, next, actor, detail) => {
        set((s) => {
          const prev = s.metaById[planId] ?? emptyMeta(planId, next, []);
          const at = new Date().toISOString();
          const audit = [
            ...prev.audit,
            { id: uid("au"), at, kind: auditKindForState(next), actor, detail },
          ];
          const stamp: Partial<PlanMetadata> = {};
          if (next === "drafting") stamp.draftedAt = at;
          else if (next === "scoped") stamp.scopedAt = at;
          else if (next === "ai_reviewed") stamp.aiReviewedAt = at;
          else if (next === "pending_approval") stamp.submittedAt = at;
          else if (next === "approved") stamp.approvedAt = at;
          else if (next === "decomposed") stamp.decomposedAt = at;
          else if (next === "in_delivery") stamp.deliveryStartedAt = at;
          return {
            metaById: {
              ...s.metaById,
              [planId]: { ...prev, state: next, audit, ...stamp },
            },
          };
        });
      },

      setGate: (planId, gateId, state, actor, note) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const gates = prev.gates.map((g) =>
            g.id === gateId
              ? { ...g, state, decidedAt: at, note, daysInState: 0 }
              : g,
          );
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "gate_decision" as const,
              actor,
              detail: note ?? state,
              gateId,
            },
          ];
          return {
            metaById: { ...s.metaById, [planId]: { ...prev, gates, audit } },
          };
        });
      },

      reassignGate: (planId, gateId, approverName, approverInitials, actor, note) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const gates = prev.gates.map((g) =>
            g.id === gateId
              ? {
                  ...g,
                  approverName,
                  approverInitials,
                  state: "pending" as GateState,
                  decidedAt: undefined,
                  note,
                  daysInState: 0,
                }
              : g,
          );
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "gate_reassigned" as const,
              actor,
              detail: note ?? `Reassigned to ${approverName}`,
              gateId,
            },
          ];
          return {
            metaById: { ...s.metaById, [planId]: { ...prev, gates, audit } },
          };
        });
      },

      raiseEscalation: (planId, esc) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const newEsc: EscalationRecord = {
            ...esc,
            id: uid("esc"),
            raisedAt: at,
            planId,
          };
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "escalated" as const,
              actor: esc.raisedBy,
              detail: esc.note ?? esc.reason,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [planId]: {
                ...prev,
                escalations: [...prev.escalations, newEsc],
                audit,
              },
            },
          };
        });
      },

      resolveEscalation: (planId, escalationId, resolution, actor) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const escalations = prev.escalations.map((e) =>
            e.id === escalationId ? { ...e, resolvedAt: at, resolution } : e,
          );
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "escalation_resolved" as const,
              actor,
              detail: resolution,
            },
          ];
          return {
            metaById: { ...s.metaById, [planId]: { ...prev, escalations, audit } },
          };
        });
      },

      applyHold: (planId, hold, actor) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "held" as const,
              actor,
              detail: hold.note ?? hold.reason,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [planId]: { ...prev, hold: { ...hold, raisedAt: at }, audit },
            },
          };
        });
      },

      releaseHold: (planId, actor) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev || !prev.hold) return s;
          const at = new Date().toISOString();
          const audit = [
            ...prev.audit,
            { id: uid("au"), at, kind: "released" as const, actor },
          ];
          return {
            metaById: {
              ...s.metaById,
              [planId]: {
                ...prev,
                hold: { ...prev.hold, releasedAt: at, releasedBy: actor },
                audit,
              },
            },
          };
        });
      },

      applyHint: (planId, hintId, actor, detail) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const applied = prev.appliedHintIds.includes(hintId)
            ? prev.appliedHintIds
            : [...prev.appliedHintIds, hintId];
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "ai_hint_applied" as const,
              actor,
              detail,
              hintId,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [planId]: { ...prev, appliedHintIds: applied, audit },
            },
          };
        });
      },

      dismissHint: (planId, hintId, actor, detail) => {
        set((s) => {
          const prev = s.metaById[planId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const dismissed = prev.dismissedHintIds.includes(hintId)
            ? prev.dismissedHintIds
            : [...prev.dismissedHintIds, hintId];
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "ai_hint_dismissed" as const,
              actor,
              detail,
              hintId,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [planId]: { ...prev, dismissedHintIds: dismissed, audit },
            },
          };
        });
      },

      reset: () => set({ metaById: {} }),
    }),
    { name: "enterprise-decomp-v3" },
  ),
);
