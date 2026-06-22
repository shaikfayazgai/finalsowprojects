"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  fetchContributorTrack,
  type ContributorTrackStatus,
} from "@/lib/api/contributor-track";

export const contributorTrackKeys = {
  all: ["contributor", "track"] as const,
};

export function useContributorTrack() {
  const { status } = useSession();
  return useQuery({
    queryKey: contributorTrackKeys.all,
    queryFn: fetchContributorTrack,
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}

export function useInvalidateContributorTrack() {
  const qc = useQueryClient();
  return () =>
    void qc.invalidateQueries({ queryKey: contributorTrackKeys.all });
}

export function trackLoading(
  sessionStatus: string,
  query: ReturnType<typeof useContributorTrack>,
): boolean {
  return sessionStatus === "loading" || (sessionStatus === "authenticated" && query.isLoading);
}

export type { ContributorTrackStatus };
