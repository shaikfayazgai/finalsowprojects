/**
 * Mock-backend client for the mentor portal.
 *
 * Pages call functions here instead of importing from `@/mocks/mentor`
 * directly. The shape is meant to match what the real Glimmora backend
 * will return so each route can be swapped to the real backend without
 * touching components.
 */

import type {
  MentorProfile,
  MockReview, MockEvidenceFile, MockRubricCriterion, MockContributorDecision,
  MockMentorDecision,
  MockEscalation,
  MockSession,
  MockTeamMember,
  MockMentorNotification,
} from "@/mocks/mentor";

const BASE = "/api/mock/mentor";

export class MentorApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "MentorApiError";
  }
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const body = (await res.json()) as { error?: string }; if (body.error) msg = body.error; } catch { /* ignore */ }
    throw new MentorApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

// ── Identity ─────────────────────────────────────────────────────────────

export interface MeResponse { profile: MentorProfile }

export function fetchMentorMe(role?: string, signal?: AbortSignal): Promise<MeResponse> {
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  return getJSON<MeResponse>(`/me${qs}`, { signal });
}

// ── Dashboard ────────────────────────────────────────────────────────────

export interface DashboardResponse {
  pendingCount: number;
  slaRiskCount: number;
  hero: MockReview | null;
  todaySessions: MockSession[];
  openEscalations: MockEscalation[];
  teamLoad: { poolName: string; members: MockTeamMember[] };
  queueGlance: { pending: number; slaRisk: number; done7d: number; avgTimeMin: number };
}

export function fetchMentorDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
  return getJSON<DashboardResponse>("/dashboard", { signal });
}

// ── Reviews ──────────────────────────────────────────────────────────────

export interface ReviewListResponse { items: MockReview[]; total: number }
export interface ReviewDetailResponse {
  review: MockReview;
  contributorDecisions: MockContributorDecision[];
  draft?: import("@/lib/mentor/runtime-store").ReviewDraftPayload;
}

export function fetchMentorReviews(signal?: AbortSignal): Promise<ReviewListResponse> {
  return getJSON<ReviewListResponse>("/reviews", { signal });
}

export function fetchMentorReview(id: string, signal?: AbortSignal): Promise<ReviewDetailResponse> {
  return getJSON<ReviewDetailResponse>(`/reviews/${encodeURIComponent(id)}`, { signal });
}

// ── Decisions / metrics ──────────────────────────────────────────────────

export interface DecisionListResponse {
  items: MockMentorDecision[];
  total: number;
  metrics: typeof import("@/mocks/mentor").MOCK_MENTOR_METRICS;
}

export interface DecisionDetailResponse { decision: MockMentorDecision }

export function fetchMentorDecisions(signal?: AbortSignal): Promise<DecisionListResponse> {
  return getJSON<DecisionListResponse>("/decisions", { signal });
}

export function fetchMentorDecision(id: string, signal?: AbortSignal): Promise<DecisionDetailResponse> {
  return getJSON<DecisionDetailResponse>(`/decisions/${encodeURIComponent(id)}`, { signal });
}

// ── Escalations ──────────────────────────────────────────────────────────

export interface EscalationListResponse {
  items: MockEscalation[];
  total: number;
  metrics: typeof import("@/mocks/mentor").MOCK_ESCALATION_METRICS;
}

export interface EscalationDetailResponse { escalation: MockEscalation }

export function fetchMentorEscalations(signal?: AbortSignal): Promise<EscalationListResponse> {
  return getJSON<EscalationListResponse>("/escalations", { signal });
}

export function fetchMentorEscalation(id: string, signal?: AbortSignal): Promise<EscalationDetailResponse> {
  return getJSON<EscalationDetailResponse>(`/escalations/${encodeURIComponent(id)}`, { signal });
}

// ── Sessions ─────────────────────────────────────────────────────────────

export interface SessionListResponse { items: MockSession[]; total: number }
export interface SessionDetailResponse { session: MockSession }

export function fetchMentorSessions(signal?: AbortSignal): Promise<SessionListResponse> {
  return getJSON<SessionListResponse>("/sessions", { signal });
}

export function fetchMentorSession(id: string, signal?: AbortSignal): Promise<SessionDetailResponse> {
  return getJSON<SessionDetailResponse>(`/sessions/${encodeURIComponent(id)}`, { signal });
}

// ── Notifications ────────────────────────────────────────────────────────

export interface NotificationListResponse { items: MockMentorNotification[]; total: number }

export function fetchMentorNotifications(signal?: AbortSignal): Promise<NotificationListResponse> {
  return getJSON<NotificationListResponse>("/notifications", { signal });
}

// Re-exports for callers
export type { MockReview, MockEvidenceFile, MockRubricCriterion, MockContributorDecision };
