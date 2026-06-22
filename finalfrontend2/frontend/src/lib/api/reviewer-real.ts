/**
 * Real-backend client for the enterprise reviewer sub-portal.
 *
 * Replaces @/lib/api/reviewer-mock.  Pages/components that previously
 * imported from reviewer-mock should import the same-named functions
 * from here instead.
 *
 * All requests go through our Next.js proxy routes (src/app/api/reviewer/*)
 * which inject the bearer token server-side.
 */

import type {
  MockReviewerItem,
  MockReviewerDecision,
} from "@/mocks/reviewer";

export class ReviewerApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ReviewerApiError";
  }
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; detail?: string };
      if (body.error) msg = body.error;
      else if (body.detail) msg = typeof body.detail === "string" ? body.detail : msg;
    } catch { /* ignore */ }
    throw new ReviewerApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardResponse {
  pending: MockReviewerItem[];
  slaRiskCount: number;
  done7d: number;
  avgTimeMin: number;
}

/** Fetch reviewer dashboard by hitting the queue endpoint and deriving stats. */
export async function fetchReviewerDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  const { items } = await getJSON<{ items: MockReviewerItem[]; total: number }>(
    "/api/reviewer/queue",
    { signal },
  );
  const slaRiskCount = (items ?? []).filter(
    (r) => r.slaTier === "warning" || r.slaTier === "critical" || r.slaTier === "breached",
  ).length;
  return {
    pending: items ?? [],
    slaRiskCount,
    done7d: 0,
    avgTimeMin: 0,
  };
}

// ── Queue ────────────────────────────────────────────────────────────────────

export interface ReviewListResponse { items: MockReviewerItem[]; total: number }
export interface ReviewDetailResponse { review: MockReviewerItem }

export function fetchReviewerQueue(signal?: AbortSignal): Promise<ReviewListResponse> {
  return getJSON<ReviewListResponse>("/api/reviewer/queue", { signal });
}

export function fetchReviewerReview(id: string, signal?: AbortSignal): Promise<ReviewDetailResponse> {
  return getJSON<ReviewDetailResponse>(`/api/reviewer/queue/${encodeURIComponent(id)}`, { signal });
}

// ── History / metrics ────────────────────────────────────────────────────────

export interface ReviewerMetrics {
  periodDays: number;
  reviewCount: number;
  avgTimeMin: number;
  slaHitPct: number;
  acceptPct: number;
  agreementWithMentorPct: number;
  decisionsByKind: { accept: number; rework: number; reject: number };
}

export interface HistoryResponse {
  items: MockReviewerDecision[];
  total: number;
  metrics: ReviewerMetrics;
}

export function fetchReviewerHistory(signal?: AbortSignal): Promise<HistoryResponse> {
  return getJSON<HistoryResponse>("/api/reviewer/history", { signal });
}

// ── Decisions ────────────────────────────────────────────────────────────────

export type ReviewerDecisionPayload = {
  decision: "accept" | "rework" | "reject";
  comment?: string;
};

export interface DecisionResponse {
  decision: MockReviewerDecision;
}

export async function submitReviewerDecision(
  reviewId: string,
  body: ReviewerDecisionPayload,
): Promise<DecisionResponse> {
  const res = await fetch(`/api/reviewer/assignments/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const errBody = (await res.json()) as { error?: string; detail?: string };
      if (errBody.error) msg = errBody.error;
      else if (errBody.detail) msg = typeof errBody.detail === "string" ? errBody.detail : msg;
    } catch { /* ignore */ }
    throw new ReviewerApiError(res.status, msg);
  }
  const data = (await res.json()) as { assignment?: unknown };
  // Normalise: backend returns { assignment } but component expects { decision }
  return {
    decision: {
      id: `rdec-${reviewId}-${Date.now()}`,
      reviewId,
      taskTitle: "",
      contributorName: "",
      mentorName: "",
      project: "",
      decision: body.decision,
      agreedWithMentor: true,
      decidedAt: new Date().toISOString(),
      comment: body.comment,
    } satisfies MockReviewerDecision,
  };
}
