"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlanChangeRecord } from "@/lib/subscription/types";

async function fetchPlanHistory(scope: "enterprise" | "admin", tenantId?: string) {
  const url =
    scope === "enterprise"
      ? "/api/enterprise/subscription/history"
      : `/api/admin/tenants/${tenantId}/subscription/history`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load plan history");
  const data = (await res.json()) as { items: PlanChangeRecord[] };
  return data.items;
}

export function useEnterprisePlanHistory() {
  return useQuery({
    queryKey: ["enterprise", "subscription", "history"],
    queryFn: () => fetchPlanHistory("enterprise"),
    staleTime: 30_000,
  });
}

export function useAdminTenantPlanHistory(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "tenant", tenantId, "subscription", "history"],
    queryFn: () => fetchPlanHistory("admin", tenantId),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  });
}
