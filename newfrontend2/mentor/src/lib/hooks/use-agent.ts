/**
 * TanStack Query hook for AI agent calls.
 *
 * Each invocation is cached by (agentId + requestId). Pass a stable
 * `requestId` derived from the input you want to dedupe on — typically
 * something like `task-${taskId}-criteria-v${revisionCount}`. The
 * orchestrator's 24h server-side idempotency window means re-renders
 * within that period reuse the prior result.
 *
 * Returns a typed result. Callers check `.data?.ok` to discriminate
 * success vs typed failure, then either render the response or fall
 * back gracefully (per locked decision #7 — every UI works without AI).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  invokeAgentApi,
  AiApiError,
  type AgentId,
  type AgentResult,
} from "@/lib/api/ai";

export const agentKeys = {
  all: ["agent"] as const,
  invocation: (agentId: AgentId, requestId: string) =>
    [...agentKeys.all, agentId, requestId] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  // Don't retry on auth or forbidden — refetch won't help.
  if (
    error instanceof AiApiError &&
    [401, 403, 400].includes(error.status)
  ) {
    return false;
  }
  return failureCount < 1;
}

export interface UseAgentOptions<
  TInput extends object,
> {
  agentId: AgentId;
  promptName: string;
  variables: TInput;
  /** Stable cache key. Re-renders with the same key reuse the same result. */
  requestId: string;
  /** Defaults to true; pass false to suspend the query (e.g. taskId not ready). */
  enabled?: boolean;
}

export function useAgent<
  TInput extends object,
  TOutput,
>(options: UseAgentOptions<TInput>) {
  const { agentId, promptName, variables, requestId, enabled = true } =
    options;

  return useQuery<AgentResult<TOutput>, AiApiError>({
    queryKey: agentKeys.invocation(agentId, requestId),
    queryFn: () =>
      invokeAgentApi<TInput, TOutput>({
        agentId,
        promptName,
        variables,
        requestId,
      }),
    enabled,
    retry: shouldRetry,
    // Agent calls have non-trivial cost; defer to global staleTime
    // (5min) — same input/requestId returns cached result.
  });
}
