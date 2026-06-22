"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRetentionRules,
  updateRetentionRules,
} from "@/lib/api/enterprise-retention";
import type { RetentionRuleSet } from "@/lib/retention";

const KEY = ["enterprise", "compliance", "retention"] as const;

export function useRetentionRules() {
  return useQuery({
    queryKey: KEY,
    queryFn: fetchRetentionRules,
    staleTime: 60_000,
  });
}

export function useUpdateRetentionRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: RetentionRuleSet) => updateRetentionRules(rules),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      // The overview surface reads retention too — invalidate it.
      qc.invalidateQueries({ queryKey: ["enterprise", "compliance", "overview"] });
    },
  });
}
