"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  teamsApi,
  type SkillReviewRequestBody,
  type SkillReviewRequestResponse,
} from "@/lib/api/teams";
import { ApiError } from "@/lib/api/client";

const shouldRetry = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError) {
    // Never retry auth / not-found errors
    if ([401, 403, 404].includes(error.status)) return false;
    // Retry 503 (backend cold-start) up to 3 times
    if (error.status === 503) return failureCount < 3;
  }
  return failureCount < 1;
};

const retryDelay = (failureCount: number, error: unknown) => {
  // Back off longer for 503 cold-start: 3 s → 6 s → 12 s
  if (error instanceof ApiError && error.status === 503) {
    return Math.min(3_000 * 2 ** failureCount, 15_000);
  }
  return 1_000;
};

export const teamsKeys = {
  all: ["teams"] as const,
  projects: () => [...teamsKeys.all, "projects"] as const,
  composition: (projectId: string) => [...teamsKeys.all, "composition", projectId] as const,
  skillCoverage: (projectId: string) => [...teamsKeys.all, "skill-coverage", projectId] as const,
};

export function useProjectsList() {
  return useQuery({
    queryKey: teamsKeys.projects(),
    queryFn: () => teamsApi.listProjects(),
    retry: shouldRetry,
    retryDelay,
  });
}

export function useTeamComposition(projectId: string | null | undefined) {
  return useQuery({
    queryKey: teamsKeys.composition(projectId ?? ""),
    queryFn: () => teamsApi.getTeamComposition(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
    retryDelay,
  });
}

export function useSkillCoverage(projectId: string | null | undefined) {
  return useQuery({
    queryKey: teamsKeys.skillCoverage(projectId ?? ""),
    queryFn: () => teamsApi.getSkillCoverage(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
    retryDelay,
  });
}

export function useSkillReviewRequest(projectId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation<SkillReviewRequestResponse, Error, SkillReviewRequestBody | undefined>({
    mutationFn: (body) => teamsApi.postSkillReviewRequest(projectId!, body),
    onSuccess: () => {
      if (projectId) {
        qc.invalidateQueries({ queryKey: teamsKeys.skillCoverage(projectId) });
      }
    },
  });
}
