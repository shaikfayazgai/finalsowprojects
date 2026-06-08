/**
 * SOW v3 store — persisted approval decisions, escalations, holds,
 * lifecycle transitions, and audit. Overrides ride on top of the mock
 * SOW data and survive reloads.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ApprovalGate,
  ApprovalGateId,
  EscalationRecord,
  GateState,
  SowAuditEntry,
  SowHold,
  SowMetadata,
  SowState,
} from "@/types/sow";

interface SowStoreState {
  metaById: Record<string, SowMetadata>;

  ensureMeta: (
    sowId: string,
    initialState: SowState,
    seededGates?: ApprovalGate[],
  ) => SowMetadata;

  transitionState: (
    sowId: string,
    next: SowState,
    actor: string,
    detail?: string,
  ) => void;

  setGate: (
    sowId: string,
    gateId: ApprovalGateId,
    state: GateState,
    actor: string,
    note?: string,
  ) => void;

  reassignGate: (
    sowId: string,
    gateId: ApprovalGateId,
    approverName: string,
    approverInitials: string,
    actor: string,
    note?: string,
  ) => void;

  raiseEscalation: (sowId: string, esc: Omit<EscalationRecord, "id" | "raisedAt">) => void;
  resolveEscalation: (
    sowId: string,
    escalationId: string,
    resolution: EscalationRecord["resolution"],
    actor: string,
  ) => void;

  applyHold: (sowId: string, hold: Omit<SowHold, "raisedAt">, actor: string) => void;
  releaseHold: (sowId: string, actor: string) => void;

  reset: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMeta(sowId: string, state: SowState, gates: ApprovalGate[]): SowMetadata {
  return {
    sowId,
    state,
    gates,
    escalations: [],
    audit: [],
  };
}

function auditKindForState(s: SowState): SowAuditEntry["kind"] {
  switch (s) {
    case "intake":
      return "intake_started";
    case "scoped":
      return "scoped";
    case "pending_approval":
      return "submitted_for_approval";
    case "approved":
      return "approved";
    case "decomposing":
      return "decomposed";
    case "delivering":
      return "delivery_started";
    case "completed":
      return "completed";
  }
}

export const useSowStoreV3 = create<SowStoreState>()(
  persist(
    (set, get) => ({
      metaById: {},

      ensureMeta: (sowId, initialState, seededGates) => {
        const existing = get().metaById[sowId];
        if (existing) return existing;
        const meta = emptyMeta(sowId, initialState, seededGates ?? []);
        set((s) => ({ metaById: { ...s.metaById, [sowId]: meta } }));
        return meta;
      },

      transitionState: (sowId, next, actor, detail) => {
        set((s) => {
          const prev = s.metaById[sowId] ?? emptyMeta(sowId, next, []);
          const at = new Date().toISOString();
          const audit = [
            ...prev.audit,
            { id: uid("au"), at, kind: auditKindForState(next), actor, detail },
          ];
          const stamp: Partial<SowMetadata> = {};
          if (next === "intake") stamp.intakeStartedAt = at;
          else if (next === "scoped") stamp.scopedAt = at;
          else if (next === "pending_approval") stamp.submittedAt = at;
          else if (next === "approved") stamp.approvedAt = at;
          else if (next === "decomposing") stamp.decomposingAt = at;
          else if (next === "delivering") stamp.deliveringAt = at;
          else if (next === "completed") stamp.completedAt = at;
          return {
            metaById: {
              ...s.metaById,
              [sowId]: { ...prev, state: next, audit, ...stamp },
            },
          };
        });
      },

      setGate: (sowId, gateId, state, actor, note) => {
        set((s) => {
          const prev = s.metaById[sowId];
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
            metaById: { ...s.metaById, [sowId]: { ...prev, gates, audit } },
          };
        });
      },

      reassignGate: (sowId, gateId, approverName, approverInitials, actor, note) => {
        set((s) => {
          const prev = s.metaById[sowId];
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
            metaById: { ...s.metaById, [sowId]: { ...prev, gates, audit } },
          };
        });
      },

      raiseEscalation: (sowId, esc) => {
        set((s) => {
          const prev = s.metaById[sowId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const newEsc: EscalationRecord = {
            ...esc,
            id: uid("esc"),
            raisedAt: at,
            sowId,
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
              [sowId]: {
                ...prev,
                escalations: [...prev.escalations, newEsc],
                audit,
              },
            },
          };
        });
      },

      resolveEscalation: (sowId, escalationId, resolution, actor) => {
        set((s) => {
          const prev = s.metaById[sowId];
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
            metaById: { ...s.metaById, [sowId]: { ...prev, escalations, audit } },
          };
        });
      },

      applyHold: (sowId, hold, actor) => {
        set((s) => {
          const prev = s.metaById[sowId];
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
              [sowId]: { ...prev, hold: { ...hold, raisedAt: at }, audit },
            },
          };
        });
      },

      releaseHold: (sowId, actor) => {
        set((s) => {
          const prev = s.metaById[sowId];
          if (!prev || !prev.hold) return s;
          const at = new Date().toISOString();
          const audit = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "released" as const,
              actor,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [sowId]: {
                ...prev,
                hold: { ...prev.hold, releasedAt: at, releasedBy: actor },
                audit,
              },
            },
          };
        });
      },

      reset: () => set({ metaById: {} }),
    }),
    { name: "enterprise-sow-v3" },
  ),
);
