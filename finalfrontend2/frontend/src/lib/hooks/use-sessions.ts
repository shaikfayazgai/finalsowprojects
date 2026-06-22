/**
 * TanStack Query hooks for the Postgres-backed sessions API.
 *
 * Distinct from `useSessions` in `use-auth.ts` (legacy Glimmora-backend
 * hook). Prefix our hooks with "My" to avoid import-site confusion.
 */

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchMySessions,
  revokeMySession,
  type RevokeSessionResponse,
  type SessionListItem,
  type SessionListResponse,
  SessionsApiError,
} from "@/lib/api/sessions";

export const sessionsKeys = {
  all: ["sessions"] as const,
  list: () => [...sessionsKeys.all, "list"] as const,
};

/**
 * Don't retry auth failures (401) — refetching will keep failing. Retry
 * one time on transient errors so a flaky network doesn't break the UI.
 */
function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof SessionsApiError) {
    if (error.status === 401 || error.status === 404) return false;
  }
  return failureCount < 1;
}

export function useMySessions() {
  return useQuery<SessionListResponse, SessionsApiError>({
    queryKey: sessionsKeys.list(),
    queryFn: fetchMySessions,
    retry: shouldRetry,
  });
}

export function useRevokeMySession() {
  const queryClient = useQueryClient();
  return useMutation<RevokeSessionResponse, SessionsApiError, string>({
    mutationFn: (sessionId) => revokeMySession(sessionId),

    // Optimistic UI: mark the targeted session as revoked locally so
    // the row updates immediately. If the request fails, roll back.
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: sessionsKeys.list() });
      const previous = queryClient.getQueryData<SessionListResponse>(
        sessionsKeys.list(),
      );
      if (previous) {
        queryClient.setQueryData<SessionListResponse>(
          sessionsKeys.list(),
          {
            sessions: previous.sessions.map((s): SessionListItem =>
              s.id === sessionId
                ? {
                    ...s,
                    revokedAt: new Date().toISOString(),
                    revokedReason: "user_logout",
                  }
                : s,
            ),
          },
        );
      }
      return { previous };
    },
    onError: (_err, _sessionId, context) => {
      const previous = (context as { previous?: SessionListResponse })
        ?.previous;
      if (previous) {
        queryClient.setQueryData(sessionsKeys.list(), previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: sessionsKeys.list() });
    },
  });
}
