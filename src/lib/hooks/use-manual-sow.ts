"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sowApi } from "@/lib/api/sow";

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

// ── Single SOW ────────────────────────────────────────────────────────────

export function useManualSOW(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.sow(sowId ?? ""),
    queryFn: () => sowApi.getManualSOW(sowId!),
    enabled: !!sowId,
  });
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
      metadata?: {
        title?: string;
        client?: string;
        tags?: string[];
        estimated_budget?: number;
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

export function useDeleteManualSOW() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (sowId: string) => sowApi.deleteManualSOW(sowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: manualSowKeys.list() });
    },
  });
}

// ── Upload status (with polling) ──────────────────────────────────────────

export function useUploadStatus(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: manualSowKeys.uploadStatus(sowId ?? ""),
    queryFn: () => sowApi.getUploadStatus(sowId!),
    enabled: !!sowId && enabled,
    refetchInterval: (query) => {
      const status = (query.state.data as { data?: { status?: string } } | undefined)?.data?.status;
      // Stop polling once processing is complete or failed
      if (status === "completed" || status === "failed" || status === "error") return false;
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
    mutationFn: (section: string) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.validateCommercialSection(sowId, section);
    },
  });
}

export function useMarkSectionsComplete(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (sections: string[]) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.markSectionsComplete(sowId, sections);
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
      business_owner_approver_id: string;
      final_approver_id: string;
      legal_compliance_reviewer_id?: string;
      security_reviewer_id?: string;
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

export function useGenerationStatus(sowId: string | null, enabled = true) {
  return useQuery({
    queryKey: manualSowKeys.generationStatus(sowId ?? ""),
    queryFn: () => sowApi.getGenerationStatus(sowId!),
    enabled: !!sowId && enabled,
    refetchInterval: (query) => {
      const status = (query.state.data as { data?: { status?: string } } | undefined)?.data?.status;
      if (status === "completed" || status === "failed" || status === "error") return false;
      return 4000;
    },
  });
}

export function useGenerateManualSOW(sowId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (opts?: { include_extracted_sections?: boolean }) => {
      if (!sowId) throw new Error("No SOW id");
      return sowApi.generateManualSOW(sowId, opts);
    },
    onSuccess: () => {
      if (sowId) {
        qc.invalidateQueries({ queryKey: manualSowKeys.generationStatus(sowId) });
      }
    },
  });
}

// ── SOW preview ───────────────────────────────────────────────────────────

export function useSOWPreview(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.sowPreview(sowId ?? ""),
    queryFn: () => sowApi.getSOWPreview(sowId!),
    enabled: !!sowId,
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

// ── Approval stages ───────────────────────────────────────────────────────

export function useApprovalStages(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.approvalStages(sowId ?? ""),
    queryFn: () => sowApi.getApprovalStages(sowId!),
    enabled: !!sowId,
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
      return sowApi.approveStage(sowId, stageKey, data);
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
      return sowApi.rejectStage(sowId, stageKey, data);
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

// ── Hallucination layers ──────────────────────────────────────────────────

export function useHallucinationLayers(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.hallucinationLayers(sowId ?? ""),
    queryFn: () => sowApi.getHallucinationLayers(sowId!),
    enabled: !!sowId,
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

export function useSOWSections(sowId: string | null) {
  return useQuery({
    queryKey: manualSowKeys.sections(sowId ?? ""),
    queryFn: () => sowApi.getSOWSections(sowId!),
    enabled: !!sowId,
  });
}

// ── Export (returns Blob, not a query) ────────────────────────────────────

export function useExportSOW() {
  return useMutation({
    mutationFn: ({ sowId, format }: { sowId: string; format: "pdf" | "docx" | "json" }) =>
      sowApi.exportSOW(sowId, format),
  });
}
