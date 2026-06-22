"use client";

import { useQuery } from "@tanstack/react-query";
import type { TenantSubscriptionSnapshot } from "@/lib/subscription/types";

async function fetchSubscription(): Promise<TenantSubscriptionSnapshot> {
  const res = await fetch("/api/enterprise/subscription", { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to load subscription");
  }
  return res.json() as Promise<TenantSubscriptionSnapshot>;
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
