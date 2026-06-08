/**
 * SOW v2 TanStack Query hooks — drive the new /api/sow surfaces.
 *
 * Query keys are tuple-shaped so cache invalidation can target a
 * single SOW (`["sow", sowId]`) or the whole list (`["sow", "list"]`).
 * Mutation hooks invalidate the right keys and patch the cache in
 * place where useful (detail mutations return the new SowDetail).
 */

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  acceptSow,
  approveSow,
  archiveSow,
  createSow,
  declineSow,
  getSow,
  listSows,
  listAllSowsAdmin,
  rejectSow,
  sendBackSow,
  submitSow,
  updateSowDraft,
  withdrawSow,
  type ListSowsParams,
  type TransitionEnvelope,
} from "@/lib/api/sow-v2";
import type {
  CreateSowInput,
  SowDetail,
  SowStage,
  UpdateSowDraftInput,
} from "@/lib/sow/types";

const sowKeys = {
  all: ["sow"] as const,
  list: (params: ListSowsParams) => ["sow", "list", params] as const,
  adminList: (params: ListSowsParams) => ["sow", "admin-list", params] as const,
  detail: (sowId: string) => ["sow", "detail", sowId] as const,
};

/* ────────────────────────────── Queries ─────────────────────────── */

export function useSowList(params: ListSowsParams = {}) {
  return useQuery({
    queryKey: sowKeys.list(params),
    queryFn: () => listSows(params),
  });
}

/**
 * Admin-scoped list — ALL SOWs across every owner. Used by the Super Admin
 * Commercial gate so it sees SOWs raised by any enterprise tenant.
 */
export function useAdminSowList(params: ListSowsParams = {}) {
  return useQuery({
    queryKey: sowKeys.adminList(params),
    queryFn: () => listAllSowsAdmin(params),
  });
}

export function useSow(sowId: string | undefined) {
  return useQuery({
    queryKey: sowId ? sowKeys.detail(sowId) : ["sow", "detail", "—"],
    queryFn: () => {
      if (!sowId) throw new Error("sowId required");
      return getSow(sowId);
    },
    enabled: !!sowId,
  });
}

/* ───────────────────────────── Mutations ────────────────────────── */

function useSowMutation<TArgs, TReturn extends { id?: string }>(
  fn: (args: TArgs) => Promise<TReturn>,
  options: {
    onSuccessKey?: (result: TReturn, args: TArgs) => readonly unknown[];
  } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result, args) => {
      qc.invalidateQueries({ queryKey: sowKeys.all });
      if (options.onSuccessKey) {
        const key = options.onSuccessKey(result, args);
        qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useCreateSow() {
  return useSowMutation((input: CreateSowInput) => createSow(input));
}

export function useUpdateSowDraft(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSowDraftInput) => updateSowDraft(sowId, input),
    onSuccess: (updated: SowDetail) => {
      qc.setQueryData(sowKeys.detail(sowId), updated);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

export function useSubmitSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => submitSow(sowId),
    onSuccess: (updated: SowDetail) => {
      qc.setQueryData(sowKeys.detail(sowId), updated);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

/** Glimmora operator acceptance (Admin portal). */
export function useAcceptSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comment?: string) => acceptSow(sowId, comment),
    onSuccess: (updated: SowDetail) => {
      qc.setQueryData(sowKeys.detail(sowId), updated);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

export function useDeclineSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => declineSow(sowId, comment),
    onSuccess: (updated: SowDetail) => {
      qc.setQueryData(sowKeys.detail(sowId), updated);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

export function useWithdrawSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => withdrawSow(sowId, reason),
    onSuccess: (updated: SowDetail) => {
      qc.setQueryData(sowKeys.detail(sowId), updated);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

export function useArchiveSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => archiveSow(sowId),
    onSuccess: (updated: SowDetail) => {
      qc.setQueryData(sowKeys.detail(sowId), updated);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

export function useApproveSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stage, comment }: { stage: SowStage; comment?: string }) =>
      approveSow(sowId, stage, comment),
    onSuccess: (envelope: TransitionEnvelope) => {
      qc.setQueryData(sowKeys.detail(sowId), envelope.sow);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

export function useRejectSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stage, comment }: { stage: SowStage; comment: string }) =>
      rejectSow(sowId, stage, comment),
    onSuccess: (envelope: TransitionEnvelope) => {
      qc.setQueryData(sowKeys.detail(sowId), envelope.sow);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}

export function useSendBackSow(sowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      fromStage,
      toStage,
      comment,
    }: {
      fromStage: SowStage;
      toStage: SowStage;
      comment: string;
    }) => sendBackSow(sowId, fromStage, toStage, comment),
    onSuccess: (envelope: TransitionEnvelope) => {
      qc.setQueryData(sowKeys.detail(sowId), envelope.sow);
      qc.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
}
