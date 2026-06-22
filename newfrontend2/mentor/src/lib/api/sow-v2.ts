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
  createSowMock,
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
  return tick(listSowsMock(params));
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
  actorEmail?: string,
): Promise<TransitionEnvelope> {
  if (isEnterpriseStage(stage) && actorEmail) {
    const current = getSowMock(sowId);
    if (current && isSowOwner(actorEmail, current.ownerId)) {
      throw new SowApiError(
        "The SOW owner cannot approve their own SOW's internal gates. The relevant enterprise reviewer must approve.",
        403,
        "forbidden",
        "owner_cannot_sign_off",
      );
    }
  }
  return tick(approveSowMock(sowId, stage, comment, actorEmail ?? MOCK_DEFAULT_ACTOR));
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

export async function returnSowToDraft(
  sowId: string,
  comment: string,
): Promise<TransitionEnvelope> {
  return tick(returnSowToDraftMock(sowId, comment));
}
