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
  deletePlan,
  getPlan,
  listPlans,
  repricePlan,
  sendBackPlan,
  submitPlan,
  updatePlan,
  type ListPlansParams,
  type TaskPricing,
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

export function usePlanList(
  params: ListPlansParams = {},
  options?: { staleTime?: number; refetchOnMount?: boolean | "always"; refetchOnWindowFocus?: boolean },
) {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => listPlans(params),
    ...options,
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

/** Super admin prices tasks + approves. Pass the per-task pricing array. */
export function useApprovePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pricing?: TaskPricing[]) => approvePlan(planId, pricing ?? []),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(planId), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

/** Super admin edits per-task pay on an already-priced plan (status unchanged). */
export function useRepricePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pricing: TaskPricing[]) => repricePlan(planId, pricing),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(planId), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

/** Enterprise submits a draft plan to Glimmora for pricing + approval. */
export function useSubmitPlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitPlan(planId),
    onSuccess: (plan: PlanDetail) => {
      qc.setQueryData(planKeys.detail(planId), plan);
      qc.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

/** Super admin sends a submitted plan back to the enterprise with feedback. */
export function useSendBackPlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comment?: string) => sendBackPlan(planId, comment),
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
export function useDeletePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deletePlan(planId),
    onSuccess: () => {
      qc.removeQueries({ queryKey: planKeys.detail(planId) });
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
