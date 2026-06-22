/**
 * Decomposition v2 API client — REAL backend via Next.js proxy routes.
 *
 * All functions hit /api/decomposition/plans/* which the proxy forwards to
 * GET/POST /api/v1/enterprise/decomposition/plans on the enterprise backend
 * (port 8103 via the gateway at NEXT_PUBLIC_GLIMMORA_API_URL:9000).
 *
 * Response shape: backend wraps single plan in { plan: PlanDetail } and list
 * in { items: PlanSummary[], nextCursor }. The helpers below normalise these.
 */

import type {
  CreatePlanInput,
  PlanDetail,
  PlanStatus,
  PlanSummary,
  UpdatePlanInput,
} from "@/lib/decomposition/types";

/* ─── error class ──────────────────────────────────────────────────── */

export class DecompositionApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public reason?: string,
    public issues?: unknown,
  ) {
    super(message);
    this.name = "DecompositionApiError";
  }
}

/* ─── param / result types ──────────────────────────────────────────── */

export interface ListPlansParams {
  sowId?: string;
  status?: PlanStatus | PlanStatus[];
  includeArchived?: boolean;
  limit?: number;
  cursor?: string;
}

export interface PlanListResult {
  items: PlanSummary[];
  nextCursor: string | null;
}

/* ─── fetch helper ──────────────────────────────────────────────────── */

async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const d = data as Record<string, unknown>;
    const msg =
      (d.detail as string) ??
      (d.error as string) ??
      (d.message as string) ??
      `Request failed (${res.status})`;
    throw new DecompositionApiError(
      msg,
      res.status,
      (d.code as string) ?? undefined,
    );
  }

  return data;
}

/* ─── response unwrappers ─────────────────────────────────────────── */

function unwrapPlan(data: unknown): PlanDetail {
  if (!data || typeof data !== "object") {
    throw new DecompositionApiError("Unexpected response shape", 500, "parse_error");
  }
  const d = data as Record<string, unknown>;
  // Backend returns { plan: PlanDetail } or { data: PlanDetail } or bare
  const raw = (d.plan ?? d.data ?? d) as PlanDetail;
  return raw;
}

function unwrapList(data: unknown): PlanListResult {
  if (!data || typeof data !== "object") {
    return { items: [], nextCursor: null };
  }
  const d = data as Record<string, unknown>;
  let items: PlanSummary[];
  if (Array.isArray(d.items)) {
    items = d.items as PlanSummary[];
  } else if (Array.isArray(d.data)) {
    items = d.data as PlanSummary[];
  } else if (Array.isArray(d)) {
    items = d as PlanSummary[];
  } else {
    items = [];
  }
  return {
    items,
    nextCursor: (d.nextCursor as string | null) ?? null,
  };
}

/* ─────────────────────────── Queries ────────────────────────────── */

export async function listPlans(params: ListPlansParams = {}): Promise<PlanListResult> {
  const qs = new URLSearchParams();
  if (params.sowId) qs.set("sowId", params.sowId);
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status];
    for (const s of statuses) qs.append("status", s);
  }
  if (params.includeArchived) qs.set("includeArchived", "true");
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", params.cursor);

  const data = await apiFetch(
    `/api/decomposition/plans${qs.toString() ? `?${qs}` : ""}`,
  );
  return unwrapList(data);
}

export async function getPlan(planId: string): Promise<PlanDetail> {
  const data = await apiFetch(
    `/api/decomposition/plans/${encodeURIComponent(planId)}`,
  );
  return unwrapPlan(data);
}

/* ─────────────────────────── Mutations ──────────────────────────── */

export async function createPlan(input: CreatePlanInput): Promise<PlanDetail> {
  const data = await apiFetch("/api/decomposition/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrapPlan(data);
}

export async function updatePlan(planId: string, input: UpdatePlanInput): Promise<PlanDetail> {
  const data = await apiFetch(
    `/api/decomposition/plans/${encodeURIComponent(planId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return unwrapPlan(data);
}

export async function approvePlan(planId: string): Promise<PlanDetail> {
  const data = await apiFetch(
    `/api/decomposition/plans/${encodeURIComponent(planId)}/approve`,
    { method: "POST" },
  );
  return unwrapPlan(data);
}

export async function activatePlan(planId: string): Promise<PlanDetail> {
  const data = await apiFetch(
    `/api/decomposition/plans/${encodeURIComponent(planId)}/activate`,
    { method: "POST" },
  );
  return unwrapPlan(data);
}

export async function archivePlan(planId: string): Promise<PlanDetail> {
  const data = await apiFetch(
    `/api/decomposition/plans/${encodeURIComponent(planId)}/archive`,
    { method: "POST" },
  );
  return unwrapPlan(data);
}

export async function copyPlan(planId: string): Promise<PlanDetail> {
  const data = await apiFetch(
    `/api/decomposition/plans/${encodeURIComponent(planId)}/copy`,
    { method: "POST" },
  );
  return unwrapPlan(data);
}
