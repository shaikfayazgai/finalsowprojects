"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  fetchContributorAccountAuth,
  type ContributorAccountAuth,
} from "@/lib/api/contributor-account-auth";

export const accountAuthKeys = {
  all: ["contributor", "account-auth"] as const,
};

export function useAccountAuth() {
  const { status } = useSession();
  return useQuery({
    queryKey: accountAuthKeys.all,
    queryFn: fetchContributorAccountAuth,
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}

export function useInvalidateAccountAuth() {
  const qc = useQueryClient();
  return () =>
    void qc.invalidateQueries({ queryKey: accountAuthKeys.all });
}

export type { ContributorAccountAuth };
