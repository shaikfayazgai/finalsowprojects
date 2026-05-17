/**
 * SOW API client — calls Glimmora API directly from the browser.
 *
 * Token is acquired from /api/sow/token (server-side) and cached.
 * All subsequent calls go directly to the Glimmora API, so the
 * network tab shows the real endpoint paths.
 */

import { ApiError } from "./client";

// ── Response types ────────────────────────────────────────────────────────

export interface StepSaveResponse {
  wizard_id: string;
  step: number;
  confidence_score: number;
  confidence_breakdown: Record<string, number>;
  hallucination_layers_active: number;
  steps_completed: number[];
  steps_skipped: number[];
  validation_errors: string[];
  warnings: string[];
}

export interface SkipStepResponse {
  wizard_id: string;
  step: number;
  skipped: boolean;
  confidence_penalty: number;
  new_confidence_score: number;
  message: string;
}

export interface WizardCreateResponse {
  wizard_id: string;
  message: string;
}

export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string | null;
  data: T | null;
}

export interface SOWActionRequest {
  action: "submit" | "request_changes" | "reject_regenerate";
  change_notes?: string | null;
}

export interface ApprovalDecision {
  decision: string;
  comments?: string | null;
  /** Reviewer identity — sent as reviewer_name, reviewer, and decided_by for backend compatibility. */
  reviewer_name?: string;
  reviewer?: string;
  decided_by?: string;
}

// ── Token cache ───────────────────────────────────────────────────────────

let _cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;

  const res = await fetch("/api/sow/token");
  if (!res.ok) {
    throw new ApiError(res.status, "Failed to acquire API token");
  }
  const data = await res.json();
  _cachedToken = data.token;

  // Auto-expire after 50 minutes
  setTimeout(() => { _cachedToken = null; }, 50 * 60 * 1000);

  return data.token;
}


// ── Base URL ──────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_GLIMMORA_API_URL || "";

// ── Direct API call helper ────────────────────────────────────────────────

async function sowCall<T>(
  path: string,
  method: string = "GET",
  payload?: unknown,
  _retry = false,
  _asEnterprise = false,
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    _cachedToken = null;
    throw new ApiError(res.status, "Session expired. Please refresh the page.");
  }

  if (!res.ok) {
    if (data?.errors && Array.isArray(data.errors)) {
      const fieldErrors = data.errors
        .map((e: { field?: string; message?: string }) => {
          const field = e.field?.split(" → ").pop() ?? e.field ?? "";
          return `${field}: ${e.message}`;
        })
        .join("; ");
      throw new ApiError(res.status, fieldErrors || data.message || "Validation failed");
    }

    const msg = data?.detail?.message ?? data?.detail ?? data?.error ?? data?.message ?? `API error ${res.status}`;
    throw new ApiError(res.status, typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as T;
}

// ── SOW Wizard API ────────────────────────────────────────────────────────

export const sowApi = {
  listWizards(): Promise<BaseResponse> {
    return sowCall<BaseResponse>("/api/v1/wizards");
  },

  createWizard(enterpriseId: string): Promise<WizardCreateResponse> {
    return sowCall<WizardCreateResponse>("/api/v1/wizards", "POST", {
      enterprise_id: enterpriseId,
    });
  },

  getWizard(wizardId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/wizards/${wizardId}`);
  },

  saveStep(wizardId: string, step: number, payload: unknown): Promise<StepSaveResponse> {
    return sowCall<StepSaveResponse>(
      `/api/v1/wizards/${wizardId}/steps/${step}`,
      "PUT",
      payload,
    );
  },

  skipStep(wizardId: string, step: number): Promise<SkipStepResponse> {
    return sowCall<SkipStepResponse>(
      `/api/v1/wizards/${wizardId}/steps/${step}/skip`,
      "POST",
    );
  },

  getReviewSummary(wizardId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/wizards/${wizardId}/steps/9/summary`);
  },

  generate(
    wizardId: string,
    payload: {
      business_owner_approver_id: string;
      final_approver_id: string;
      legal_compliance_reviewer_id?: string | null;
      security_reviewer_id?: string | null;
    },
  ): Promise<BaseResponse> {
    return sowCall<BaseResponse>(
      `/api/v1/wizards/${wizardId}/generate`,
      "POST",
      payload,
    );
  },

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    adminTitle?: string;
    adminDept?: string;
  }): Promise<BaseResponse> {
    return sowCall<BaseResponse>("/api/v1/users/me/profile", "PUT", data);
  },

  uploadProfilePicture(file: File): Promise<BaseResponse> {
    return getToken().then(token => {
      const formData = new FormData();
      formData.append("file", file);
      return fetch(`${BASE_URL}/api/v1/users/me/profile-picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new ApiError(res.status, data?.message ?? "Upload failed");
        return data as BaseResponse;
      });
    });
  },
  // ── AI Draft Review ──

  listSows(): Promise<BaseResponse> {
    return sowCall<BaseResponse>("/api/v1/sows");
  },

  /**
   * Admin variant — uses the logged-in admin/super_admin's personal Glimmora
   * access token (from their session) so the backend returns all SOWs visible
   * to that role.
   */
  listSowsAsAdmin(): Promise<BaseResponse> {
    return sowCall<BaseResponse>("/api/v1/sows/enterprise/all");
  },

  getSow(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}`);
  },

  getEnterpriseSOWById(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/enterprise/${sowId}`);
  },

  sowAction(sowId: string, payload: SOWActionRequest): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}/action`, "POST", payload);
  },

  getHallucinationAnalysis(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}/hallucination-analysis`, "GET", undefined, false, true);
  },

  getRiskAssessment(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}/risk-assessment`, "GET", undefined, false, true);
  },

  // ── Approval Pipeline ──

  getApprovalPipeline(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/approvals/${sowId}`);
  },

  recordApprovalDecision(sowId: string, stage: number, payload: ApprovalDecision): Promise<BaseResponse> {
    return sowCall<BaseResponse>(
      `/api/v1/approvals/${sowId}/stage/${stage}/decide`,
      "POST",
      payload,
      false,
      false, // use personal token so backend identifies the logged-in user as reviewer
    );
  },

  searchUsers(query: string, organisation?: string): Promise<BaseResponse> {
    const params = new URLSearchParams({ q: query });
    if (organisation) params.set("organisation", organisation);
    return sowCall<BaseResponse>(`/api/v1/users/search?${params.toString()}`);
  },

  // ── Manual SOW ────────────────────────────────────────────────────────────

  listManualSOWs(params?: {
    status?: string;
    intake_mode?: string;
    client?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
  }): Promise<BaseResponse> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}` : "";
    return sowCall<BaseResponse>(`/api/v1/sow${qs}`);
  },

  /**
   * Admin variant — uses the logged-in admin/super_admin's personal Glimmora
   * access token (from their session) so the backend returns all manual SOWs
   * visible to that role.
   */
  listManualSOWsAsAdmin(params?: {
    status?: string;
    intake_mode?: string;
    client?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
  }): Promise<BaseResponse> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}` : "";
    return sowCall<BaseResponse>(`/api/v1/sow${qs}`);
  },

  uploadSOW(file: File, metadata: {
    projectTitle: string;
    clientOrganisation: string;
    linkedSowId?: string | null;
  }): Promise<BaseResponse> {
    return getToken().then(token => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectTitle", metadata.projectTitle);
      formData.append("clientOrganisation", metadata.clientOrganisation);
      if (metadata.linkedSowId) formData.append("linkedSowId", metadata.linkedSowId);

      return fetch(`${BASE_URL}/api/v1/sow/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) { _cachedToken = null; }
          const msg = data?.detail?.message ?? data?.detail ?? data?.message ?? `Upload error ${res.status}`;
          throw new ApiError(res.status, typeof msg === "string" ? msg : JSON.stringify(msg));
        }
        return data as BaseResponse;
      });
    });
  },

  getManualSOW(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}`);
  },

  updateManualSOW(sowId: string, data: {
    title?: string;
    tags?: string[];
    stakeholders?: string[];
    estimated_budget?: number;
  }): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}`, "PATCH", data);
  },

  deleteSOW(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}`, "DELETE", undefined, false, true);
  },

  getUploadStatus(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/upload-status`);
  },

  getExtractionReport(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/extraction-report`);
  },

  getExtractionItems(sowId: string, params?: {
    category?: string;
    review_state?: string;
  }): Promise<BaseResponse> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString()}` : "";
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/extraction-items${qs}`);
  },

  reviewExtractionItem(sowId: string, itemId: string, reviewState: {
    state: "accepted" | "edited" | "excluded";
    edited_value?: string;
  }): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/extraction-items/${itemId}/review-state`, "PATCH", reviewState);
  },

  acceptAllExtractionItems(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/extraction-items/accept-all`, "POST");
  },

  getGapItems(sowId: string, params?: {
    severity?: "critical" | "important" | "optional";
    status?: string;
  }): Promise<BaseResponse> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString()}` : "";
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/gap-items${qs}`);
  },

  updateGapItem(sowId: string, gapId: string, data: Record<string, unknown>): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/gap-items/${gapId}`, "PATCH", data);
  },

  getCommercialDetails(sowId: string, regenerate = false): Promise<BaseResponse> {
    const qs = regenerate ? `?regenerateAiTechStack=true` : "";
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/commercial-details${qs}`);
  },

  saveCommercialSection(sowId: string, section: string, data: Record<string, unknown>): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/commercial-details/${section}`, "PATCH", data);
  },

  validateCommercialSection(sowId: string, section: string, data: Record<string, unknown>): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/commercial-details/${section}/validate`, "POST", data);
  },

  markSectionComplete(sowId: string, section: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/commercial-details/sections/mark-complete`, "POST", { section });
  },

  setApprovalAuthorities(sowId: string, data: {
    business_owner_approver: string;
    final_approver: string;
    legal_compliance_reviewer?: string;
    security_reviewer?: string;
    sow_submitter?: string;
  }): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/approval-authorities`, "PATCH", data);
  },

  generateManualSOW(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/generate`, "POST", {});
  },

  getGenerationStatus(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/generation-status`);
  },

  getSOWPreview(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/preview`);
  },

  confirmAndSubmit(sowId: string, data: {
    confirms_accuracy: boolean;
    notes?: string;
  }): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/confirm-and-submit`, "POST", data);
  },

  getApprovalStages(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/approval-stages`);
  },

  approveStage(sowId: string, stageKey: string, data: {
    reviewer: string;
    comments?: string;
    checklist?: Record<string, boolean>;
  }): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/approval-stage/${stageKey}/approve`, "POST", data);
  },

  rejectStage(sowId: string, stageKey: string, data: {
    reviewer: string;
    reason: string;
    specific_feedback?: string;
  }): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/approval-stage/${stageKey}/reject`, "POST", data);
  },

  getApprovalMessages(sowId: string, params?: {
    stage?: string;
    limit?: number;
  }): Promise<BaseResponse> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}` : "";
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/approval-messages${qs}`);
  },

  markMessageRead(sowId: string, messageId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/approval-messages/${messageId}/mark-read`, "POST");
  },

  getSOWClauses(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/clauses`);
  },

  getSOWSections(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/sections`);
  },

  getHallucinationLayers(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/hallucination-layers`);
  },

  promoteToPortfolio(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sow/${sowId}/promote-to-portfolio`, "POST");
  },

  exportSOW(sowId: string, format: "pdf" | "docx" | "json"): Promise<Blob> {
    return getToken().then(token =>
      fetch(`${BASE_URL}/api/v1/sows/${sowId}/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        if (!res.ok) throw new ApiError(res.status, `Export failed: ${res.status}`);
        return res.blob();
      })
    );
  },
};
