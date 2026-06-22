"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sowApi } from "@/lib/api/sow";
import { adminSowApi } from "@/lib/api/admin-sow";
import { transformStepPayload, toStep9 } from "@/lib/api/sow-transformers";
import { toast } from "@/lib/stores/toast-store";

// ── Query keys ────────────────────────────────────────────────────────────

export const sowKeys = {
  all: ["sow"] as const,
  wizards: () => [...sowKeys.all, "wizards"] as const,
  wizard: (id: string) => [...sowKeys.all, "wizard", id] as const,
  reviewSummary: (id: string) => [...sowKeys.all, "review", id] as const,
  sows: () => [...sowKeys.all, "sows"] as const,
  sow: (id: string) => [...sowKeys.all, "sow", id] as const,
  hallucinationAnalysis: (id: string) => [...sowKeys.all, "sow", id, "hallucination"] as const,
  riskAssessment: (id: string) => [...sowKeys.all, "sow", id, "risk"] as const,
};

// ── Create wizard ─────────────────────────────────────────────────────────

export function useCreateWizard() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (enterpriseId: string) => sowApi.createWizard(enterpriseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sowKeys.wizards() });
    },
  });
}

// ── Get wizard state ──────────────────────────────────────────────────────

export function useWizard(wizardId: string | null) {
  return useQuery({
    queryKey: sowKeys.wizard(wizardId ?? ""),
    queryFn: () => sowApi.getWizard(wizardId!),
    enabled: !!wizardId,
  });
}

// ── Save a step ───────────────────────────────────────────────────────────

export function useSaveStep(wizardId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      step,
      formData,
    }: {
      step: number;
      formData: Record<string, unknown>;
    }) => {
      if (!wizardId) throw new Error("No wizard session");
      const payload = transformStepPayload(step, formData);
      return sowApi.saveStep(wizardId, step, payload);
    },
    onSuccess: () => {
      if (wizardId) {
        qc.invalidateQueries({ queryKey: sowKeys.wizard(wizardId) });
      }
    },
  });
}

// ── Skip a step ───────────────────────────────────────────────────────────

export function useSkipStep(wizardId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (step: number) => {
      if (!wizardId) throw new Error("No wizard session");
      return sowApi.skipStep(wizardId, step);
    },
    onSuccess: () => {
      if (wizardId) {
        qc.invalidateQueries({ queryKey: sowKeys.wizard(wizardId) });
      }
    },
  });
}

// ── Get step 9 review summary ─────────────────────────────────────────────

export function useReviewSummary(wizardId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: sowKeys.reviewSummary(wizardId ?? ""),
    queryFn: () => sowApi.getReviewSummary(wizardId!),
    enabled: !!wizardId && enabled,
  });
}

// ── Generate SOW ──────────────────────────────────────────────────────────

export function useGenerateSOW(wizardId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (formData: Record<string, unknown>) => {
      if (!wizardId) throw new Error("No wizard session");
      const payload = toStep9(formData);
      return sowApi.generate(wizardId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sowKeys.sows() });
    },
  });
}

// ── SOW CRUD ──────────────────────────────────────────────────────────────

export function useSowList() {
  return useQuery({
    queryKey: sowKeys.sows(),
    queryFn: () => sowApi.listSows(),
  });
}

/**
 * Admin variant — forces the enterprise service token so dev admins without
 * a personal glimmora access token still see enterprise-owned SOWs.
 */
export function useAdminSowList() {
  return useQuery({
    queryKey: [...sowKeys.sows(), "admin"] as const,
    queryFn: () => adminSowApi.listEnterpriseSOWs(),
  });
}

export function useSow(sowId: string | null) {
  return useQuery({
    queryKey: sowKeys.sow(sowId ?? ""),
    queryFn: () => sowApi.getSow(sowId!),
    enabled: !!sowId,
  });
}

const AI_TERMINAL_STATUSES = new Set([
  "review", "generated", "draft", "complete",
  "approval", "approved", "rejected", "changes_requested",
]);

/** Polls GET /api/v1/sows/{sowId} every 3 s until a terminal status is reached. */
export function useAiSowStatusPolling(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...sowKeys.sow(sowId ?? ""), "status-poll"] as const,
    queryFn: () => sowApi.getSow(sowId!),
    enabled: !!sowId && enabled,
    retry: false,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const raw = query.state.data as { data?: Record<string, unknown> } | undefined;
      const status = String(raw?.data?.status ?? "");
      if (status && AI_TERMINAL_STATUSES.has(status)) return false;
      return 3000;
    },
  });
}

// ── Delete AI SOW (reject_regenerate action) ──────────────────────────────

export function useDeleteAiSOW() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ sowId, changeNotes }: { sowId: string; changeNotes?: string | null }) =>
      sowApi.sowAction(sowId, { action: "reject_regenerate", change_notes: changeNotes ?? null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sowKeys.sows() });
      qc.invalidateQueries({ queryKey: sowKeys.all });
      toast.success("SOW deleted successfully");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete SOW";
      toast.error("Failed to delete SOW", msg);
    },
  });
}

// ── Hallucination Analysis ────────────────────────────────────────────────

export function useHallucinationAnalysis(sowId: string | null) {
  return useQuery({
    queryKey: sowKeys.hallucinationAnalysis(sowId ?? ""),
    queryFn: () => sowApi.getHallucinationAnalysis(sowId!),
    enabled: !!sowId,
  });
}

// ── Risk Assessment ───────────────────────────────────────────────────────

export function useRiskAssessment(sowId: string | null) {
  return useQuery({
    queryKey: sowKeys.riskAssessment(sowId ?? ""),
    queryFn: () => sowApi.getRiskAssessment(sowId!),
    enabled: !!sowId,
  });
}

// ── SOW Action ────────────────────────────────────────────────────────────

export function useSowAction(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      action: "submit" | "request_changes" | "reject_regenerate";
      change_notes?: string;
    }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.sowAction(sowId, payload);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: sowKeys.sow(sowId) });
      }
    },
  });
}
