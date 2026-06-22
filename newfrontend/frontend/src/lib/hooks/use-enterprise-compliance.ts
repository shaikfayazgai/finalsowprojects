"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchComplianceOverview } from "@/lib/api/enterprise-compliance";

export function useComplianceOverview() {
  return useQuery({
    queryKey: ["enterprise", "compliance", "overview"],
    queryFn: fetchComplianceOverview,
    staleTime: 60_000,
  });
}
