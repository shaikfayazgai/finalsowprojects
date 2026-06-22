"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  RecommendationKind,
  RecommendationRecord,
  ReviewerAuditEntry,
  ReviewerAuditKind,
  ReviewerEscalation,
  ReviewerHold,
  ValidationFlag,
  ValidationMetadata,
  ValidationPhase,
} from "@/types/reviewer";

interface ReviewerStoreState {
  metaById: Record<string, ValidationMetadata>;

  ensureMeta: (taskId: string) => ValidationMetadata;
  setPhase: (taskId: string, phase: ValidationPhase, actor: string) => void;
  setFlags: (taskId: string, flags: ValidationFlag[]) => void;
  setEvidenceState: (
    taskId: string,
    artifactId: string,
    state: "unverified" | "verified" | "rejected",
    actor: string,
  ) => void;

  submitRecommendation: (
    taskId: string,
    kind: RecommendationKind,
    confidence: number,
    actor: string,
    note?: string,
  ) => void;
  revokeRecommendation: (taskId: string, actor: string) => void;

  raiseEscalation: (
    taskId: string,
    escalation: Omit<ReviewerEscalation, "id" | "raisedAt" | "taskId">,
  ) => void;
  resolveEscalation: (
    taskId: string,
    escalationId: string,
    resolution: ReviewerEscalation["resolution"],
    actor: string,
  ) => void;

  applyHold: (
    taskId: string,
    hold: Omit<ReviewerHold, "raisedAt">,
    actor: string,
  ) => void;
  releaseHold: (taskId: string, actor: string) => void;

  reassignReviewer: (taskId: string, initials: string, actor: string, note?: string) => void;

  appendAudit: (taskId: string, kind: ReviewerAuditKind, actor: string, detail?: string) => void;

  reset: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMeta(taskId: string): ValidationMetadata {
  return {
    taskId,
    flags: [],
    evidence: {},
    escalations: [],
    audit: [],
  };
}

function stamp(
  meta: ValidationMetadata,
  kind: ReviewerAuditKind,
  actor: string,
  detail?: string,
): ReviewerAuditEntry {
  const entry: ReviewerAuditEntry = {
    id: uid("aud"),
    at: new Date().toISOString(),
    kind,
    actor,
    detail,
  };
  meta.audit = [entry, ...meta.audit].slice(0, 200);
  return entry;
}

export const useReviewerStoreV3 = create<ReviewerStoreState>()(
  persist(
    (set, get) => ({
      metaById: {},

      ensureMeta: (taskId) => {
        const existing = get().metaById[taskId];
        if (existing) return existing;
        const created = emptyMeta(taskId);
        set((s) => ({ metaById: { ...s.metaById, [taskId]: created } }));
        return created;
      },

      setPhase: (taskId, phase, actor) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const next = { ...meta, phase };
          stamp(next, "validation_opened", actor, `Phase → ${phase}`);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      setFlags: (taskId, flags) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          return {
            metaById: { ...s.metaById, [taskId]: { ...meta, flags } },
          };
        });
      },

      setEvidenceState: (taskId, artifactId, state, actor) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const next: ValidationMetadata = {
            ...meta,
            evidence: { ...meta.evidence, [artifactId]: state },
          };
          if (state !== "unverified") {
            stamp(
              next,
              state === "verified" ? "evidence_verified" : "evidence_rejected",
              actor,
              artifactId,
            );
          }
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      submitRecommendation: (taskId, kind, confidence, actor, note) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const rec: RecommendationRecord = {
            id: uid("rec"),
            at: new Date().toISOString(),
            reviewer: actor,
            kind,
            confidence: Math.max(0, Math.min(100, Math.round(confidence))),
            note,
          };
          const next: ValidationMetadata = { ...meta, recommendation: rec };
          stamp(next, "recommendation_submitted", actor, kind);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      revokeRecommendation: (taskId, actor) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const next: ValidationMetadata = { ...meta, recommendation: undefined };
          stamp(next, "recommendation_revoked", actor);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      raiseEscalation: (taskId, escalation) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const rec: ReviewerEscalation = {
            ...escalation,
            id: uid("esc"),
            taskId,
            raisedAt: new Date().toISOString(),
          };
          const next: ValidationMetadata = {
            ...meta,
            escalations: [rec, ...meta.escalations],
          };
          stamp(next, "escalation_raised", escalation.raisedBy, escalation.kind);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      resolveEscalation: (taskId, escalationId, resolution, actor) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const next: ValidationMetadata = {
            ...meta,
            escalations: meta.escalations.map((e) =>
              e.id === escalationId
                ? { ...e, resolvedAt: new Date().toISOString(), resolution }
                : e,
            ),
          };
          stamp(next, "escalation_resolved", actor, resolution);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      applyHold: (taskId, hold, actor) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const next: ValidationMetadata = {
            ...meta,
            hold: { ...hold, raisedAt: new Date().toISOString() },
          };
          stamp(next, "hold_applied", actor, hold.reason);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      releaseHold: (taskId, actor) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          if (!meta.hold) return s;
          const next: ValidationMetadata = {
            ...meta,
            hold: { ...meta.hold, releasedAt: new Date().toISOString(), releasedBy: actor },
          };
          stamp(next, "hold_released", actor);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      reassignReviewer: (taskId, initials, actor, note) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const next: ValidationMetadata = { ...meta, reviewerInitials: initials };
          stamp(next, "owner_reassigned", actor, note ?? `Reviewer → ${initials}`);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      appendAudit: (taskId, kind, actor, detail) => {
        set((s) => {
          const meta = s.metaById[taskId] ?? emptyMeta(taskId);
          const next = { ...meta };
          stamp(next, kind, actor, detail);
          return { metaById: { ...s.metaById, [taskId]: next } };
        });
      },

      reset: () => set({ metaById: {} }),
    }),
    { name: "enterprise-reviewer-v3" },
  ),
);
