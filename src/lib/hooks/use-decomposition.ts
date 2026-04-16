"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { decompositionApi } from "@/lib/api/decomposition";
import { ApiError } from "@/lib/api/client";

// Don't retry on 403/401 — these won't resolve on retry
const shouldRetry = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && (error.status === 403 || error.status === 401)) return false;
  return failureCount < 1;
};

// ── Query keys ───────────────────────────────────────────────────────────

export const decompositionKeys = {
  all: ["decomposition"] as const,
  plans: () => [...decompositionKeys.all, "plans"] as const,
  plan: (id: string) => [...decompositionKeys.all, "plan", id] as const,
  planStatus: (id: string) => [...decompositionKeys.all, "status", id] as const,
  revision: (id: string) => [...decompositionKeys.all, "revision", id] as const,
  revisionModal: (id: string) => [...decompositionKeys.all, "revision-modal", id] as const,
  revisedPlan: (id: string) => [...decompositionKeys.all, "revised", id] as const,
  revisionDetail: (planId: string, revId: string) => [...decompositionKeys.all, "revision-detail", planId, revId] as const,
  summary: (id: string) => [...decompositionKeys.all, "summary", id] as const,
  summaryPanel: (id: string) => [...decompositionKeys.all, "summary-panel", id] as const,
  checklist: (id: string) => [...decompositionKeys.all, "checklist", id] as const,
  checklistFull: (id: string) => [...decompositionKeys.all, "checklist-full", id] as const,
  checklistValidate: (id: string) => [...decompositionKeys.all, "checklist-validate", id] as const,
  checklistDates: (id: string) => [...decompositionKeys.all, "checklist-dates", id] as const,
  review: (id: string) => [...decompositionKeys.all, "review", id] as const,
  reviewChecklist: (id: string) => [...decompositionKeys.all, "review-checklist", id] as const,
  reviewSummary: (id: string) => [...decompositionKeys.all, "review-summary", id] as const,
  tasks: (id: string) => [...decompositionKeys.all, "tasks", id] as const,
  tasksQuery: (id: string, params?: Record<string, string>) => [...decompositionKeys.all, "tasks-query", id, params] as const,
  task: (planId: string, taskId: string) => [...decompositionKeys.all, "task", planId, taskId] as const,
  taskDetail: (planId: string, taskId: string) => [...decompositionKeys.all, "task-detail", planId, taskId] as const,
  milestones: (id: string) => [...decompositionKeys.all, "milestones", id] as const,
  criticalPath: (id: string) => [...decompositionKeys.all, "critical-path", id] as const,
};

// ── Plans ────────────────────────────────────────────────────────────────

export function useDecompositionPlans() {
  return useQuery({
    queryKey: decompositionKeys.plans(),
    queryFn: () => decompositionApi.listPlans(),
    retry: shouldRetry,
  });
}

export function useDecompositionPlan(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.plan(planId ?? ""),
    queryFn: () => decompositionApi.getPlan(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

// ── Plan Status & Lock ──────────────────────────────────────────────────

export function usePlanStatus(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.planStatus(planId ?? ""),
    queryFn: () => decompositionApi.getPlanStatus(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useLockPlan(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.lockPlan(planId);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.planStatus(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
      }
    },
  });
}

// ── Confirm ─────────────────────────────────────────────────────────────

export function useConfirmPlan(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.confirmPlan(planId);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.planStatus(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
      }
    },
  });
}

// ── Revision ────────────────────────────────────────────────────────────

export function useRevision(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.revision(planId ?? ""),
    queryFn: () => decompositionApi.getRevision(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useIncreaseRevision(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.increaseRevision(planId);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.revision(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
      }
    },
  });
}

export function useRequestRevision(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: unknown) => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.requestRevision(planId, payload);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.revision(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
      }
    },
  });
}

export function useRevisionModal(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.revisionModal(planId ?? ""),
    queryFn: () => decompositionApi.getRevisionModal(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useRevisedPlan(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.revisedPlan(planId ?? ""),
    queryFn: () => decompositionApi.getRevisedPlan(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useRevisionDetail(planId: string | null, revisionId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.revisionDetail(planId ?? "", revisionId ?? ""),
    queryFn: () => decompositionApi.getRevisionDetail(planId!, revisionId!),
    enabled: !!planId && !!revisionId,
    retry: shouldRetry,
  });
}

// ── Summary ─────────────────────────────────────────────────────────────

export function usePlanSummary(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.summary(planId ?? ""),
    queryFn: () => decompositionApi.getSummary(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useSummaryPanel(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.summaryPanel(planId ?? ""),
    queryFn: () => decompositionApi.getSummaryPanel(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

// ── Checklist ───────────────────────────────────────────────────────────

export function useChecklistStatus(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.checklist(planId ?? ""),
    queryFn: () => decompositionApi.getChecklistStatus(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useChecklist(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.checklistFull(planId ?? ""),
    queryFn: () => decompositionApi.getChecklist(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useUpdateChecklist(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.updateChecklist(planId, payload);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.checklistFull(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.checklist(planId) });
      }
    },
  });
}

export function useValidateChecklist(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.checklistValidate(planId ?? ""),
    queryFn: () => decompositionApi.validateChecklist(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useValidateChecklistDates(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.checklistDates(planId ?? ""),
    queryFn: () => decompositionApi.validateChecklistDates(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

// ── Review ──────────────────────────────────────────────────────────────

export function useReview(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.review(planId ?? ""),
    queryFn: () => decompositionApi.getReview(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useReviewChecklist(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.reviewChecklist(planId ?? ""),
    queryFn: () => decompositionApi.getReviewChecklist(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useUpdateReviewChecklist(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.updateReviewChecklist(planId, payload);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.reviewChecklist(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.review(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.checklist(planId) });
      }
    },
  });
}

export function useReviewSummary(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.reviewSummary(planId ?? ""),
    queryFn: () => decompositionApi.getReviewSummary(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

// ── Tasks ───────────────────────────────────────────────────────────────

export function useTasks(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.tasks(planId ?? ""),
    queryFn: () => decompositionApi.getTasks(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useQueryTasks(planId: string | null, params?: Record<string, string>) {
  return useQuery({
    queryKey: decompositionKeys.tasksQuery(planId ?? "", params),
    queryFn: () => decompositionApi.queryTasks(planId!, params),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useTask(planId: string | null, taskId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.task(planId ?? "", taskId ?? ""),
    queryFn: () => decompositionApi.getTask(planId!, taskId!),
    enabled: !!planId && !!taskId,
    retry: shouldRetry,
  });
}

export function useTaskDetail(planId: string | null, taskId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.taskDetail(planId ?? "", taskId ?? ""),
    queryFn: () => decompositionApi.getTaskDetail(planId!, taskId!),
    enabled: !!planId && !!taskId,
    retry: shouldRetry,
  });
}

export function useFlagTask(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload?: unknown }) => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.flagTask(planId, taskId, payload);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.tasks(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
      }
    },
  });
}

// ── Milestones ──────────────────────────────────────────────────────────

export function useMilestones(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.milestones(planId ?? ""),
    queryFn: () => decompositionApi.getMilestones(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useCriticalPath(planId: string | null) {
  return useQuery({
    queryKey: decompositionKeys.criticalPath(planId ?? ""),
    queryFn: () => decompositionApi.getCriticalPath(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

// ── Plan Actions ────────────────────────────────────────────────────────

export function useKickoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { plan_id: string } & Record<string, unknown>) => decompositionApi.kickoff(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => decompositionApi.withdraw(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
    },
  });
}

// ── Create Plan ────────────────────────────────────────────────────────

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => decompositionApi.createPlan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
    },
  });
}

// ── Legacy / Internal ──────────────────────────────────────────────────

export function useConfigureLegacy(planId: string | null) {
  return useQuery({
    queryKey: [...decompositionKeys.all, "configure-legacy", planId] as const,
    queryFn: () => decompositionApi.configureLegacy(planId!),
    enabled: !!planId,
    retry: shouldRetry,
  });
}

export function useRevisionComplete(planId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!planId) throw new Error("No plan id");
      return decompositionApi.revisionComplete(planId);
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: decompositionKeys.plan(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.revision(planId) });
        qc.invalidateQueries({ queryKey: decompositionKeys.plans() });
      }
    },
  });
}
