/**
 * SOW v2 API client — REAL backend via Next.js proxy routes.
 *
 * Every function fetches /api/sow/* (or /api/sow/{id}/*) — the proxy routes
 * in src/app/api/sow/ forward to the enterprise backend at :8103 via the
 * gateway at NEXT_PUBLIC_GLIMMORA_API_URL (port 9000).
 *
 * Response mapper: the enterprise backend may return either:
 *   { data: <SowDetail> }     (wrapped envelope)
 *   { sow: <SowDetail> }      (sow-specific envelope)
 *   <SowDetail>               (bare)
 * The `unwrapSow` / `unwrapList` helpers normalise all three.
 *
 * TransitionEnvelope note: the backend POST /approve|reject|send-back
 * endpoints return { sow: SowDetail, transition: {...} }. We surface that
 * as-is since the hooks pass it to `onSuccess`.
 */

import type {
  SowDetail,
  SowStage,
  SowStatus,
  SowSummary,
  CreateSowInput,
  UpdateSowDraftInput,
} from "@/lib/sow/types";

/* ─── error class (unchanged public shape) ─────────────────────────── */

export class SowApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public reason?: string,
    public issues?: unknown,
  ) {
    super(message);
    this.name = "SowApiError";
  }
}

/* ─── param / result types ──────────────────────────────────────────── */

export interface ListSowsParams {
  status?: SowStatus | SowStatus[];
  stage?: SowStage;
  ownerId?: string;
  includeArchived?: boolean;
  limit?: number;
  cursor?: string;
}

export interface SowListResult {
  items: SowSummary[];
  nextCursor: string | null;
}

export interface TransitionEnvelope {
  sow: SowDetail;
  transition: {
    fromStage: SowStage;
    advancedTo: SowStage | null;
    terminal: boolean;
  };
  notificationFailures?: string[];
}

/* ─── response mappers ──────────────────────────────────────────────── */

/**
 * The enterprise backend stores SOWs with camelCase keys that mostly
 * match SowDetail / SowSummary, but a few fields differ. This mapper
 * normalises the raw row → FE types so the components don't change.
 *
 * Key differences vs the FE mock shape:
 *   backend.projectTitle  → FE.title
 *   backend.source        → (ignored, not in type)
 *   backend.submittedAt   → FE.submittedForApprovalAt
 *   backend.status        → same values BUT backend uses "submitted" instead
 *                           of "approval" in some transitions. We map them.
 *   backend.approvalStages → FE.approvals (SowApprovalSummary[])
 */
function mapStatus(raw: string): SowDetail["status"] {
  // The manual SOW backend uses "submitted" as its in-flight status.
  // The FE type uses "approval" for the same concept.
  if (raw === "submitted" || raw === "changes_requested" || raw === "in_review") {
    return "approval";
  }
  // "promoted", "generated", "closed" are terminal success states → treat as approved
  if (raw === "promoted" || raw === "generated" || raw === "closed") {
    return "approved";
  }
  const valid: SowDetail["status"][] = [
    "draft", "approval", "approved", "rejected", "withdrawn", "archived",
  ];
  return valid.includes(raw as SowDetail["status"])
    ? (raw as SowDetail["status"])
    : "draft";
}

function mapApprovalStages(raw: unknown): SowDetail["approvals"] {
  // The enterprise backend stores approval stages as an array of objects:
  // [{ key, title, status, decidedBy, decidedAt, comment }]
  // We map these to SowApprovalSummary shape.
  if (!Array.isArray(raw)) return [];
  const stageKeyToFe: Record<string, SowDetail["stage"]> = {
    business: "finance",
    commercial: "security",
    legal: "legal",
    security: "security",
    finance: "finance",
    final: "platform",
    platform: "platform",
  };
  return raw.map((s: Record<string, unknown>, i) => {
    const key = String(s.key ?? "");
    const stage: SowDetail["approvals"][number]["stage"] =
      (stageKeyToFe[key] as SowDetail["approvals"][number]["stage"]) ?? "finance";
    const decision: SowDetail["approvals"][number]["decision"] =
      s.status === "approved"
        ? "approved"
        : s.status === "rejected"
          ? "rejected"
          : s.status === "send_back"
            ? "send_back"
            : "pending";
    return {
      id: `appr-${key}-${i}`,
      stage,
      sowVersion: 1,
      approverId: (s.decidedBy as string | null) ?? null,
      decision,
      comment: (s.comment as string | null) ?? null,
      decidedAt: (s.decidedAt as string | null) ?? null,
      slaDeadline: null,
      createdAt: (s.createdAt as string) ?? new Date().toISOString(),
    };
  });
}

function mapSow(raw: Record<string, unknown>): SowDetail {
  const status = mapStatus(String(raw.status ?? "draft"));

  // Determine which field holds the SOW title — backend uses projectTitle
  const title =
    (raw.projectTitle as string) ||
    (raw.title as string) ||
    "Untitled SOW";

  // Map approval stage string to FE SowStage enum
  const stageMap: Record<string, SowDetail["stage"]> = {
    business: "finance",
    commercial: "security",
    legal: "legal",
    security: "security",
    finance: "finance",
    final: "platform",
    platform: "platform",
  };
  const rawStage = (raw.stage as string | null) ?? null;
  const stage: SowDetail["stage"] = rawStage
    ? ((stageMap[rawStage] as SowDetail["stage"]) ?? (rawStage as SowDetail["stage"]))
    : null;

  const approvals = mapApprovalStages(raw.approvalStages);

  // Build activeVersionDetail from payload fields stored on the SOW document
  const payload: Record<string, unknown> = {
    // Carry through all backend fields as the payload so pricing + intake
    // sections can still read budget / dates via readSowPricing / parseIntakePayload
    ...(typeof raw === "object" ? raw : {}),
  };

  return {
    id: (raw.id as string) ?? "",
    title,
    status,
    stage: status === "approval" ? (stage ?? "finance") : stage,
    activeVersion: (raw.version as number) ?? 1,
    ownerId: (raw.ownerId as string) || (raw.owner_id as string) || "",
    ownerName: (raw.ownerName as string) || (raw.owner_name as string) || undefined,
    tenantId: (raw.tenantId as string) || (raw.tenant_id as string) || undefined,
    tenantName: (raw.tenantName as string) || undefined,
    confidentiality:
      ((raw.confidentiality as string) as SowDetail["confidentiality"]) ??
      "internal",
    submittedForApprovalAt:
      (raw.submittedAt as string | null) ??
      (raw.submittedForApprovalAt as string | null) ??
      null,
    approvedAt: (raw.approvedAt as string | null) ?? null,
    rejectedAt: (raw.rejectedAt as string | null) ?? null,
    withdrawnAt: (raw.withdrawnAt as string | null) ?? null,
    archivedAt: (raw.archivedAt as string | null) ?? null,
    createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
    activeVersionDetail: {
      version: (raw.version as number) ?? 1,
      payload,
      body: (raw.body as string | null) ?? null,
      changeNote: (raw.changeNote as string | null) ?? null,
      createdBy: (raw.ownerId as string) || (raw.owner_id as string) || "",
      createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
    },
    approvals,
  };
}

function unwrapSow(data: unknown): SowDetail {
  if (!data || typeof data !== "object") {
    throw new SowApiError("Unexpected response shape", 500, "parse_error");
  }
  const d = data as Record<string, unknown>;
  // Wrapped envelope shapes
  const raw = (d.sow ?? d.data ?? d) as Record<string, unknown>;
  return mapSow(raw);
}

function unwrapList(data: unknown): SowListResult {
  if (!data || typeof data !== "object") {
    return { items: [], nextCursor: null };
  }
  const d = data as Record<string, unknown>;
  // The backend envelope is either { data: [...] } or { items: [...] } or [...]
  let rawItems: unknown[];
  if (Array.isArray(d.data)) {
    rawItems = d.data;
  } else if (Array.isArray(d.items)) {
    rawItems = d.items;
  } else if (Array.isArray(d)) {
    rawItems = d as unknown[];
  } else {
    rawItems = [];
  }
  const items = rawItems.map((r) => {
    const detail = mapSow(r as Record<string, unknown>);
    // SowSummary = SowDetail minus activeVersionDetail + approvals
    const { activeVersionDetail: _a, approvals: _b, ...summary } = detail;
    return summary as SowSummary;
  });
  return {
    items,
    nextCursor: (d.nextCursor as string | null) ?? null,
  };
}

/* ─── fetch helpers ─────────────────────────────────────────────────── */

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
    throw new SowApiError(msg, res.status, (d.code as string) ?? undefined);
  }

  return data;
}

/* ────────────────────────── List + Detail ─────────────────────────── */

export async function listSows(params: ListSowsParams = {}): Promise<SowListResult> {
  const qs = new URLSearchParams();
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status];
    for (const s of statuses) qs.append("status", s);
  }
  if (params.stage) qs.set("stage", params.stage);
  if (params.ownerId) qs.set("ownerId", params.ownerId);
  if (params.includeArchived) qs.set("includeArchived", "true");
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", params.cursor);

  const data = await apiFetch(`/api/sow${qs.toString() ? `?${qs}` : ""}`);
  return unwrapList(data);
}

export async function getSow(sowId: string): Promise<SowDetail> {
  const data = await apiFetch(`/api/sow/${encodeURIComponent(sowId)}`);
  return unwrapSow(data);
}

/* ───────────────────────────── Mutations ────────────────────────── */

export async function createSow(input: CreateSowInput): Promise<SowDetail> {
  const data = await apiFetch("/api/sow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrapSow(data);
}

export async function updateSowDraft(
  sowId: string,
  input: UpdateSowDraftInput,
): Promise<SowDetail> {
  const data = await apiFetch(`/api/sow/${encodeURIComponent(sowId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrapSow(data);
}

export async function submitSow(sowId: string): Promise<SowDetail> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/submit`,
    { method: "POST" },
  );
  return unwrapSow(data);
}

export async function withdrawSow(
  sowId: string,
  reason?: string,
): Promise<SowDetail> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/withdraw`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reason ? { reason } : {}),
    },
  );
  return unwrapSow(data);
}

export async function archiveSow(sowId: string): Promise<SowDetail> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/archive`,
    { method: "POST" },
  );
  return unwrapSow(data);
}

/* ───── Glimmora Commercial gate ──────────────────────────────────── */

export async function acceptSow(sowId: string, comment?: string): Promise<SowDetail> {
  // Platform approval = approve at "platform" stage
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "platform", comment: comment ?? "Approved by Glimmora platform" }),
    },
  );
  // approve returns TransitionEnvelope; extract .sow
  const d = data as Record<string, unknown>;
  return unwrapSow(d.sow ? d : data);
}

export async function declineSow(sowId: string, comment: string): Promise<SowDetail> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "platform", comment }),
    },
  );
  const d = data as Record<string, unknown>;
  return unwrapSow(d.sow ? d : data);
}

/* ─────────────────────── Approval pipeline ──────────────────────── */

export async function approveSow(
  sowId: string,
  stage: SowStage,
  comment?: string,
  _actorEmail?: string,
): Promise<TransitionEnvelope> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, comment }),
    },
  );
  return normaliseTransitionEnvelope(data, sowId, stage, true);
}

export async function rejectSow(
  sowId: string,
  stage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, comment }),
    },
  );
  return normaliseTransitionEnvelope(data, sowId, stage, false);
}

export async function sendBackSow(
  sowId: string,
  fromStage: SowStage,
  toStage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/send-back`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromStage, toStage, comment }),
    },
  );
  return normaliseTransitionEnvelope(data, sowId, fromStage, false);
}

export async function returnSowToDraft(
  sowId: string,
  comment: string,
): Promise<TransitionEnvelope> {
  const data = await apiFetch(
    `/api/sow/${encodeURIComponent(sowId)}/send-back`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    },
  );
  return normaliseTransitionEnvelope(data, sowId, "platform", false);
}

/** Normalise various backend response shapes into TransitionEnvelope. */
function normaliseTransitionEnvelope(
  data: unknown,
  _sowId: string,
  fromStage: SowStage,
  advanced: boolean,
): TransitionEnvelope {
  const d = (data ?? {}) as Record<string, unknown>;
  // Backend may return { sow, transition } or { data } or bare SOW row
  let sow: SowDetail;
  if (d.sow && typeof d.sow === "object") {
    sow = mapSow(d.sow as Record<string, unknown>);
  } else if (d.data && typeof d.data === "object") {
    sow = mapSow(d.data as Record<string, unknown>);
  } else if (d.id) {
    sow = mapSow(d);
  } else {
    // Last resort: return a minimal skeleton — caller will invalidate query anyway
    sow = mapSow(d);
  }

  const stageOrder: SowStage[] = ["finance", "security", "legal", "platform"];
  const idx = stageOrder.indexOf(fromStage);
  const advancedTo = advanced && idx >= 0 && idx + 1 < stageOrder.length
    ? stageOrder[idx + 1]!
    : null;

  return {
    sow,
    transition: {
      fromStage,
      advancedTo,
      terminal: fromStage === "platform",
    },
  };
}
