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

// Real reviewer backend (proxied, session-authenticated) vs the in-memory mock.
// Defaults to the real API; set NEXT_PUBLIC_REVIEWER_USE_MOCK=true to force mocks.
const LIVE_BASE = "/api/reviewer";
const MOCK_BASE = "/api/mock/reviewer";
const FORCE_MOCK = process.env.NEXT_PUBLIC_REVIEWER_USE_MOCK === "true";

export class ReviewerApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ReviewerApiError";
  }
}

async function fetchFrom<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const body = (await res.json()) as { error?: string }; if (body.error) msg = body.error; } catch { /* ignore */ }
    throw new ReviewerApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  if (FORCE_MOCK) return fetchFrom<T>(MOCK_BASE, path, init);
  try {
    return await fetchFrom<T>(LIVE_BASE, path, init);
  } catch (err) {
    // Only fall back to the mock when the backend itself is unavailable
    // (503) — never on auth/validation/not-found, which are real responses.
    if (err instanceof ReviewerApiError && err.status === 503) {
      return fetchFrom<T>(MOCK_BASE, path, init);
    }
    throw err;
  }
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

// ── Notifications ─────────────────────────────────────────────────────────

export interface ReviewerNotification {
  id: string;
  title: string;
  body: string;
  kind: "sla" | "assignment" | "decision";
  read: boolean;
  at: string;
}
export interface NotificationsResponse {
  items: ReviewerNotification[];
  total: number;
  unread: number;
}

export function fetchReviewerNotifications(signal?: AbortSignal): Promise<NotificationsResponse> {
  return getJSON<NotificationsResponse>("/notifications", { signal });
}

// ── Profile ───────────────────────────────────────────────────────────────

export interface ReviewerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  title: string;
  tenantId: string | null;
  workspace: string;
  joinedAt: string | null;
  stats: { total: number; pending: number; completed: number };
}

export function fetchReviewerProfile(signal?: AbortSignal): Promise<ReviewerProfile> {
  return getJSON<ReviewerProfile>("/profile", { signal });
}
