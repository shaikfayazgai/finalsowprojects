"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { authApi } from "@/lib/api/auth";

export const authKeys = {
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

function updateSessionsCache(
  old: unknown,
  updater: (sessions: Array<{ id: string; is_current?: boolean }>) => Array<{ id: string; is_current?: boolean }>,
) {
  if (Array.isArray(old)) return updater(old as Array<{ id: string; is_current?: boolean }>);
  if (old && typeof old === "object") {
    const obj = old as Record<string, unknown>;
    if (Array.isArray(obj.sessions)) return { ...obj, sessions: updater(obj.sessions as Array<{ id: string; is_current?: boolean }>) };
    if (Array.isArray(obj.data)) return { ...obj, data: updater(obj.data as Array<{ id: string; is_current?: boolean }>) };
    if (Array.isArray(obj.items)) return { ...obj, items: updater(obj.items as Array<{ id: string; is_current?: boolean }>) };
  }
  return old;
}

export function useCurrentUser() {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken as string | undefined;

  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authApi.getCurrentUser(accessToken!),
    enabled: !!accessToken,
  });
}

export function useSessions() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string })?.accessToken;

  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: () => authApi.getSessions(accessToken!),
    enabled: !!accessToken,
  });
}

export function useRevokeSession() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string })?.accessToken;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId, accessToken!),
    onSuccess: (_data, sessionId) => {
      // Optimistically remove the session from the cache immediately
      qc.setQueryData(authKeys.sessions, (old: unknown) =>
        updateSessionsCache(old, (sessions) => sessions.filter((s) => s.id !== sessionId)),
      );
    },
  });
}

export function useRevokeAllSessions() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string })?.accessToken;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logoutAllSessions(accessToken!),
    onSuccess: () => {
      // Keep only current session in cache
      qc.setQueryData(authKeys.sessions, (old: unknown) =>
        updateSessionsCache(old, (sessions) => sessions.filter((s) => s.is_current)),
      );
    },
  });
}
