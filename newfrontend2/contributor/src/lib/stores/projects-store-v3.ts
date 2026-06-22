/**
 * Projects v3 store — persisted lifecycle overrides, milestone state
 * overrides, exceptions, holds, and audit. Overrides ride on top of
 * the existing `useProjectsOverview` derivation and survive reloads.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ExceptionRecord,
  MilestoneState,
  ProjectAuditEntry,
  ProjectFlag,
  ProjectHold,
  ProjectLifecycleState,
  ProjectMetadata,
} from "@/types/projects";

interface ProjectsStoreState {
  metaById: Record<string, ProjectMetadata>;

  ensureMeta: (projectId: string) => ProjectMetadata;

  advancePhase: (
    projectId: string,
    next: ProjectLifecycleState,
    actor: string,
    detail?: string,
  ) => void;

  setMilestone: (
    projectId: string,
    milestoneId: string,
    state: MilestoneState,
    actor: string,
    note?: string,
  ) => void;

  setFlags: (projectId: string, flags: ProjectFlag[]) => void;

  reassignOwner: (
    projectId: string,
    ownerInitials: string,
    actor: string,
    note?: string,
  ) => void;

  raiseException: (
    projectId: string,
    exception: Omit<ExceptionRecord, "id" | "raisedAt" | "projectId">,
  ) => void;

  resolveException: (
    projectId: string,
    exceptionId: string,
    resolution: ExceptionRecord["resolution"],
    actor: string,
  ) => void;

  applyHold: (
    projectId: string,
    hold: Omit<ProjectHold, "raisedAt">,
    actor: string,
  ) => void;
  releaseHold: (projectId: string, actor: string) => void;

  acknowledgeRisk: (projectId: string, actor: string, note?: string) => void;

  reset: () => void;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMeta(projectId: string): ProjectMetadata {
  return {
    projectId,
    flags: [],
    exceptions: [],
    audit: [],
  };
}

export const useProjectsStoreV3 = create<ProjectsStoreState>()(
  persist(
    (set, get) => ({
      metaById: {},

      ensureMeta: (projectId) => {
        const existing = get().metaById[projectId];
        if (existing) return existing;
        const meta = emptyMeta(projectId);
        set((s) => ({ metaById: { ...s.metaById, [projectId]: meta } }));
        return meta;
      },

      advancePhase: (projectId, next, actor, detail) => {
        set((s) => {
          const prev = s.metaById[projectId] ?? emptyMeta(projectId);
          const at = new Date().toISOString();
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            { id: uid("au"), at, kind: "phase_advanced", actor, detail },
          ];
          return {
            metaById: {
              ...s.metaById,
              [projectId]: { ...prev, lifecycleOverride: next, audit },
            },
          };
        });
      },

      setMilestone: (projectId, milestoneId, state, actor, note) => {
        set((s) => {
          const prev = s.metaById[projectId] ?? emptyMeta(projectId);
          const at = new Date().toISOString();
          const kind: ProjectAuditEntry["kind"] =
            state === "done"
              ? "milestone_completed"
              : state === "blocked"
                ? "milestone_blocked"
                : state === "active"
                  ? "milestone_started"
                  : "edited";
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            { id: uid("au"), at, kind, actor, detail: note, milestoneId },
          ];
          return {
            metaById: {
              ...s.metaById,
              [projectId]: {
                ...prev,
                milestoneOverrides: {
                  ...(prev.milestoneOverrides ?? {}),
                  [milestoneId]: state,
                },
                audit,
              },
            },
          };
        });
      },

      setFlags: (projectId, flags) => {
        set((s) => {
          const prev = s.metaById[projectId] ?? emptyMeta(projectId);
          return {
            metaById: { ...s.metaById, [projectId]: { ...prev, flags } },
          };
        });
      },

      reassignOwner: (projectId, ownerInitials, actor, note) => {
        set((s) => {
          const prev = s.metaById[projectId] ?? emptyMeta(projectId);
          const at = new Date().toISOString();
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "owner_reassigned",
              actor,
              detail: note ?? `Reassigned to ${ownerInitials}`,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [projectId]: { ...prev, ownerOverride: ownerInitials, audit },
            },
          };
        });
      },

      raiseException: (projectId, exception) => {
        set((s) => {
          const prev = s.metaById[projectId] ?? emptyMeta(projectId);
          const at = new Date().toISOString();
          const newExc: ExceptionRecord = {
            ...exception,
            id: uid("exc"),
            raisedAt: at,
            projectId,
          };
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "exception_raised",
              actor: exception.raisedBy,
              detail: exception.note ?? exception.kind,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [projectId]: {
                ...prev,
                exceptions: [...prev.exceptions, newExc],
                audit,
              },
            },
          };
        });
      },

      resolveException: (projectId, exceptionId, resolution, actor) => {
        set((s) => {
          const prev = s.metaById[projectId];
          if (!prev) return s;
          const at = new Date().toISOString();
          const exceptions = prev.exceptions.map((e) =>
            e.id === exceptionId ? { ...e, resolvedAt: at, resolution } : e,
          );
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "exception_resolved",
              actor,
              detail: resolution,
            },
          ];
          return {
            metaById: { ...s.metaById, [projectId]: { ...prev, exceptions, audit } },
          };
        });
      },

      applyHold: (projectId, hold, actor) => {
        set((s) => {
          const prev = s.metaById[projectId] ?? emptyMeta(projectId);
          const at = new Date().toISOString();
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            {
              id: uid("au"),
              at,
              kind: "hold_applied",
              actor,
              detail: hold.note ?? hold.reason,
            },
          ];
          return {
            metaById: {
              ...s.metaById,
              [projectId]: { ...prev, hold: { ...hold, raisedAt: at }, audit },
            },
          };
        });
      },

      releaseHold: (projectId, actor) => {
        set((s) => {
          const prev = s.metaById[projectId];
          if (!prev?.hold) return s;
          const at = new Date().toISOString();
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            { id: uid("au"), at, kind: "hold_released", actor },
          ];
          return {
            metaById: {
              ...s.metaById,
              [projectId]: {
                ...prev,
                hold: { ...prev.hold, releasedAt: at, releasedBy: actor },
                audit,
              },
            },
          };
        });
      },

      acknowledgeRisk: (projectId, actor, note) => {
        set((s) => {
          const prev = s.metaById[projectId] ?? emptyMeta(projectId);
          const at = new Date().toISOString();
          const audit: ProjectAuditEntry[] = [
            ...prev.audit,
            { id: uid("au"), at, kind: "risk_acknowledged", actor, detail: note },
          ];
          return {
            metaById: { ...s.metaById, [projectId]: { ...prev, audit } },
          };
        });
      },

      reset: () => set({ metaById: {} }),
    }),
    { name: "enterprise-projects-v3" },
  ),
);
