/**
 * SOW v2 API client.
 *
 * Two implementations behind a single flag:
 *   - USE_BACKEND === false (default): MOCK MODE — reads/writes
 *     src/lib/enterprise/mocks/sows.ts. Behaviour is byte-for-byte the
 *     legacy demo client, so nothing changes when the flag is off.
 *   - USE_BACKEND === true: REAL MODE — calls the enterprise-service via
 *     the Glimmora gateway. SOWs persist in Neon Postgres and are visible
 *     across every browser / session / user (no localStorage).
 *
 * Flag: NEXT_PUBLIC_SOW_BACKEND=1
 *
 * Token acquisition reuses the established pattern from src/lib/api/sow.ts:
 * fetch /api/sow/token (server route mints a Bearer JWT), cache it, then
 * call ${NEXT_PUBLIC_GLIMMORA_API_URL}<path> with Authorization: Bearer.
 */

import type {
  SowDetail,
  SowStage,
  SowStatus,
  SowSummary,
  SowApprovalSummary,
  CreateSowInput,
  UpdateSowDraftInput,
} from "@/lib/sow/types";
import { APPROVAL_STAGE_ORDER } from "@/lib/sow/types";
import {
  acceptSowMock,
  approveSowMock,
  archiveSowMock,
  createSowMock,
  declineSowMock,
  getSowMock,
  listSowsMock,
  rejectSowMock,
  sendBackSowMock,
  submitSowMock,
  updateSowDraftMock,
  withdrawSowMock,
} from "@/lib/enterprise/mocks/sows";
import {
  mapRowToSowDetail,
  mapRowToSowSummary,
  type SowBackendRow,
} from "@/lib/api/sow-backend";

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

/* ──────────────────────────── flag ──────────────────────────────── */

const USE_BACKEND = process.env.NEXT_PUBLIC_SOW_BACKEND === "1";

/* ──────────────────────────── List + Detail ─────────────────────── */

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

// Tiny artificial delay so loading skeletons get a moment to show during demos.
function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

/* ────────────────────── real-backend plumbing ───────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_GLIMMORA_API_URL || "";

let _cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;
  const res = await fetch("/api/sow/token");
  if (!res.ok) {
    throw new SowApiError("Failed to acquire API token", res.status, "auth");
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.token) {
    throw new SowApiError("No token returned", res.status, "auth");
  }
  _cachedToken = data.token as string;
  // Auto-expire after 50 minutes (mirrors src/lib/api/sow.ts).
  setTimeout(() => {
    _cachedToken = null;
  }, 50 * 60 * 1000);
  return _cachedToken;
}

interface Envelope<T> {
  success?: boolean;
  message?: string | null;
  data?: T | null;
}

/**
 * Call the gateway, attach the Bearer token, unwrap the {success,message,data}
 * envelope, and surface a SowApiError on a non-2xx response.
 */
async function backendCall<T>(
  path: string,
  method: string = "GET",
  payload?: unknown,
  isFormData = false,
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  let body: BodyInit | undefined;
  if (payload !== undefined) {
    if (isFormData) {
      body = payload as FormData; // browser sets multipart boundary
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body });
  const json = (await res.json().catch(() => ({}))) as Envelope<T> & {
    detail?: unknown;
    error?: unknown;
  };

  if (res.status === 401) {
    _cachedToken = null;
    throw new SowApiError("Session expired. Please refresh the page.", 401, "auth");
  }

  if (!res.ok) {
    const detail =
      (json as { detail?: { message?: string } | string }).detail ??
      (json as { error?: string }).error ??
      json.message ??
      `API error ${res.status}`;
    const msg =
      typeof detail === "string"
        ? detail
        : (detail as { message?: string })?.message ?? JSON.stringify(detail);
    throw new SowApiError(msg, res.status, "request");
  }

  // Most endpoints wrap in {success,message,data}; unwrap when present.
  if (json && typeof json === "object" && "data" in json) {
    return (json.data ?? null) as T;
  }
  return json as unknown as T;
}

/** The decide endpoint returns {sowId,stage,decision,status,stages} — not a row. */
interface DecideResult {
  sowId: string;
  stage: string;
  decision: string;
  status: string;
  stages: SowBackendRow["approvalStages"];
}

/* ──────────────────────────── List + Detail ─────────────────────── */

export async function listSows(params: ListSowsParams = {}): Promise<SowListResult> {
  if (!USE_BACKEND) {
    return tick(listSowsMock(params));
  }

  const rows = await backendCall<SowBackendRow[]>("/api/v1/sows");
  let items = (rows ?? []).map(mapRowToSowSummary);

  if (params.status) {
    const allowed = Array.isArray(params.status)
      ? new Set(params.status)
      : new Set([params.status]);
    items = items.filter((s) => allowed.has(s.status));
  }
  if (params.stage) {
    items = items.filter((s) => s.stage === params.stage);
  }
  if (params.ownerId) {
    items = items.filter((s) => s.ownerId === params.ownerId);
  }
  if (!params.includeArchived) {
    items = items.filter((s) => s.status !== "archived");
  }
  items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  if (params.limit) items = items.slice(0, params.limit);

  return { items, nextCursor: null };
}

/**
 * Admin-scoped list — ALL SOWs across every owner (Glimmora platform admins).
 * The Super Admin Commercial gate uses this so it sees SOWs raised by ANY
 * enterprise tenant (the owner-scoped listSows only returns the caller's own).
 * In mock mode this is identical to listSows (single shared local store).
 */
export async function listAllSowsAdmin(params: ListSowsParams = {}): Promise<SowListResult> {
  if (!USE_BACKEND) {
    return tick(listSowsMock(params));
  }

  const rows = await backendCall<SowBackendRow[]>("/api/v1/sows/admin/all");
  let items = (rows ?? []).map(mapRowToSowSummary);

  if (params.status) {
    const allowed = Array.isArray(params.status)
      ? new Set(params.status)
      : new Set([params.status]);
    items = items.filter((s) => allowed.has(s.status));
  }
  if (params.stage) items = items.filter((s) => s.stage === params.stage);
  if (!params.includeArchived) items = items.filter((s) => s.status !== "archived");
  items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  if (params.limit) items = items.slice(0, params.limit);

  return { items, nextCursor: null };
}

export async function getSow(sowId: string): Promise<SowDetail> {
  if (!USE_BACKEND) {
    const sow = getSowMock(sowId);
    if (!sow) throw new SowApiError(`SOW ${sowId} not found`, 404, "not_found");
    return tick(sow);
  }

  const row = await backendCall<SowBackendRow>(`/api/v1/sows/${sowId}`);
  if (!row) throw new SowApiError(`SOW ${sowId} not found`, 404, "not_found");
  return mapRowToSowDetail(row);
}

/* ───────────────────────────── Mutations ────────────────────────── */

export async function createSow(input: CreateSowInput): Promise<SowDetail> {
  if (!USE_BACKEND) {
    return tick(createSowMock(input));
  }

  // The only backend create endpoint (/api/v1/sow/upload-approved) requires a
  // file (UploadFile = File(...)). For a non-file create we attach a minimal
  // placeholder document so the SOW enters the real 5-stage pipeline; the title
  // and commercial fields come from the input payload.
  const payload = (input.payload ?? {}) as Record<string, unknown>;
  const clientOrganisation =
    (payload.clientOrganisation as string) ??
    (payload.tenantName as string) ??
    "—";

  const fd = new FormData();
  const placeholder = new Blob([input.body ?? input.title], {
    type: "text/plain",
  });
  fd.append("file", placeholder, `${input.title || "sow"}.txt`);
  fd.append("projectTitle", input.title);
  fd.append("clientOrganisation", clientOrganisation);
  if (payload.budgetAmount != null) fd.append("budgetAmount", String(payload.budgetAmount));
  if (payload.budgetCurrency != null) fd.append("budgetCurrency", String(payload.budgetCurrency));
  if (payload.startDate != null) fd.append("startDate", String(payload.startDate));
  if (payload.endDate != null) fd.append("endDate", String(payload.endDate));

  const row = await backendCall<SowBackendRow>(
    "/api/v1/sow/upload-approved",
    "POST",
    fd,
    true,
  );
  return mapRowToSowDetail(row);
}

export async function updateSowDraft(
  sowId: string,
  input: UpdateSowDraftInput,
): Promise<SowDetail> {
  if (!USE_BACKEND) {
    return tick(updateSowDraftMock(sowId, input));
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.projectTitle = input.title;
  if (input.confidentiality !== undefined) patch.confidentiality = input.confidentiality;
  if (input.body !== undefined) patch.body = input.body;
  if (input.changeNote !== undefined) patch.changeNote = input.changeNote;
  if (input.payload !== undefined) Object.assign(patch, input.payload);

  const row = await backendCall<SowBackendRow>(
    `/api/v1/sow/${sowId}`,
    "PATCH",
    patch,
  );
  return mapRowToSowDetail(row);
}

export async function submitSow(sowId: string): Promise<SowDetail> {
  if (!USE_BACKEND) {
    return tick(submitSowMock(sowId));
  }

  await backendCall<SowBackendRow>(`/api/v1/sow/${sowId}/confirm-and-submit`, "POST");
  return getSow(sowId);
}

export async function withdrawSow(
  sowId: string,
  reason?: string,
): Promise<SowDetail> {
  // No backend endpoint — withdraw stays on the mock store.
  return tick(withdrawSowMock(sowId, reason));
}

export async function archiveSow(sowId: string): Promise<SowDetail> {
  // No backend endpoint — archive stays on the mock store.
  return tick(archiveSowMock(sowId));
}

/* ───── Glimmora Commercial gate (admin · commercial stage only) ───── */

export async function acceptSow(sowId: string, comment?: string): Promise<SowDetail> {
  if (!USE_BACKEND) {
    return tick(acceptSowMock(sowId, comment));
  }
  await backendCall<DecideResult>(
    `/api/v1/approvals/${sowId}/stage/commercial/decide`,
    "POST",
    { decision: "approve", comment: comment ?? "Approved by Glimmora Commercial" },
  );
  return getSow(sowId);
}

/** Reject at Commercial stage. */
export async function declineSow(sowId: string, comment: string): Promise<SowDetail> {
  if (!USE_BACKEND) {
    return tick(declineSowMock(sowId, comment));
  }
  await backendCall<DecideResult>(
    `/api/v1/approvals/${sowId}/stage/commercial/decide`,
    "POST",
    { decision: "reject", comment },
  );
  return getSow(sowId);
}

/* ────────────────────────── Approval pipeline ───────────────────── */

function nextPendingStage(approvals: SowApprovalSummary[]): SowStage | null {
  for (const stage of APPROVAL_STAGE_ORDER) {
    const a = approvals.find((x) => x.stage === stage);
    if (a && a.decision === "pending") return stage;
  }
  return null;
}

export async function approveSow(
  sowId: string,
  stage: SowStage,
  comment?: string,
): Promise<TransitionEnvelope> {
  if (!USE_BACKEND) {
    return tick(approveSowMock(sowId, stage, comment));
  }

  const result = await backendCall<DecideResult>(
    `/api/v1/approvals/${sowId}/stage/${stage}/decide`,
    "POST",
    { decision: "approve", comment },
  );
  // Re-fetch the full SOW so the returned detail reflects every stage + status.
  const sow = await getSow(sowId);
  const terminal = result.status === "approved";
  return {
    sow,
    transition: {
      fromStage: stage,
      advancedTo: terminal ? null : nextPendingStage(sow.approvals),
      terminal,
    },
  };
}

export async function rejectSow(
  sowId: string,
  stage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  if (!USE_BACKEND) {
    return tick(rejectSowMock(sowId, stage, comment));
  }

  await backendCall<DecideResult>(
    `/api/v1/approvals/${sowId}/stage/${stage}/decide`,
    "POST",
    { decision: "reject", comment },
  );
  const sow = await getSow(sowId);
  return {
    sow,
    transition: { fromStage: stage, advancedTo: null, terminal: true },
  };
}

export async function sendBackSow(
  sowId: string,
  fromStage: SowStage,
  toStage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  // No backend endpoint — send-back stays on the mock store.
  return tick(sendBackSowMock(sowId, fromStage, toStage, comment));
}
