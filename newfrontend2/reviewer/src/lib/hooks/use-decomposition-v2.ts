"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  activatePlan,
  approvePlan,
  archivePlan,
  copyPlan,
  createPlan,
  getPlan,
  listPlans,
  updatePlan,
  type ListPlansParams,
} from "@/lib/api/decomposition-v2";
import type {
  CreatePlanInput,
  PlanDetail,
  UpdatePlanInput,
} from "@/lib/decomposition/types";

const planKeys = {
  all: ["decomposition", "plan"] as const,
  list: (params: ListPlansParams) =>
    ["decomposition", "plan", "list", params] as const,
  detail: (planId: string) =>
    ["decomposition", "plan", "detail", planId] as const,
};

export function usePlanList(params: ListPlansParams = {}) {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => listPlans(params),
  });
}

export function usePlan(planId: string | undefined) {
  return useQuery({
    queryKey: planId ? planKeys.detail(planId) : ["decomposition", "plan", "detail", "—"],
    queryFn: () => {
      if (!planId) throw new Error("planId required");
      return getPlan(planId);
    },
    enabled: !!planId,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => createPlan(input),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(plan.id), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useUpdatePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlanInput) => updatePlan(planId, input),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(planId), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useApprovePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => approvePlan(planId),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(planId), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}
export function useActivatePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => activatePlan(planId),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(planId), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}
export function useArchivePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => archivePlan(planId),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(planId), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}
export function useCopyPlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => copyPlan(planId),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(plan.id), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}
