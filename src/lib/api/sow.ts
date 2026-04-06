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

// ── Direct API call helper ────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_GLIMMORA_API_URL || "";

async function sowCall<T>(
  path: string,
  method: string = "GET",
  payload?: unknown,
  _retry = false,
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

  if (!res.ok) {
    // If 401 and haven't retried yet, get a fresh token and retry once
    if (res.status === 401 && !_retry) {
      _cachedToken = null;
      return sowCall<T>(path, method, payload, true);
    }

    // Format field-level validation errors nicely
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

  // ── AI Draft Review ──

  listSows(): Promise<BaseResponse> {
    return sowCall<BaseResponse>("/api/v1/sows");
  },

  getSow(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}`);
  },

  sowAction(sowId: string, payload: SOWActionRequest): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}/action`, "POST", payload);
  },

  getHallucinationAnalysis(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}/hallucination-analysis`);
  },

  getRiskAssessment(sowId: string): Promise<BaseResponse> {
    return sowCall<BaseResponse>(`/api/v1/sows/${sowId}/risk-assessment`);
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
    );
  },

  searchUsers(query: string, organisation?: string): Promise<BaseResponse> {
    const params = new URLSearchParams({ q: query });
    if (organisation) params.set("organisation", organisation);
    return sowCall<BaseResponse>(`/api/v1/users/search?${params.toString()}`);
  },
};
