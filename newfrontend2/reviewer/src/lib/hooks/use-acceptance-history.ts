/**
 * TanStack Query hook for the enterprise acceptance decision history.
 *
 * Wraps `acceptanceApi.history(taskId)` (GET /api/enterprise/acceptance/[taskId]).
 * Cached per-task; stale-while-revalidate behavior comes from the global
 * QueryClient defaults (5min stale, 15min gc).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  acceptanceApi,
  AcceptanceApiError,
  type DecisionRecord,
} from "@/lib/api/acceptance";

export const acceptanceHistoryKeys = {
  all: ["acceptance", "history"] as const,
  byTask: (taskId: string) =>
    [...acceptanceHistoryKeys.all, taskId] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  // Never retry on 401/403/404 — refetching won't change the outcome.
  if (
    error instanceof AcceptanceApiError &&
    [401, 403, 404].includes(error.status)
  ) {
    return false;
  }
  return failureCount < 1;
}

export function useAcceptanceHistory(taskId: string | null | undefined) {
  return useQuery<DecisionRecord[], AcceptanceApiError>({
    queryKey: taskId
      ? acceptanceHistoryKeys.byTask(taskId)
      : ["acceptance", "history", "disabled"],
    queryFn: () => acceptanceApi.history(taskId!),
    enabled: Boolean(taskId),
    retry: shouldRetry,
  });
}
