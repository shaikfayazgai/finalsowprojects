/**
 * Mock-backend client for the enterprise reviewer sub-portal.
 *
 * Same pattern as contributor-mock + mentor-mock. Pages call functions
 * here instead of importing from `@/mocks/reviewer` directly so each
 * route can swap to a real backend later without touching components.
 */

import type {
  MockReviewerItem,
  MockReviewerDecision,
} from "@/mocks/reviewer";

const BASE = "/api/mock/reviewer";

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
    try { const body = (await res.json()) as { error?: string }; if (body.error) msg = body.error; } catch { /* ignore */ }
    throw new ReviewerApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

// ── Dashboard ───────────────────────────────────────────────────────────

export interface DashboardResponse {
  pending: MockReviewerItem[];
  slaRiskCount: number;
  done7d: number;
  avgTimeMin: number;
}

export function fetchReviewerDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  return getJSON<DashboardResponse>("/dashboard", { signal });
}

// ── Queue ───────────────────────────────────────────────────────────────

export interface ReviewListResponse { items: MockReviewerItem[]; total: number }
export interface ReviewDetailResponse { review: MockReviewerItem }

export function fetchReviewerQueue(signal?: AbortSignal): Promise<ReviewListResponse> {
  return getJSON<ReviewListResponse>("/reviews", { signal });
}

export function fetchReviewerReview(id: string, signal?: AbortSignal): Promise<ReviewDetailResponse> {
  return getJSON<ReviewDetailResponse>(`/reviews/${encodeURIComponent(id)}`, { signal });
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
};

export interface DecisionResponse {
  decision: MockReviewerDecision;
}

export function submitReviewerDecision(
  reviewId: string,
  body: ReviewerDecisionPayload,
): Promise<DecisionResponse> {
  return getJSON<DecisionResponse>(`/reviews/${encodeURIComponent(reviewId)}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
