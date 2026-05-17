/**
 * Direct-fetch client for POST /api/v1/enterprise/decomposition/plans.
 *
 * Bypasses /api/decomposition/proxy so the real backend URL shows in
 * the browser's Network tab. Acquires an enterprise-scoped token via
 * /api/sow/token and calls the Glimmora backend directly.
 */

const BASE_URL = process.env.NEXT_PUBLIC_GLIMMORA_API_URL || "";

export interface CreatePlanPayload {
  wizard_id: string;
  enterprise_id: string;
  sow_reference: string;
  project_name: string;
  minimum_budget?: number;
  maximum_budget?: number;
  start_date?: string;
  end_date?: string;
}

export interface CreatePlanResponse {
  success: boolean;
  message: string | null;
  data: Record<string, unknown> | null;
}

async function getEnterpriseToken(): Promise<string> {
  const res = await fetch("/api/sow/token?role=enterprise");
  if (!res.ok) {
    throw new Error("Failed to acquire enterprise API token.");
  }
  const data = await res.json();
  if (!data?.token) {
    throw new Error("Token endpoint returned no token.");
  }
  return data.token as string;
}

export interface ListPlansResponse {
  success: boolean;
  message: string | null;
  data: unknown;
}

export async function getEnterpriseDecompositionPlan(planId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ListPlansResponse;
}

export async function getEnterpriseDecompositionPlanTasks(planId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ListPlansResponse;
}

export async function getEnterpriseDecompositionPlanMilestones(planId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/milestones`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ListPlansResponse;
}

export async function postEnterpriseRequestRevision(planId: string, payload?: unknown): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/request-revision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ListPlansResponse;
}

export async function getEnterpriseDecompositionPlanRevision(planId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/revision`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ListPlansResponse;
}

export async function listEnterpriseDecompositionPlans(): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ListPlansResponse;
}

export async function postEnterpriseSubmitForReview(planId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/submit-for-review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}

export async function confirmEnterpriseDecompositionPlan(planId: string, confirmedBy: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      checklist: { item1: true, item2: true, item3: true },
      confirmed_by: confirmedBy,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ListPlansResponse;
}

export async function postEnterpriseKickoffAction(planId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/actions/kickoff?plan_id=${encodeURIComponent(planId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function postEnterpriseApproveKickoff(planId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/actions/approve-kickoff?plan_id=${encodeURIComponent(planId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

/* ── Helper ─────────────────────────────────────────────────────────── */

async function handleResponse(res: Response): Promise<ListPlansResponse> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as ListPlansResponse;
}

/* ── Task CRUD ──────────────────────────────────────────────────────── */

export interface TaskPayload {
  title?: string;
  task_name?: string;
  priority?: string;
  effort?: number;
  estimated_hours?: number;
  skills?: string[];
  description?: string;
  acceptance_criteria?: string[];
  milestone_id?: string;
}

export interface SubtaskPayload {
  title?: string;
  estimated_hours?: number;
}

export async function patchEnterpriseTask(planId: string, taskId: string, payload: TaskPayload): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function postEnterpriseTask(planId: string, payload: TaskPayload): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteEnterpriseTask(planId: string, taskId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function postEnterpriseSubtask(planId: string, taskId: string, payload: SubtaskPayload): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function patchEnterpriseSubtask(planId: string, taskId: string, subtaskId: string, payload: SubtaskPayload): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteEnterpriseSubtask(planId: string, taskId: string, subtaskId: string): Promise<ListPlansResponse> {
  const token = await getEnterpriseToken();
  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans/${planId}/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function createEnterpriseDecompositionPlan(
  payload: CreatePlanPayload,
): Promise<CreatePlanResponse> {
  const token = await getEnterpriseToken();

  const res = await fetch(`${BASE_URL}/api/v1/enterprise/decomposition/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errors = (data as { errors?: unknown })?.errors;
    if (Array.isArray(errors)) {
      const msg = errors
        .map((e: { field?: string; message?: string; loc?: unknown[]; msg?: string }) => {
          const field = e.field ?? (Array.isArray(e.loc) ? e.loc.join(".") : "");
          return `${field}: ${e.message ?? e.msg ?? ""}`.trim();
        })
        .join("; ");
      throw new Error(msg || `Request failed (${res.status})`);
    }
    const detail = (data as { detail?: unknown })?.detail;
    const message = (data as { message?: unknown })?.message;
    const msg =
      typeof detail === "string"
        ? detail
        : typeof message === "string"
        ? message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as CreatePlanResponse;
}
