"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignTask,
  fetchMatchCandidates,
  listWorkforce,
  type AssignTaskResult,
  type ListWorkforceResult,
} from "@/lib/api/workforce";
import type { FindCandidatesResult } from "@/lib/matching/types";

export function useWorkforceDirectory(params: {
  search?: string;
  department?: string;
  enabled?: boolean;
}) {
  return useQuery<ListWorkforceResult>({
    queryKey: ["enterprise", "workforce", params.search ?? "", params.department ?? ""],
    queryFn: () =>
      listWorkforce({
        search: params.search,
        department: params.department,
        limit: 100,
      }),
    enabled: params.enabled !== false,
  });
}

export function useMatchCandidates(
  taskId: string | null,
  pool: "organization" | "network" | "organization_first",
  enabled: boolean,
) {
  return useQuery<FindCandidatesResult>({
    queryKey: ["matching", "candidates", taskId, pool],
    queryFn: () => fetchMatchCandidates(taskId!, pool),
    enabled: enabled && !!taskId,
  });
}

export function useAssignTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation<
    AssignTaskResult,
    Error,
    { contributorUserId: string; directAssign?: boolean; contributorEmail?: string }
  >({
    mutationFn: ({ contributorUserId, directAssign, contributorEmail }) =>
      assignTask(taskId, contributorUserId, directAssign, contributorEmail),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["matching", "candidates", taskId] });
    },
  });
}
