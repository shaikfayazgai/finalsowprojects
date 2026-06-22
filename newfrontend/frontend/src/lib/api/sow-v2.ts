/**
 * SOW v2 API client — MOCK MODE.
 *
 * For the demo + handoff to backend developers, this client reads/writes
 * to src/lib/enterprise/mocks/sows.ts instead of /api/sow. Hook + page
 * code stays unchanged.
 *
 * Backend dev replacement path: swap each function body for the
 * commented-out fetch() block that mirrors the original contract.
 * See src/lib/enterprise/mocks/sows.ts for the exact REST contract.
 */

import type {
  SowDetail,
  SowStage,
  SowStatus,
  SowSummary,
  CreateSowInput,
  UpdateSowDraftInput,
} from "@/lib/sow/types";
import { isSowOwner } from "@/lib/enterprise/rbac";
import { isEnterpriseStage } from "@/lib/sow/approval-pipeline";
import {
  acceptSowMock,
  approveSowMock,
  archiveSowMock,
  declineSowMock,
  getSowMock,
  listSowsMock,
  rejectSowMock,
  sendBackSowMock,
  returnSowToDraftMock,
  submitSowMock,
  updateSowDraftMock,
  withdrawSowMock,
} from "@/lib/enterprise/mocks/sows";
import { mapBackendSummary, mapBackendDetail } from "@/lib/sow/backend-map";

/** Mock default SOW author when caller omits actor (dev only). */
const MOCK_DEFAULT_ACTOR = "sandeep@acme.com";

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

// Tiny artificial delay so loading skeletons get a moment to show during demos.
function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function listSows(params: ListSowsParams = {}): Promise<SowListResult> {
  // REAL: the caller's tenant SOWs (enterprise owner-scoped) from the backend.
  const res = await fetch("/api/sow", { cache: "no-store" });
  if (!res.ok) throw new SowApiError(`Failed to list SOWs (${res.status})`, res.status, "list_failed");
  const body = await res.json();
  const rows = (body?.data ?? body?.items ?? body) as unknown;
  let items = (Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []).map(mapBackendSummary);
  if (params.status) {
    const allowed = Array.isArray(params.status) ? params.status : [params.status];
    items = items.filter((s) => allowed.includes(s.status));
  }
  if (!params.includeArchived) items = items.filter((s) => s.status !== "archived");
  return { items, nextCursor: null };
}

export async function getSow(sowId: string): Promise<SowDetail> {
  // REAL: fetch the SOW from the backend (owner-scoped for enterprise users).
  const res = await fetch(`/api/sow/${encodeURIComponent(sowId)}`, { cache: "no-store" });
  if (res.status === 404) throw new SowApiError(`SOW ${sowId} not found`, 404, "not_found");
  if (!res.ok) throw new SowApiError(`Failed to load SOW (${res.status})`, res.status, "get_failed");
  const body = await res.json();
  const row = (body?.data ?? body) as Record<string, unknown>;
  if (!row || !row.id) throw new SowApiError(`SOW ${sowId} not found`, 404, "not_found");
  return mapBackendDetail(row);
}

/* ───────────────────────────── Mutations ────────────────────────── */

export async function createSow(input: CreateSowInput): Promise<SowDetail> {
  // REAL: persist the SOW to the backend so it enters the approval pipeline and
  // /submit works. (The mock createSowMock produced a sow-acme-… id that the real
  // POST /api/sow/{id}/submit then 404'd on — author intake "Submit failed (404)".)
  const payload = (input.payload && typeof input.payload === "object")
    ? (input.payload as Record<string, unknown>) : {};
  const res = await fetch("/api/sow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      confidentiality: input.confidentiality,
      body: input.body,
      ...payload,
    }),
  });
  if (!res.ok) throw new SowApiError(`Create failed (${res.status})`, res.status, "create_failed");
  const data = await res.json();
  const row = (data?.data ?? data) as Record<string, unknown>;
  if (!row || !row.id) throw new SowApiError("Create returned no SOW", 502, "create_failed");
  return mapBackendDetail(row);
}

export async function updateSowDraft(
  sowId: string,
  input: UpdateSowDraftInput,
): Promise<SowDetail> {
  return tick(updateSowDraftMock(sowId, input));
}

export async function submitSow(sowId: string): Promise<SowDetail> {
  // REAL: move a draft into the approval pipeline.
  const res = await fetch(`/api/sow/${encodeURIComponent(sowId)}/submit`, { method: "POST" });
  if (!res.ok) throw new SowApiError(`Submit failed (${res.status})`, res.status, "submit_failed");
  return getSow(sowId);
}

/** frontend SowStage → backend approval-stage key (tenant_admin=final, super admin=commercial). */
const BACKEND_STAGE: Record<SowStage, string> = {
  security: "security",
  finance: "finance",
  legal: "legal",
  tenant_admin: "final",
  platform: "commercial",
};

/** REAL stage decision → re-fetches the SOW and builds the transition envelope. */
async function decideStageReal(
  sowId: string,
  stage: SowStage,
  decision: "approve" | "reject",
  comment?: string,
  signature?: string,
  terminalReject?: boolean,
): Promise<TransitionEnvelope> {
  const res = await fetch(`/api/sow/${encodeURIComponent(sowId)}/stage/${BACKEND_STAGE[stage]}/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `terminal` distinguishes a hard Reject (ends the pipeline → status 'rejected')
    // from a Send-back (returns the SOW to draft for revision).
    body: JSON.stringify({ decision, comment: comment ?? "", ...(signature ? { signature } : {}), ...(terminalReject ? { terminal: true } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new SowApiError(err?.detail || err?.message || `Decision failed (${res.status})`, res.status, "decide_failed");
  }
  const sow = await getSow(sowId);
  const terminal = sow.status === "approved" || sow.status === "rejected";
  return { sow, transition: { fromStage: stage, advancedTo: terminal ? null : sow.stage, terminal } };
}

export async function withdrawSow(
  sowId: string,
  reason?: string,
): Promise<SowDetail> {
  return tick(withdrawSowMock(sowId, reason));
}

export async function archiveSow(sowId: string): Promise<SowDetail> {
  return tick(archiveSowMock(sowId));
}

/* ───── Glimmora Commercial gate (admin · stage 2 only) ───── */

export async function acceptSow(sowId: string, comment?: string): Promise<SowDetail> {
  return tick(acceptSowMock(sowId, comment));
}

/** Reject at Commercial stage. */
export async function declineSow(sowId: string, comment: string): Promise<SowDetail> {
  return tick(declineSowMock(sowId, comment));
}

/* ────────────────────────── Approval pipeline ───────────────────── */

export interface TransitionEnvelope {
  sow: SowDetail;
  transition: {
    fromStage: SowStage;
    advancedTo: SowStage | null;
    terminal: boolean;
  };
  notificationFailures?: string[];
}

export async function approveSow(
  sowId: string,
  stage: SowStage,
  comment?: string,
  _actorEmail?: string,
  signature?: string,
): Promise<TransitionEnvelope> {
  // REAL: enterprise signs security/finance/legal + the Tenant-admin sign-off
  // (with signature); the Super admin signs the final platform/commercial gate.
  return decideStageReal(sowId, stage, "approve", comment, signature);
}

export async function rejectSow(
  sowId: string,
  stage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  // Hard reject — ends the approval pipeline (status → 'rejected').
  return decideStageReal(sowId, stage, "reject", comment, undefined, true);
}

export async function sendBackSow(
  sowId: string,
  fromStage: SowStage,
  _toStage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  // Send-back = reject the current gate with a comment; the SOW returns for
  // correction (backend records the rejection + reason).
  return decideStageReal(sowId, fromStage, "reject", comment);
}

export async function returnSowToDraft(
  sowId: string,
  comment: string,
): Promise<TransitionEnvelope> {
  return decideStageReal(sowId, "platform", "reject", comment);
}
