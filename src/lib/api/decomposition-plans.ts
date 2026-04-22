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
