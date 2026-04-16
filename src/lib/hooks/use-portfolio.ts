"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  portfolioApi,
  type PortfolioProjectsParams,
  type EvidencePacksParams,
  type ReworkRequestsParams,
} from "@/lib/api/portfolio";
import type {
  ExceptionCreateRequest,
  ProjectStatusUpdateRequest,
  TimelineView,
} from "@/types/enterprise";

const shouldRetry = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && (error.status === 403 || error.status === 401))
    return false;
  return failureCount < 1;
};

// ── Query keys ───────────────────────────────────────────────────────────

export const portfolioKeys = {
  all: ["portfolio"] as const,
  projects: (params?: PortfolioProjectsParams) =>
    [...portfolioKeys.all, "projects", params] as const,
  summaryMetrics: () => [...portfolioKeys.all, "summary-metrics"] as const,
  projectSummary: (id: string) =>
    [...portfolioKeys.all, "project-summary", id] as const,

  // Project-level
  project: (id: string) => [...portfolioKeys.all, "project", id] as const,
  overview: (id: string) => [...portfolioKeys.all, "overview", id] as const,
  activities: (id: string) =>
    [...portfolioKeys.all, "activities", id] as const,
  timeline: (id: string, view: TimelineView) =>
    [...portfolioKeys.all, "timeline", id, view] as const,
  completedProjects: () =>
    [...portfolioKeys.all, "completed-projects"] as const,
  evidencePacks: (id: string, params?: EvidencePacksParams) =>
    [...portfolioKeys.all, "evidence-packs", id, params] as const,
  reworkRequests: (id: string, params?: ReworkRequestsParams) =>
    [...portfolioKeys.all, "rework-requests", id, params] as const,
  exceptions: (id: string) =>
    [...portfolioKeys.all, "exceptions", id] as const,
};

// ── Portfolio queries ────────────────────────────────────────────────────

export function usePortfolioProjects(params?: PortfolioProjectsParams) {
  return useQuery({
    queryKey: portfolioKeys.projects(params),
    queryFn: () => portfolioApi.getPortfolioProjects(params),
    retry: shouldRetry,
  });
}

export function usePortfolioSummaryMetrics() {
  return useQuery({
    queryKey: portfolioKeys.summaryMetrics(),
    queryFn: () => portfolioApi.getPortfolioSummaryMetrics(),
    retry: shouldRetry,
  });
}

export function useProjectCardSummary(projectId: string) {
  return useQuery({
    queryKey: portfolioKeys.projectSummary(projectId),
    queryFn: () => portfolioApi.getProjectCardSummary(projectId),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

// ── Project queries ─────────────────────────────────────────────────────

export function useProjectDetail(projectId: string | null) {
  return useQuery({
    queryKey: portfolioKeys.project(projectId ?? ""),
    queryFn: () => portfolioApi.getProjectDetail(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

export function useProjectOverview(projectId: string | null) {
  return useQuery({
    queryKey: portfolioKeys.overview(projectId ?? ""),
    queryFn: () => portfolioApi.getProjectOverview(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

export function useProjectActivities(projectId: string | null) {
  return useQuery({
    queryKey: portfolioKeys.activities(projectId ?? ""),
    queryFn: () => portfolioApi.getProjectActivities(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

export function useProjectTimeline(
  projectId: string | null,
  view: TimelineView = "gantt",
) {
  return useQuery({
    queryKey: portfolioKeys.timeline(projectId ?? "", view),
    queryFn: () => portfolioApi.getProjectTimeline(projectId!, view),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

export function useCompletedProjects() {
  return useQuery({
    queryKey: portfolioKeys.completedProjects(),
    queryFn: () => portfolioApi.getCompletedProjects(),
    retry: shouldRetry,
  });
}

export function useEvidencePacks(
  projectId: string | null,
  params?: EvidencePacksParams,
) {
  return useQuery({
    queryKey: portfolioKeys.evidencePacks(projectId ?? "", params),
    queryFn: () => portfolioApi.getEvidencePacks(projectId!, params),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

export function useReworkRequests(
  projectId: string | null,
  params?: ReworkRequestsParams,
) {
  return useQuery({
    queryKey: portfolioKeys.reworkRequests(projectId ?? "", params),
    queryFn: () => portfolioApi.getReworkRequests(projectId!, params),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

export function useProjectExceptions(projectId: string | null) {
  return useQuery({
    queryKey: portfolioKeys.exceptions(projectId ?? ""),
    queryFn: () => portfolioApi.getProjectExceptions(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────

export function useUpdateProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: string;
      body: ProjectStatusUpdateRequest;
    }) => portfolioApi.updateProjectStatus(projectId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: portfolioKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: portfolioKeys.projects() });
    },
  });
}

export function useHoldProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => portfolioApi.holdProject(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: portfolioKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: portfolioKeys.projects() });
    },
  });
}

export function useResumeProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => portfolioApi.resumeProject(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: portfolioKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: portfolioKeys.projects() });
    },
  });
}

export function useCreateException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: string;
      body: ExceptionCreateRequest;
    }) => portfolioApi.createProjectException(projectId, body),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: portfolioKeys.exceptions(projectId) });
    },
  });
}

export function useKickoffProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      portfolioApi.kickoffProject(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portfolioKeys.projects() });
    },
  });
}
