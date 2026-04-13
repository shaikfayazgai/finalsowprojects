/**
 * Decomposition Plans API client.
 *
 * All calls go through /api/decomposition/proxy (server-side) which
 * attaches the correct Bearer token. This avoids the MFA-blocks-token
 * problem that enterprise users hit on login.
 */

import { ApiError } from "./client";

// ── Response type ────────────────────────────────────────────────────────

export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string | null;
  data: T | null;
}

// ── Proxy call helper ───────────────────────────────────────────────────

async function decompositionCall<T>(
  path: string,
  method: string = "GET",
  payload?: unknown,
): Promise<T> {
  const res = await fetch("/api/decomposition/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, method, ...(payload !== undefined ? { payload } : {}) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`[Decomposition API] ${method} ${path} → ${res.status}`, data);

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

// ── Decomposition Plans API ──────────────────────────────────────────────

export const decompositionApi = {
  // ── Plans ───────────────────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans — List all plans (dashboard overview) */
  listPlans(): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>("/api/v1/enterprise/decomposition/plans");
  },

  /** POST /api/v1/enterprise/decomposition/plans — Create a new decomposition plan */
  createPlan(payload: unknown): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      "/api/v1/enterprise/decomposition/plans",
      "POST",
      payload,
    );
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id} — Fetch full plan for dashboard review */
  getPlan(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/revision — Get revision */
  getRevision(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/revision`);
  },

  /** POST /api/v1/enterprise/decomposition/plans/{plan_id}/revision — Increase revision */
  increaseRevision(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/${planId}/revision`,
      "POST",
    );
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/summary — Get summary */
  getSummary(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/summary`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/checklist-status — Get checklist */
  getChecklistStatus(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/checklist-status`);
  },

  // ── Plan Lock ───────────────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/status — Get plan status */
  getPlanStatus(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/status`);
  },

  /** POST /api/v1/enterprise/decomposition/plans/{plan_id}/lock — Lock plan */
  lockPlan(planId: string, payload?: unknown): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/${planId}/lock`,
      "POST",
      payload,
    );
  },

  // ── Confirm ─────────────────────────────────────────────────────────────

  /** POST /api/v1/enterprise/decomposition/plans/{plan_id}/confirm — Confirm plan */
  confirmPlan(planId: string, payload?: unknown): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/${planId}/confirm`,
      "POST",
      payload,
    );
  },

  // ── Revision ────────────────────────────────────────────────────────────

  /** POST /api/v1/enterprise/decomposition/plans/{plan_id}/request-revision — Request revision */
  requestRevision(planId: string, payload?: unknown): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/${planId}/request-revision`,
      "POST",
      payload,
    );
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/revision-modal — Get revision modal data */
  getRevisionModal(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/revision-modal`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/revised — Get revised plan */
  getRevisedPlan(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/revised`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/revisions/{revision_id} — Get revision detail */
  getRevisionDetail(planId: string, revisionId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/revisions/${revisionId}`);
  },

  // ── Plan Review Page ────────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/review — Load full plan review page */
  getReview(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/review`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/review/checklist — Get review checklist state */
  getReviewChecklist(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/review/checklist`);
  },

  /** PATCH /api/v1/enterprise/decomposition/plans/{plan_id}/review/checklist — Toggle review checklist item */
  updateReviewChecklist(planId: string, payload: unknown): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/${planId}/review/checklist`,
      "PATCH",
      payload,
    );
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/review/summary — Get plan summary strip data */
  getReviewSummary(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/review/summary`);
  },

  // ── Tasks ───────────────────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/tasks — Get tasks */
  getTasks(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/tasks`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/tasks/query — Query tasks with filters */
  queryTasks(planId: string, params?: Record<string, string>): Promise<BaseResponse> {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/tasks/query${qs}`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/tasks/{task_id} — Get single task */
  getTask(planId: string, taskId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/milestones — Get milestones */
  getMilestones(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/milestones`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/critical-path — Get critical tasks */
  getCriticalPath(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/critical-path`);
  },

  // ── Task Detail ─────────────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/tasks/{task_id}/detail — Get task detail */
  getTaskDetail(planId: string, taskId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/detail`);
  },

  /** POST /api/v1/enterprise/decomposition/plans/{plan_id}/tasks/{task_id}/flag — Flag task */
  flagTask(planId: string, taskId: string, payload?: unknown): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/flag`,
      "POST",
      payload,
    );
  },

  // ── Checklist ───────────────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/checklist — Get checklist */
  getChecklist(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/checklist`);
  },

  /** POST /api/v1/enterprise/decomposition/plans/{plan_id}/checklist — Update checklist */
  updateChecklist(planId: string, payload: unknown): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/${planId}/checklist`,
      "POST",
      payload,
    );
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/checklist/validate — Validate checklist */
  validateChecklist(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/checklist/validate`);
  },

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/checklist/date-validation — Validate dates */
  validateChecklistDates(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/checklist/date-validation`);
  },

  // ── Summary ─────────────────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/summary-panel — Get summary panel */
  getSummaryPanel(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/summary-panel`);
  },

  // ── Plan Actions ────────────────────────────────────────────────────────

  /** POST /api/v1/enterprise/decomposition/plans/actions/kickoff?plan_id={id} — Kickoff plan */
  kickoff(payload: { plan_id: string } & Record<string, unknown>): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/actions/kickoff?plan_id=${payload.plan_id}`,
      "POST",
    );
  },

  /** DELETE /api/v1/enterprise/decomposition/plans/actions/{plan_id}/withdraw — Withdraw plan */
  withdraw(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/enterprise/decomposition/plans/actions/${planId}/withdraw`,
      "DELETE",
    );
  },

  // ── Legacy / Internal ──────────────────────────────────────────────────

  /** GET /api/v1/enterprise/decomposition/plans/{plan_id}/configure-legacy — Configure legacy plan */
  configureLegacy(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(`/api/v1/enterprise/decomposition/plans/${planId}/configure-legacy`);
  },

  /** POST /api/v1/internal/decomposition/plans/{plan_id}/revision/complete — Mark revision complete (internal) */
  revisionComplete(planId: string): Promise<BaseResponse> {
    return decompositionCall<BaseResponse>(
      `/api/v1/internal/decomposition/plans/${planId}/revision/complete`,
      "POST",
    );
  },
};
