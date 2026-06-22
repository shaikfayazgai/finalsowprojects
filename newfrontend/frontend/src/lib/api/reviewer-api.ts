/**
 * REAL backend client for the enterprise reviewer sub-portal.
 *
 * Replaces reviewer-mock.ts. Proxies through /api/reviewer/* → the reviewer
 * backend (8105, /api/v1/reviewer/*). The backend maps reviewer_assignments
 * rows into the same MockReviewerItem / MockReviewerDecision shapes the UI
 * already renders, so no client-side remapping is needed for reads. Decisions
 * are sent as a PATCH on the assignment (claim + verdict in one call); on
 * approval the backend marks the submission/task complete and creates the
 * contributor's eligible payout.
 *
 * Keeps the exact function signatures of the old mock client so pages/components
 * import-swap without other changes.
 */

import type {
  MockReviewerItem,
  MockReviewerDecision,
} from "@/mocks/reviewer";

const BASE = "/api/reviewer";

export class ReviewerApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ReviewerApiError";
  }
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; detail?: string; message?: string };
      msg = body.error || body.detail || body.message || msg;
    } catch {
      /* ignore */
    }
    throw new ReviewerApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

// ── Dashboard (kept for parity; computed from queue + metrics) ────────────

export interface DashboardResponse {
  pending: MockReviewerItem[];
  slaRiskCount: number;
  done7d: number;
  avgTimeMin: number;
}

export async function fetchReviewerDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  type Metrics = { reviewCount?: number; avgTimeMin?: number };
  const [queue, metrics] = await Promise.all([
    getJSON<ReviewListResponse>("/queue", { signal }),
    getJSON<Metrics>("/metrics", { signal }).catch((): Metrics => ({})),
  ]);
  const pending = queue.items ?? [];
  const slaRiskCount = pending.filter((i) =>
    ["breached", "critical", "warning"].includes(i.slaTier),
  ).length;
  return {
    pending,
    slaRiskCount,
    done7d: metrics.reviewCount ?? 0,
    avgTimeMin: metrics.avgTimeMin ?? 0,
  };
}

// ── Queue ───────────────────────────────────────────────────────────────

export interface AssignedSow {
  sowId: string;
  title: string;
  status?: string | null;
  stage?: string | null;
  ownerEmail?: string | null;
  assignmentStatus?: string | null;
  assignedAt?: string | null;
}

export function fetchAssignedSows(signal?: AbortSignal): Promise<{ sows: AssignedSow[]; total: number }> {
  return getJSON<{ sows: AssignedSow[]; total: number }>("/assigned-sows", { signal });
}

export interface ReviewListResponse { items: MockReviewerItem[]; total: number }
export interface ReviewDetailResponse { review: MockReviewerItem; sowId?: string | null }

export function fetchReviewerQueue(signal?: AbortSignal): Promise<ReviewListResponse> {
  return getJSON<ReviewListResponse>("/queue", { signal });
}

export async function fetchReviewerReview(id: string, signal?: AbortSignal): Promise<ReviewDetailResponse> {
  const body = await getJSON<{ review: MockReviewerItem & { sowId?: string | null } }>(
    `/queue/${encodeURIComponent(id)}`,
    { signal },
  );
  return { review: body.review, sowId: body.review?.sowId ?? null };
}

// ── History / metrics ───────────────────────────────────────────────────

export interface HistoryResponse {
  items: MockReviewerDecision[];
  total: number;
  metrics: typeof import("@/mocks/reviewer").MOCK_REVIEWER_METRICS;
}

export function fetchReviewerHistory(signal?: AbortSignal): Promise<HistoryResponse> {
  return getJSON<HistoryResponse>("/history", { signal });
}

// ── Decisions ───────────────────────────────────────────────────────────

export type ReviewerDecisionPayload = {
  decision: "accept" | "rework" | "reject";
  comment?: string;
  /** Per-dimension QA quality ratings (1–5) + their average, set on accept. */
  ratings?: Record<string, number>;
  ratingOverall?: number;
};

export interface DecisionResponse {
  decision: MockReviewerDecision;
}

const DECISION_STATUS: Record<ReviewerDecisionPayload["decision"], string> = {
  accept: "approved",
  rework: "rework",
  reject: "rejected",
};

export async function submitReviewerDecision(
  reviewId: string,
  body: ReviewerDecisionPayload,
): Promise<DecisionResponse> {
  const res = await getJSON<{ assignment?: { id?: string; updatedAt?: string } }>(
    `/assignments/${encodeURIComponent(reviewId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: DECISION_STATUS[body.decision],
        data: {
          decision: body.decision,
          comment: body.comment ?? null,
          reviewerNote: body.comment ?? null,
          agreedWithMentor: true,
          qaRatings: body.ratings ?? null,
          qaRatingOverall: body.ratingOverall ?? null,
        },
      }),
    },
  );
  // The caller doesn't consume the body; synthesize a minimal decision record
  // so the return type stays stable.
  const decision = {
    id: `rdec-${res.assignment?.id ?? reviewId}`,
    reviewId,
    decision: body.decision,
    decidedAt: res.assignment?.updatedAt ?? new Date().toISOString(),
    comment: body.comment ?? null,
  } as unknown as MockReviewerDecision;
  return { decision };
}
