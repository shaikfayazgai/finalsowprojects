"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { authApi } from "@/lib/api/auth";

export const authKeys = {
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

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
      qc.setQueryData(authKeys.sessions, (old: Awaited<ReturnType<typeof authApi.getSessions>> | undefined) =>
        old ? old.filter((s) => s.id !== sessionId) : old,
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
      qc.setQueryData(authKeys.sessions, (old: Awaited<ReturnType<typeof authApi.getSessions>> | undefined) =>
        old ? old.filter((s) => s.is_current) : old,
      );
    },
  });
}
