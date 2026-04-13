"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { authApi } from "@/lib/api/auth";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useCurrentUser() {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken as string | undefined;

  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authApi.getCurrentUser(accessToken!),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
