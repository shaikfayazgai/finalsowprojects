/**
 * Enterprise review-queue mock — 12+ submissions awaiting final
 * enterprise sign-off after mentor approval.
 *
 * Backend handoff:
 *   GET  /api/enterprise/review-queue?mine=&includeClaimed=&limit=
 *                                          → { items: EnterpriseReviewQueueItem[] }
 *   POST /api/enterprise/review-queue/:id/claim   → { item }
 *   POST /api/enterprise/review-queue/:id/release → { released: true }
 *   POST /api/enterprise/review-queue/:id/decide  { decision, note, deciderInitials }
 *                                          → { result: EnterpriseDecisionResult }
 */

import type {
  EnterpriseDecision,
  EnterpriseDecisionResult,
  EnterpriseReviewQueueItem,
} from "@/lib/enterprise-review/types";
import { applyOverlay, createOverlayStore } from "./overlay";

const OWNER = "";

function iso(daysAgo: number, hours = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hours, 0, 0, 0);
  return d.toISOString();
}

function mk(a: {
  id: string;
  taskId: string;
  title: string;
  contributor: { id: string; name: string };
  acceptedDaysAgo: number;
  mentorId?: string;
  claimedById?: string | null;
  artifacts?: number;
}): EnterpriseReviewQueueItem {
  return {
    submissionId: a.id,
    taskDefinitionId: a.taskId,
    taskTitle: a.title,
    contributorId: a.contributor.id,
    contributorName: a.contributor.name,
    version: 1,
    acceptedAt: iso(a.acceptedDaysAgo),
    mentorReviewerId: a.mentorId ?? "mentor-rajesh",
    enterpriseReviewerId: a.claimedById ?? null,
    enterpriseReviewerAssignedAt: a.claimedById ? iso(Math.max(0, a.acceptedDaysAgo - 1)) : null,
    artifactCount: a.artifacts ?? 3,
  };
}

interface DecisionRow {
  submissionId: string;
  decision: EnterpriseDecision;
  decidedAt: string;
  decisionId: string;
  note?: string;
}

export interface EnterpriseReviewHistoryItem extends EnterpriseReviewQueueItem {
  decision: EnterpriseDecision;
  decidedAt: string;
  decisionId: string;
  note?: string | null;
}

const SEED: EnterpriseReviewQueueItem[] = [];

/** Pre-decided submissions for history / billing demo (not in active queue). */
const HISTORY_SEED: EnterpriseReviewHistoryItem[] = [];

const overlay = createOverlayStore<EnterpriseReviewQueueItem>("glimmora.mock.reviews.v1");
const decisionsOverlay = createOverlayStore<DecisionRow>("glimmora.mock.reviewDecisions.v1");

function merged(): EnterpriseReviewQueueItem[] {
  return applyOverlay<EnterpriseReviewQueueItem & { id: string }>(
    SEED.map((s) => ({ ...s, id: s.submissionId })),
    overlay.read() as never,
  ).map(({ id: _id, ...rest }) => rest as EnterpriseReviewQueueItem);
}

function decisions(): DecisionRow[] {
  const o = decisionsOverlay.read();
  return Object.values(o).filter((d) => !d.__deletedAt) as DecisionRow[];
}

export function listReviewHistoryMock(params: { limit?: number } = {}): {
  items: EnterpriseReviewHistoryItem[];
} {
  const runtime = decisions().map((d) => {
    const base = merged().find((i) => i.submissionId === d.submissionId);
    if (!base) return null;
    return { ...base, decision: d.decision, decidedAt: d.decidedAt, decisionId: d.decisionId, note: d.note ?? null };
  }).filter(Boolean) as EnterpriseReviewHistoryItem[];

  const seedIds = new Set(runtime.map((r) => r.submissionId));
  const fromSeed = HISTORY_SEED.filter((h) => !seedIds.has(h.submissionId));

  let items = [...runtime, ...fromSeed].sort(
    (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime(),
  );
  if (params.limit) items = items.slice(0, params.limit);
  return { items };
}

export function getReviewSubmissionMock(
  submissionId: string,
): { item: EnterpriseReviewQueueItem; decided: EnterpriseReviewHistoryItem | null } | null {
  const pending = merged().find(
    (i) => i.submissionId === submissionId || i.taskDefinitionId === submissionId,
  );
  if (pending) {
    const d = decisions().find((x) => x.submissionId === pending.submissionId);
    if (d) {
      return {
        item: pending,
        decided: { ...pending, ...d, note: d.note ?? null },
      };
    }
    return { item: pending, decided: null };
  }
  const hist = listReviewHistoryMock({ limit: 500 }).items.find(
    (h) => h.submissionId === submissionId || h.taskDefinitionId === submissionId,
  );
  if (!hist) return null;
  const { decision: _d, decidedAt: _a, decisionId: _i, note: _n, ...item } = hist;
  return { item, decided: hist };
}

export function listReviewQueueMock(params: {
  mine?: boolean;
  includeClaimed?: boolean;
  limit?: number;
} = {}): { items: EnterpriseReviewQueueItem[] } {
  const decided = new Set(decisions().map((d) => d.submissionId));
  let items = merged().filter((i) => !decided.has(i.submissionId));
  if (params.mine) items = items.filter((i) => i.enterpriseReviewerId === OWNER);
  if (!params.includeClaimed) items = items.filter((i) => !i.enterpriseReviewerId || i.enterpriseReviewerId === OWNER);
  items.sort((a, b) => new Date(a.acceptedAt).getTime() - new Date(b.acceptedAt).getTime());
  if (params.limit) items = items.slice(0, params.limit);
  return { items };
}

export function claimReviewMock(submissionId: string) {
  const item = merged().find((i) => i.submissionId === submissionId);
  if (!item) throw new Error(`Review ${submissionId} not found`);
  const next = { ...item, enterpriseReviewerId: OWNER, enterpriseReviewerAssignedAt: new Date().toISOString() };
  overlay.patch(submissionId, next as never);
  return { item: next };
}

export function releaseReviewMock(submissionId: string) {
  const item = merged().find((i) => i.submissionId === submissionId);
  if (!item) throw new Error(`Review ${submissionId} not found`);
  overlay.patch(submissionId, { enterpriseReviewerId: null, enterpriseReviewerAssignedAt: null } as never);
  return { released: true as const };
}

export function decideReviewMock(
  submissionId: string,
  body: { decision: EnterpriseDecision; note?: string; deciderInitials?: string },
): { result: EnterpriseDecisionResult } {
  const decidedAt = new Date().toISOString();
  const decisionId = `dec-${Date.now().toString(36)}`;
  decisionsOverlay.insert(submissionId, { submissionId, decision: body.decision, decidedAt, decisionId, note: body.note });
  return {
    result: { submissionId, decision: body.decision, decidedAt, decisionId },
  };
}

export { overlay as reviewOverlay, decisionsOverlay };
