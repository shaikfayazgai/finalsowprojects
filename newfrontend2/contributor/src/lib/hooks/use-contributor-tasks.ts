"use client";

/**
 * TanStack Query hooks for the contributor task + submission flow (UI1a).
 *
 * Query keys are tuple-shaped so cache invalidation targets the right
 * scope. Mutations patch the cache in place when they return a refreshed
 * detail; otherwise they invalidate the relevant lists.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  acceptTask,
  attachArtifact,
  createDraft,
  declineTask,
  getSubmission,
  getTask,
  listMySubmissions,
  listMyTasks,
  removeArtifact,
  submitSubmission,
  updateSubmission,
  withdrawSubmission,
  type ContributorTaskDetail,
  type DeclineReason,
} from "@/lib/api/contributor-tasks";
import {
  completedFromTasks,
  revisionsFromTasks,
  submissionsFromTasks,
} from "@/lib/api/contributor-task-views";
import {
  fetchCompletedTasks,
  fetchRevisions,
  type CompletedRow,
  type RevisionRow,
} from "@/lib/api/contributor-mock";
import { demoAssignmentOverlay } from "@/lib/enterprise/mocks/demo-task-assignments";
import {
  contributorMockTaskOverlay,
  contributorMockSubmissionOverlay,
} from "@/lib/contributor/mock-task-bridge";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import type { SubmissionDetail, SubmissionSummary } from "@/lib/submissions/types";

const keys = {
  taskList: (status?: string | string[]) =>
    ["contributor", "tasks", "list", status] as const,
  taskDetail: (taskId: string) => ["contributor", "tasks", "detail", taskId] as const,
  submissionList: (taskId?: string) =>
    ["contributor", "submissions", "list", taskId] as const,
  submissionDetail: (submissionId: string) =>
    ["contributor", "submissions", "detail", submissionId] as const,
};

/* ───────────────────────── Tasks ───────────────────────── */

export function useMyTasks(params: { status?: string | string[]; limit?: number } = {}) {
  const { data: session } = useSession();
  const demoTick = useOverlayVersion(demoAssignmentOverlay);
  const mockTick = useOverlayVersion(contributorMockTaskOverlay);
  return useQuery({
    queryKey: [...keys.taskList(params.status), session?.user?.email ?? "", demoTick, mockTick] as const,
    queryFn: () =>
      listMyTasks({
        ...params,
        contributorEmail: session?.user?.email ?? null,
      }),
  });
}

export function useTaskDetail(taskId: string | undefined) {
  const demoTick = useOverlayVersion(demoAssignmentOverlay);
  const mockTick = useOverlayVersion(contributorMockTaskOverlay);
  const mockSubTick = useOverlayVersion(contributorMockSubmissionOverlay);
  return useQuery({
    queryKey: taskId ? ([...keys.taskDetail(taskId), demoTick, mockTick, mockSubTick] as const) : (["contributor", "tasks", "detail", "—"] as const),
    queryFn: () => {
      if (!taskId) throw new Error("taskId required");
      return getTask(taskId);
    },
    enabled: !!taskId,
  });
}

export function useAcceptTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => acceptTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.taskDetail(taskId) });
      qc.invalidateQueries({ queryKey: ["contributor", "tasks", "list"] });
    },
  });
}

export function useDeclineTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { reason: DeclineReason; note?: string }) =>
      declineTask(taskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.taskDetail(taskId) });
      qc.invalidateQueries({ queryKey: ["contributor", "tasks", "list"] });
    },
  });
}

/* ───────────────────────── Submissions ───────────────────── */

export function useMySubmissions(params: { taskId?: string; status?: string | string[] } = {}) {
  return useQuery({
    queryKey: keys.submissionList(params.taskId),
    queryFn: () => listMySubmissions(params),
  });
}

export function useSubmissionDetail(submissionId: string | undefined) {
  const mockSubTick = useOverlayVersion(contributorMockSubmissionOverlay);
  return useQuery({
    queryKey: submissionId
      ? ([...keys.submissionDetail(submissionId), mockSubTick] as const)
      : (["contributor", "submissions", "detail", "—"] as const),
    queryFn: () => {
      if (!submissionId) throw new Error("submissionId required");
      return getSubmission(submissionId);
    },
    enabled: !!submissionId,
  });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      taskDefinitionId: string;
      body?: string;
      payload?: Record<string, unknown>;
    }) => createDraft(input),
    onSuccess: (data: { submission: SubmissionDetail }, vars) => {
      qc.setQueryData(keys.submissionDetail(data.submission.id), { submission: data.submission });
      qc.invalidateQueries({ queryKey: keys.taskDetail(vars.taskDefinitionId) });
      qc.invalidateQueries({ queryKey: ["contributor", "tasks", "list"] });
      qc.invalidateQueries({ queryKey: ["contributor", "submissions"] });
    },
  });
}

export function useUpdateSubmission(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body?: string; payload?: Record<string, unknown> }) =>
      updateSubmission(submissionId, input),
    onSuccess: (data: { submission: SubmissionDetail }) => {
      qc.setQueryData(keys.submissionDetail(submissionId), data);
    },
  });
}

export function useAttachArtifact(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof attachArtifact>[1]) =>
      attachArtifact(submissionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.submissionDetail(submissionId) });
    },
  });
}

export function useRemoveArtifact(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (artifactId: string) => removeArtifact(submissionId, artifactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.submissionDetail(submissionId) });
    },
  });
}

export function useSubmitSubmission(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitSubmission(submissionId),
    onSuccess: (data: { submission: SubmissionDetail }) => {
      qc.setQueryData(keys.submissionDetail(submissionId), data);
      qc.invalidateQueries({ queryKey: ["contributor", "tasks"] });
      qc.invalidateQueries({ queryKey: ["contributor", "submissions"] });
      qc.invalidateQueries({ queryKey: ["contributor", "revisions"] });
    },
  });
}

export function useWithdrawSubmission(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => withdrawSubmission(submissionId),
    onSuccess: (data: { submission: SubmissionDetail }) => {
      qc.setQueryData(keys.submissionDetail(submissionId), data);
      qc.invalidateQueries({ queryKey: ["contributor", "tasks"] });
      qc.invalidateQueries({ queryKey: ["contributor", "submissions"] });
    },
  });
}

/** Submissions lane — API list first, task-derived fallback when empty. */
export function useSubmissionLane(params: { status?: string | string[] } = {}) {
  const { data: session } = useSession();
  const demoTick = useOverlayVersion(demoAssignmentOverlay);
  const mockTaskTick = useOverlayVersion(contributorMockTaskOverlay);
  const mockSubTick = useOverlayVersion(contributorMockSubmissionOverlay);
  return useQuery({
    queryKey: [
      "contributor",
      "submissions",
      "lane",
      params.status,
      session?.user?.email ?? "",
      demoTick,
      mockTaskTick,
      mockSubTick,
    ] as const,
    queryFn: async (): Promise<SubmissionSummary[]> => {
      const fromApi = await listMySubmissions(params);
      if (fromApi.items.length > 0) return fromApi.items;
      const { items } = await listMyTasks({
        limit: 100,
        contributorEmail: session?.user?.email ?? null,
      });
      let derived = submissionsFromTasks(items);
      if (params.status) {
        const allowed = new Set(
          Array.isArray(params.status) ? params.status : [params.status],
        );
        derived = derived.filter((s) => allowed.has(s.status));
      }
      return derived;
    },
  });
}

/** Revisions queue — real tasks first, mock fallback when empty. */
export function useRevisionsQueue() {
  const { data: session } = useSession();
  const overlayTick = useOverlayVersion(demoAssignmentOverlay);
  return useQuery({
    queryKey: ["contributor", "revisions", session?.user?.email ?? "", overlayTick] as const,
    queryFn: async (): Promise<RevisionRow[]> => {
      const { items } = await listMyTasks({
        limit: 100,
        contributorEmail: session?.user?.email ?? null,
      });
      const fromApi = revisionsFromTasks(items);
      if (fromApi.length > 0) return fromApi;
      const mock = await fetchRevisions();
      return mock.items;
    },
  });
}

/** Completed tasks — real tasks first, mock fallback when empty. */
export function useCompletedTasks() {
  const { data: session } = useSession();
  const overlayTick = useOverlayVersion(demoAssignmentOverlay);
  return useQuery({
    queryKey: ["contributor", "completed", session?.user?.email ?? "", overlayTick] as const,
    queryFn: async (): Promise<{ items: CompletedRow[]; totalEarnedMinor: number }> => {
      const { items } = await listMyTasks({
        limit: 100,
        contributorEmail: session?.user?.email ?? null,
      });
      const fromApi = completedFromTasks(items);
      if (fromApi.items.length > 0) return fromApi;
      const mock = await fetchCompletedTasks();
      return {
        items: mock.items,
        totalEarnedMinor: mock.totalEarnedMinor,
      };
    },
  });
}

export type { ContributorTaskDetail };
