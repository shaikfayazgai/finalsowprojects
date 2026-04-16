"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  teamsApi,
  type SkillReviewRequestBody,
  type SkillReviewRequestResponse,
} from "@/lib/api/teams";
import { ApiError } from "@/lib/api/client";

const shouldRetry = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) return false;
  return failureCount < 1;
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
  });
}

export function useTeamComposition(projectId: string | null | undefined) {
  return useQuery({
    queryKey: teamsKeys.composition(projectId ?? ""),
    queryFn: () => teamsApi.getTeamComposition(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
  });
}

export function useSkillCoverage(projectId: string | null | undefined) {
  return useQuery({
    queryKey: teamsKeys.skillCoverage(projectId ?? ""),
    queryFn: () => teamsApi.getSkillCoverage(projectId!),
    enabled: !!projectId,
    retry: shouldRetry,
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
