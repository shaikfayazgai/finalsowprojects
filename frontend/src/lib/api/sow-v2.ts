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

// Map a live enterprise_sows record (from /api/superadmin/sows) into a
// SowSummary the Commercial gate + admin SOW list already render.
interface LiveSow {
  id: string; ownerId?: string; ownerEmail?: string; tenantId?: string;
  source?: string; projectTitle?: string; clientOrganisation?: string;
  status?: string; aiApproved?: boolean; fileName?: string;
  currentStage?: string | null;
  createdAt?: string; updatedAt?: string;
}
function liveToSummary(s: LiveSow): SowSummary {
  // Map the live SOW's real status + current pending stage onto the SowSummary
  // the gate/list render. The Commercial gate shows SOWs with
  // status="approval" AND stage="commercial" — i.e. Business signed, Commercial
  // pending. currentStage comes from the backend (first pending stage).
  const status: SowStatus =
    s.status === "approved" ? "approved"
    : s.status === "rejected" ? "rejected"
    : s.status === "withdrawn" ? "withdrawn"
    : "approval";
  // Only treat as a real SowStage if it's one of the canonical keys.
  const STAGES = ["business", "commercial", "legal", "security", "final"];
  const stage = (status === "approval" && s.currentStage && STAGES.includes(s.currentStage))
    ? (s.currentStage as SowStage)
    : (status === "approval" ? "commercial" : null);
  const now = s.createdAt ?? new Date().toISOString();
  return {
    id: s.id,
    title: s.projectTitle || s.fileName || "Untitled SOW",
    status,
    stage,
    activeVersion: 1,
    ownerId: s.ownerId ?? "",
    ownerName: s.ownerEmail,
    tenantId: s.tenantId ?? undefined,
    tenantName: s.clientOrganisation,
    confidentiality: "internal",
    submittedForApprovalAt: now,
    approvedAt: status === "approved" ? (s.updatedAt ?? now) : null,
    rejectedAt: status === "rejected" ? (s.updatedAt ?? now) : null,
    withdrawnAt: status === "withdrawn" ? (s.updatedAt ?? now) : null,
    archivedAt: null,
    createdAt: now,
    updatedAt: s.updatedAt ?? now,
  };
}

/**
 * List SOWs. Real, enterprise-uploaded SOWs come from the platform endpoint
 * (/api/superadmin/sows) so the Super Admin actually sees them; the demo mock
 * SOWs are merged in underneath so the gate still has sample data. Live SOWs
 * win on id collision and sort to the top.
 */
export async function listSows(params: ListSowsParams = {}): Promise<SowListResult> {
  const mock = listSowsMock(params);
  let live: SowSummary[] = [];
  try {
    const res = await fetch("/api/superadmin/sows", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items?: LiveSow[] };
      live = (data.items ?? []).map(liveToSummary);
      // Apply the same status filter the caller asked for (the gate passes
      // status: "approval"), so live SOWs respect it like the mock list does.
      if (params.status) {
        const wanted = Array.isArray(params.status) ? params.status : [params.status];
        live = live.filter((s) => wanted.includes(s.status));
      }
    }
  } catch {
    // Network/proxy error — fall back to mock only.
  }
  if (live.length === 0) return tick(mock);
  const liveIds = new Set(live.map((s) => s.id));
  const merged = [...live, ...mock.items.filter((m) => !liveIds.has(m.id))];
  return { items: merged, nextCursor: mock.nextCursor };
}

export async function getSow(sowId: string): Promise<SowDetail> {
  const sow = getSowMock(sowId);
  if (!sow) throw new SowApiError(`SOW ${sowId} not found`, 404, "not_found");
  return tick(sow);
}

/* ───────────────────────────── Mutations ────────────────────────── */

export async function createSow(input: CreateSowInput): Promise<SowDetail> {
  return tick(createSowMock(input));
}

export async function updateSowDraft(
  sowId: string,
  input: UpdateSowDraftInput,
): Promise<SowDetail> {
  return tick(updateSowDraftMock(sowId, input));
}

export async function submitSow(sowId: string): Promise<SowDetail> {
  return tick(submitSowMock(sowId));
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
): Promise<TransitionEnvelope> {
  return tick(approveSowMock(sowId, stage, comment));
}

export async function rejectSow(
  sowId: string,
  stage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  return tick(rejectSowMock(sowId, stage, comment));
}

export async function sendBackSow(
  sowId: string,
  fromStage: SowStage,
  toStage: SowStage,
  comment: string,
): Promise<TransitionEnvelope> {
  return tick(sendBackSowMock(sowId, fromStage, toStage, comment));
}
