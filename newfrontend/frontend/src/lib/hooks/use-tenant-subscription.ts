"use client";

import { useQuery } from "@tanstack/react-query";
import type { TenantSubscriptionSnapshot } from "@/lib/subscription/types";

async function fetchSubscription(): Promise<TenantSubscriptionSnapshot | null> {
  const res = await fetch("/api/enterprise/subscription", { credentials: "include" });
  // 404/204 (or a 200 null body) mean "no subscription on record" — not an error.
  if (res.status === 404 || res.status === 204) return null;
  if (!res.ok) {
    throw new Error("Failed to load subscription");
  }
  return (await res.json()) as TenantSubscriptionSnapshot | null;
}

export function useTenantSubscription(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["enterprise", "subscription"],
    queryFn: fetchSubscription,
    staleTime: 60_000,
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}
