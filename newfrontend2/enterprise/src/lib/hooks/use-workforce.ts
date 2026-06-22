"use client";

import { useQuery } from "@tanstack/react-query";
import { listWorkforce, type ListWorkforceResult } from "@/lib/api/workforce";

/**
 * Workforce directory (people roster). The direct task-assign + match-candidate
 * hooks were retired — task assignment goes through the marketplace flow
 * (publish → interest → enterprise selects one), the single locked path.
 */
export function useWorkforceDirectory(params: {
  search?: string;
  department?: string;
  enabled?: boolean;
}) {
  return useQuery<ListWorkforceResult>({
    queryKey: ["enterprise", "workforce", params.search ?? "", params.department ?? ""],
    queryFn: () =>
      listWorkforce({
        search: params.search,
        department: params.department,
        limit: 100,
      }),
    enabled: params.enabled !== false,
  });
}
