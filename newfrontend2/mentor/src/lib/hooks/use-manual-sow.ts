"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sowApi } from "@/lib/api/sow";
import { adminSowApi } from "@/lib/api/admin-sow";
import { sowKeys } from "./use-sow-wizard";
import { toast } from "@/lib/stores/toast-store";

// ── Query keys ────────────────────────────────────────────────────────────

export const manualSowKeys = {
  all: ["manual-sow"] as const,
  list: (params?: object) => [...manualSowKeys.all, "list", params] as const,
  sow: (id: string) => [...manualSowKeys.all, id] as const,
  uploadStatus: (id: string) => [...manualSowKeys.sow(id), "upload-status"] as const,
  extractionReport: (id: string) => [...manualSowKeys.sow(id), "extraction-report"] as const,
  extractionItems: (id: string, params?: object) => [...manualSowKeys.sow(id), "extraction-items", params] as const,
  gapItems: (id: string, params?: object) => [...manualSowKeys.sow(id), "gap-items", params] as const,
  commercialDetails: (id: string) => [...manualSowKeys.sow(id), "commercial-details"] as const,
  generationStatus: (id: string) => [...manualSowKeys.sow(id), "generation-status"] as const,
  sowPreview: (id: string) => [...manualSowKeys.sow(id), "preview"] as const,
  approvalStages: (id: string) => [...manualSowKeys.sow(id), "approval-stages"] as const,
  approvalMessages: (id: string, params?: object) => [...manualSowKeys.sow(id), "approval-messages", params] as const,
  hallucinationLayers: (id: string) => [...manualSowKeys.sow(id), "hallucination-layers"] as const,
  clauses: (id: string) => [...manualSowKeys.sow(id), "clauses"] as const,
  sections: (id: string) => [...manualSowKeys.sow(id), "sections"] as const,
};

// ── List ──────────────────────────────────────────────────────────────────

export function useManualSOWList(params?: {
  status?: string;
  intake_mode?: string;
  client?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: manualSowKeys.list(params),
    queryFn: () => sowApi.listManualSOWs(params),
  });
}

/**
 * Admin variant — forces the enterprise service token so dev admins without
 * a personal glimmora access token still see enterprise-owned manual SOWs.
 */
export function useAdminManualSOWList(params?: {
  status?: string;
  intake_mode?: string;
  client?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: [...manualSowKeys.list(params), "admin"] as const,
    queryFn: () => sowApi.listManualSOWsAsAdmin(params),
  });
}

// ── Single SOW ────────────────────────────────────────────────────────────

export function useManualSOW(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: manualSowKeys.sow(sowId ?? ""),
    queryFn: () => sowApi.getManualSOW(sowId!),
    enabled: !!sowId && enabled,
  });
}

const MANUAL_TERMINAL_STATUSES = new Set([
  "review", "uploaded", "created", "complete",
  "approval", "approved", "rejected", "changes_requested",
]);

/** Polls GET /api/v1/sow/{sowId} every 3 s until a terminal status is reached. */
export function useManualSowStatusPolling(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...manualSowKeys.sow(sowId ?? ""), "status-poll"] as const,
    queryFn: () => sowApi.getManualSOW(sowId!),
    enabled: !!sowId && enabled,
    retry: false,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const raw = query.state.data as { data?: Record<string, unknown> } | undefined;
      const status = String(raw?.data?.status ?? "");
      if (status && MANUAL_TERMINAL_STATUSES.has(status)) return false;
      return 3000;
    },
  });
}

// ── Generic SOW detail (works for both AI and manual flows) ───────────────
//
// Fires both endpoints in parallel:
//   - Manual: GET /api/v1/sow/{sowId}
//   - AI:     GET /api/v1/sows/{sowId}
//
// Returns the first successful response (manual takes priority).
// Exposes `flow` so callers know which path to use for mutations.

const aiSowKeys = {
  sow: (id: string) => ["ai-sow", id] as const,
};

const adminSowKeys = {
  sow: (id: string) => ["admin-enterprise-sow", id] as const,
  pipeline: (id: string) => ["admin-approval-pipeline", id] as const,
};

function extractInner(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const inner = r.data ?? r.result ?? r.sow ?? r;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return null;
}


export function useAdminSOWDetail(sowId: string | null): {
  data: Record<string, unknown> | null;
  isLoading: boolean;
  flow: "manual" | "ai";
  refetch: () => void;
} {
  const query = useQuery({
    queryKey: adminSowKeys.sow(sowId ?? ""),
    queryFn: () => adminSowApi.getEnterpriseSOWById(sowId!),
    enabled: !!sowId,
    retry: 1,
  });

  const raw = (query.data ?? null) as unknown as Record<string, unknown> | null;
  const data = extractInner(raw) ?? raw;
  const intakeMode = String((data as Record<string, unknown> | null)?.intake_mode ?? "");
  const flow: "manual" | "ai" = intakeMode === "manual_upload" ? "manual" : "ai";

  return {
    data,
    isLoading: query.isLoading,
    flow,
    refetch: () => query.refetch(),
  };
}

export function useApprovalPipeline(sowId: string | null) {
  return useQuery({
    queryKey: adminSowKeys.pipeline(sowId ?? ""),
    queryFn: () => adminSowApi.getApprovalPipeline(sowId!),
    enabled: !!sowId,
    staleTime: 30_000,
  });
}

export function useSOWDetail(sowId: string | null): {
  data: Record<string, unknown> | null;
  isLoading: boolean;
  flow: "manual" | "ai";
  refetch: () => void;
} {
  // Try AI endpoint first; only fall back to manual if AI returns no data.
  // This prevents manual-SOW 404s from firing for AI-generated SOWs.
  const aiQuery = useQuery({
    queryKey: aiSowKeys.sow(sowId ?? ""),
    queryFn: () => sowApi.getSow(sowId!),
    enabled: !!sowId,
    retry: 1,
  });

  const aiRaw  = (aiQuery.data ?? null) as unknown as Record<string, unknown> | null;
  const aiData = ((aiRaw?.data as Record<string, unknown> | null) ?? aiRaw) as Record<string, unknown> | null;

  // Manual query fires only after AI completes with no data (manual SOW path)
  const manualEnabled = !!sowId && !aiQuery.isLoading && !aiData;

  const manualQuery = useQuery({
    queryKey: manualSowKeys.sow(sowId ?? ""),
    queryFn: () => sowApi.getManualSOW(sowId!),
    enabled: manualEnabled,
    retry: 1,
  });

  const manualRaw  = (manualQuery.data ?? null) as unknown as Record<string, unknown> | null;
  const manualData = ((manualRaw?.data as Record<string, unknown> | null) ?? manualRaw) as Record<string, unknown> | null;

  const data = aiData ?? manualData;
  const flow: "manual" | "ai" = !aiData && !!manualData ? "manual" : "ai";

  return {
    data,
    isLoading: aiQuery.isLoading || (manualEnabled && manualQuery.isLoading),
    flow,
    refetch: () => {
      aiQuery.refetch();
      manualQuery.refetch();
    },
  };
}

// ── Upload SOW ────────────────────────────────────────────────────────────

export function useUploadSOW() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      metadata,
    }: {
      file: File;
      metadata: {
        projectTitle: string;
        clientOrganisation: string;
        linkedSowId?: string | null;
      };
    }) => sowApi.uploadSOW(file, metadata),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manualSowKeys.list() });
    },
  });
}

// ── Update / Delete ───────────────────────────────────────────────────────

export function useUpdateManualSOW(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title?: string;
      tags?: string[];
      stakeholders?: string[];
      estimated_budget?: number;
    }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.updateManualSOW(sowId, data);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.sow(sowId) });
        qc.invalidateQueries({ queryKey: manualSowKeys.list() });
      }
    },
  });
}

export function useDeleteSOW() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (sowId: string) => sowApi.deleteSOW(sowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manualSowKeys.list() });
      qc.invalidateQueries({ queryKey: ["sow", "sows"] });
      toast.success("SOW deleted successfully");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete SOW";
      toast.error("Failed to delete SOW", msg);
    },
  });
}

/** @deprecated use useDeleteSOW */
export const useDeleteManualSOW = useDeleteSOW;

// ── Upload status (with polling) ──────────────────────────────────────────

export function useUploadStatus(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: manualSowKeys.uploadStatus(sowId ?? ""),
    queryFn: () => sowApi.getUploadStatus(sowId!),
    enabled: !!sowId && enabled,
    refetchInterval: (query) => {
      const raw = query.state.data as { processing_state?: string; data?: { status?: string } } | undefined;
      const state = raw?.processing_state ?? raw?.data?.status;
      if (state === "completed" || state === "complete" || state === "failed" || state === "error") return false;
      return 3000;
    },
  });
}

// ── Extraction report ─────────────────────────────────────────────────────

export function useExtractionReport(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.extractionReport(sowId ?? ""),
    queryFn: () => sowApi.getExtractionReport(sowId!),
    enabled: !!sowId,
  });
}

// ── Extraction items ──────────────────────────────────────────────────────

export function useExtractionItems(
  sowId: string | null,
  params?: { category?: string; review_state?: string },
) {
  return useQuery({
    queryKey: manualSowKeys.extractionItems(sowId ?? "", params),
    queryFn: () => sowApi.getExtractionItems(sowId!, params),
    enabled: !!sowId,
  });
}

export function useReviewExtractionItem(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      reviewState,
    }: {
      itemId: string;
      reviewState: {
        state: "accepted" | "edited" | "excluded";
        edited_value?: string;
      };
    }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.reviewExtractionItem(sowId, itemId, reviewState);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.extractionItems(sowId) });
      }
    },
  });
}

export function useAcceptAllExtractionItems(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.acceptAllExtractionItems(sowId);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.extractionItems(sowId) });
      }
    },
  });
}

// ── Gap items ─────────────────────────────────────────────────────────────

export function useGapItems(
  sowId: string | null,
  params?: { severity?: "critical" | "important" | "optional"; status?: string },
) {
  return useQuery({
    queryKey: manualSowKeys.gapItems(sowId ?? "", params),
    queryFn: () => sowApi.getGapItems(sowId!, params),
    enabled: !!sowId,
  });
}

export function useUpdateGapItem(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ gapId, data }: { gapId: string; data: Record<string, unknown> }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.updateGapItem(sowId, gapId, data);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.gapItems(sowId) });
      }
    },
  });
}

// ── Commercial details ────────────────────────────────────────────────────

export function useCommercialDetails(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.commercialDetails(sowId ?? ""),
    queryFn: () => sowApi.getCommercialDetails(sowId!),
    enabled: !!sowId,
  });
}

export function useSaveCommercialSection(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: Record<string, unknown> }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.saveCommercialSection(sowId, section, data);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.commercialDetails(sowId) });
      }
    },
  });
}

export function useValidateCommercialSection(sowId: string | null) {
  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: Record<string, unknown> }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.validateCommercialSection(sowId, section, data);
    },
  });
}

export function useMarkSectionComplete(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (section: string) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.markSectionComplete(sowId, section);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.commercialDetails(sowId) });
      }
    },
  });
}

// ── Approval authorities ──────────────────────────────────────────────────

export function useSetApprovalAuthorities(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      business_owner_approver: string;
      final_approver: string;
      legal_compliance_reviewer?: string;
      security_reviewer?: string;
      sow_submitter?: string;
    }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.setApprovalAuthorities(sowId, data);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.sow(sowId) });
      }
    },
  });
}

// ── Generate manual SOW (with polling) ───────────────────────────────────

const GENERATION_IN_PROGRESS_STATUSES = new Set([
  "pending", "processing", "in_progress",
  "assembling", "applying", "compliance", "generating", "finalizing",
  "uploading", "extracting", "extraction", "analyzing", "detecting", "scoring",
]);

export function useGenerationStatus(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: manualSowKeys.generationStatus(sowId ?? ""),
    queryFn: () => sowApi.getGenerationStatus(sowId!),
    enabled: !!sowId && enabled,
    retry: false,
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const raw = query.state.data as Record<string, unknown> | undefined;
      const nested = (raw?.data && typeof raw.data === "object") ? (raw.data as Record<string, unknown>) : null;
      const status = String(raw?.status ?? nested?.status ?? "");
      if (raw && status && !GENERATION_IN_PROGRESS_STATUSES.has(status)) return false;
      return 3000;
    },
  });
}

export function useGenerateManualSOW(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.generateManualSOW(sowId);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.generationStatus(sowId) });
      }
    },
  });
}

// ── SOW preview ───────────────────────────────────────────────────────────

export function useSOWPreview(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: manualSowKeys.sowPreview(sowId ?? ""),
    queryFn: () => sowApi.getSOWPreview(sowId!),
    enabled: !!sowId && enabled,
  });
}

// ── Confirm and submit ────────────────────────────────────────────────────

export function useConfirmAndSubmit(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { confirms_accuracy: boolean; notes?: string }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.confirmAndSubmit(sowId, data);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.sow(sowId) });
        qc.invalidateQueries({ queryKey: manualSowKeys.list() });
      }
    },
  });
}

// ── Generic submit hook (handles both AI and manual flows) ────────────────
//
// Replaces the pattern of using useSowAction (AI) + useConfirmAndSubmit (manual)
// in separate conditionals. Pass the sowId and the intake flow; the hook picks
// the correct API endpoint internally and invalidates all relevant caches.

export function useSubmitSOW(sowId: string | null, flow: "ai" | "manual") {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (opts?: { notes?: string }) => {
      if (!sowId) throw new Error("No SOW id");
      if (flow === "ai") {
        return sowApi.sowAction(sowId, { action: "submit" });
      }
      return sowApi.confirmAndSubmit(sowId, { confirms_accuracy: true, notes: opts?.notes });
    },
    onSuccess: () => {
      if (!sowId) return;
      qc.invalidateQueries({ queryKey: manualSowKeys.sow(sowId) });
      qc.invalidateQueries({ queryKey: manualSowKeys.list() });
      qc.invalidateQueries({ queryKey: manualSowKeys.approvalStages(sowId) });
      // Invalidate AI SOW list so submitted AI SOWs appear in the repository
      qc.invalidateQueries({ queryKey: sowKeys.sows() });
      qc.invalidateQueries({ queryKey: sowKeys.sow(sowId) });
    },
  });
}

// ── Approval pipeline (uses /api/v1/approvals/ endpoints) ────────────────

/** Stage key → 1-based number mapping for the approval API */
const STAGE_NUMBER: Record<string, number> = {
  commercial: 1,
  glimmora_commercial: 1,
  final: 2,
};

/** 1-based number → stage string key (used in the POST URL) */
const STAGE_KEY: Record<number, string> = {
  1: "glimmora_commercial",
  2: "final",
};

/** Query key for per-SOW approval pipeline */
export const approvalKeys = {
  pipeline: (sowId: string) => ["approval-pipeline", sowId] as const,
};

export function useApprovalStages(sowId: string | null, refetchInterval?: number) {
  return useQuery({
    queryKey: approvalKeys.pipeline(sowId ?? ""),
    queryFn: () => sowApi.getApprovalPipeline(sowId!),
    enabled: !!sowId,
    refetchInterval,
  });
}

/** Record approve/request_changes decision directly by stage number */
export function useRecordApprovalDecision(sowId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      stage,
      decision,
      comments,
      reviewer,
    }: {
      stage: number;
      decision: "approve" | "request_changes" | "reject_regenerate" | string;
      comments?: string;
      reviewer?: string;
    }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.recordApprovalDecision(sowId, stage, {
        decision,
        comments,
        reviewer_name: reviewer ?? "",
        reviewer: reviewer ?? "",
        decided_by: reviewer ?? "",
      });
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: approvalKeys.pipeline(sowId) });
        qc.invalidateQueries({ queryKey: ["admin-approval-pipeline", sowId] });
        qc.invalidateQueries({ queryKey: manualSowKeys.approvalStages(sowId) });
        qc.invalidateQueries({ queryKey: manualSowKeys.sow(sowId) });
        qc.invalidateQueries({ queryKey: manualSowKeys.list() });
        // Use exact match so we don't cascade-invalidate the admin SOW list
        // (["sow", "sows", "admin"]). That list stays intact; per-SOW pipeline
        // invalidations above are enough to update each row's displayed status.
        qc.invalidateQueries({ queryKey: ["sow", "sows"], exact: true });
      }
    },
  });
}

export function useApproveStage(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      stageKey,
      data,
    }: {
      stageKey: string;
      data: { reviewer: string; comments?: string; checklist?: Record<string, boolean> };
    }) => {
      if (!sowId) throw new Error("No SOW id");
      const stage = STAGE_NUMBER[stageKey] ?? 1;
      return sowApi.recordApprovalDecision(sowId, stage, {
        decision: "approve",
        comments: data.comments,
      });
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.approvalStages(sowId) });
        qc.invalidateQueries({ queryKey: manualSowKeys.sow(sowId) });
      }
    },
  });
}

export function useRejectStage(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      stageKey,
      data,
    }: {
      stageKey: string;
      data: { reviewer: string; reason: string; specific_feedback?: string };
    }) => {
      if (!sowId) throw new Error("No SOW id");
      const stage = STAGE_NUMBER[stageKey] ?? 1;
      return sowApi.recordApprovalDecision(sowId, stage, {
        decision: "request_changes",
        comments: data.reason,
      });
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.approvalStages(sowId) });
        qc.invalidateQueries({ queryKey: manualSowKeys.sow(sowId) });
      }
    },
  });
}

// ── Approval messages ─────────────────────────────────────────────────────

export function useApprovalMessages(
  sowId: string | null,
  params?: { stage?: string; limit?: number },
) {
  return useQuery({
    queryKey: manualSowKeys.approvalMessages(sowId ?? "", params),
    queryFn: () => sowApi.getApprovalMessages(sowId!, params),
    enabled: !!sowId,
    refetchInterval: 10000,
  });
}

export function useMarkMessageRead(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.markMessageRead(sowId, messageId);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.approvalMessages(sowId) });
      }
    },
  });
}

// ── Hallucination layers (manual SOW) ────────────────────────────────────

export function useHallucinationLayers(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.hallucinationLayers(sowId ?? ""),
    queryFn: () => sowApi.getHallucinationLayers(sowId!),
    enabled: !!sowId,
  });
}

// ── AI SOW: hallucination analysis + risk assessment ──────────────────────

const aiAnalysisKeys = {
  hallucination: (id: string) => ["ai-sow", id, "hallucination-analysis"] as const,
  riskAssessment: (id: string) => ["ai-sow", id, "risk-assessment"] as const,
};

export function useHallucinationAnalysis(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: aiAnalysisKeys.hallucination(sowId ?? ""),
    queryFn: () => sowApi.getHallucinationAnalysis(sowId!),
    enabled: !!sowId && enabled,
  });
}

export function useRiskAssessment(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: aiAnalysisKeys.riskAssessment(sowId ?? ""),
    queryFn: () => sowApi.getRiskAssessment(sowId!),
    enabled: !!sowId && enabled,
  });
}

// ── Clauses & sections ────────────────────────────────────────────────────

export function useSOWClauses(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.clauses(sowId ?? ""),
    queryFn: () => sowApi.getSOWClauses(sowId!),
    enabled: !!sowId,
  });
}

export function useSOWSections(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: manualSowKeys.sections(sowId ?? ""),
    queryFn: () => sowApi.getSOWSections(sowId!),
    enabled: !!sowId && enabled,
  });
}

// ── Export (returns Blob, not a query) ────────────────────────────────────

export function useExportSOW() {
  return useMutation({
    mutationFn: ({ sowId, format }: { sowId: string; format: "pdf" | "docx" | "json" }) =>
      sowApi.exportSOW(sowId, format),
  });
}
