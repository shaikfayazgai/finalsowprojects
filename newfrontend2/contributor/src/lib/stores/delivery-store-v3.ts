/**
 * Delivery Tracking v3 store — persisted intervention records, SLA
 * overrides, holds, escalations, and audit. Keyed by task id (since a
 * delivery == a task moving through the cross-role lifecycle).
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DeliveryAuditEntry,
  DeliveryMetadata,
  DeliveryStage,
  InterventionKind,
  InterventionRecord,
} from "@/types/delivery";

interface DeliveryStoreState {
  metaById: Record<string, DeliveryMetadata>;

  ensureMeta: (taskId: string) => DeliveryMetadata;

  recordIntervention: (
    taskId: string,
    stage: DeliveryStage,
    kind: InterventionKind,
    actor: string,
    note?: string,
    cosignActor?: string,
  ) => void;

  setSlaOverride: (taskId: string, hours: number | undefined, actor: string) => void;

  applyHold: (
    taskId: string,
    reason: string,
    actor: string,
    stage?: DeliveryStage,
  ) => void;
  releaseHold: (taskId: string, actor: string) => void;

  reset: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMeta(taskId: string): DeliveryMetadata {
  return { taskId, interventions: [], audit: [] };
}

function auditKindForIntervention(
  kind: InterventionKind,
): DeliveryAuditEntry["kind"] {
  switch (kind) {
    case "reassigned":
      return "reassigned";
    case "sla_overridden":
      return "sla_overridden";
    case "convened":
      return "convened";
    case "held":
      return "held";
    case "released":
      return "released";
    case "escalated":
      return "escalated";
    case "withdrawn":
      return "escalation_resolved";
  }
}

export const useDeliveryStoreV3 = create<DeliveryStoreState>()(
  persist(
    (set, get) => ({
      metaById: {},

      ensureMeta: (taskId) => {
        const existing = get().metaById[taskId];
        if (existing) return existing;
        const meta = emptyMeta(taskId);
        set((s) => ({ metaById: { ...s.metaById, [taskId]: meta } }));
        return meta;
      },

      recordIntervention: (taskId, stage, kind, actor, note, cosignActor) => {
        set((s) => {
          const prev = s.metaById[taskId] ?? emptyMeta(taskId);
          const at = new Date().toISOString();
          const intervention: InterventionRecord = {
            id: uid("iv"),
            taskId,
            stage,
            kind,
            at,
            actor,
            cosignActor,
            note,
          };
          const audit: DeliveryAuditEntry = {
            id: uid("au"),
            at,
            taskId,
            stage,
            kind: auditKindForIntervention(kind),
            actor: cosignActor ? `${actor} + ${cosignActor}` : actor,
            detail: note,
          };
          return {
            metaById: {
              ...s.metaById,
              [taskId]: {
                ...prev,
                interventions: [...prev.interventions, intervention],
                audit: [...prev.audit, audit],
              },
            },
          };
        });
      },

      setSlaOverride: (taskId, hours, actor) => {
        set((s) => {
          const prev = s.metaById[taskId] ?? emptyMeta(taskId);
          const at = new Date().toISOString();
          const audit: DeliveryAuditEntry = {
            id: uid("au"),
            at,
            taskId,
            kind: "sla_overridden",
            actor,
            detail:
              hours === undefined
                ? "SLA override removed"
                : `SLA override set to ${hours}h`,
          };
          return {
            metaById: {
              ...s.metaById,
              [taskId]: {
                ...prev,
                slaOverrideHours: hours,
                audit: [...prev.audit, audit],
              },
            },
          };
        });
      },

      applyHold: (taskId, reason, actor, stage) => {
        set((s) => {
          const prev = s.metaById[taskId] ?? emptyMeta(taskId);
          const at = new Date().toISOString();
          const audit: DeliveryAuditEntry = {
            id: uid("au"),
            at,
            taskId,
            stage,
            kind: "held",
            actor,
            detail: reason,
          };
          return {
            metaById: {
              ...s.metaById,
              [taskId]: {
                ...prev,
                hold: { raisedAt: at, raisedBy: actor, reason },
                audit: [...prev.audit, audit],
              },
            },
          };
        });
      },

      releaseHold: (taskId, actor) => {
        set((s) => {
          const prev = s.metaById[taskId];
          if (!prev || !prev.hold) return s;
          const at = new Date().toISOString();
          const audit: DeliveryAuditEntry = {
            id: uid("au"),
            at,
            taskId,
            kind: "released",
            actor,
          };
          return {
            metaById: {
              ...s.metaById,
              [taskId]: {
                ...prev,
                hold: { ...prev.hold, releasedAt: at, releasedBy: actor },
                audit: [...prev.audit, audit],
              },
            },
          };
        });
      },

      reset: () => set({ metaById: {} }),
    }),
    { name: "enterprise-delivery-v3" },
  ),
);
