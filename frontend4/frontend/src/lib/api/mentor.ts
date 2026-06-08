/**
 * Session-aware mentor API client (real routes under /api/mentor/*).
 */

import { fetchInternal } from "@/lib/api/client";
import type { MentorProfile, MentorRole } from "@/mocks/mentor/personas";
import type { ReviewDraftPayload } from "@/lib/mentor/runtime-store";

export interface MentorMeResponse {
  profile: MentorProfile;
  role: MentorRole;
  isSeniorOrLead: boolean;
  onboardingComplete: boolean;
}

export async function fetchMentorMe(demoRole?: string | null): Promise<MentorMeResponse> {
  const qs = demoRole ? `?role=${encodeURIComponent(demoRole)}` : "";
  const res = await fetchInternal(`/api/mentor/me${qs}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Could not load mentor profile (${res.status})`);
  }
  return res.json() as Promise<MentorMeResponse>;
}

export async function completeMentorOnboarding(): Promise<void> {
  const res = await fetchInternal("/api/mentor/me", { method: "POST" });
  if (!res.ok) throw new Error("Could not complete onboarding.");
}

export async function patchMentorProfile(payload: {
  bio?: string;
  mentorshipIntro?: string;
  languages?: string[];
  timezone?: string;
}): Promise<void> {
  const res = await fetchInternal("/api/mentor/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Could not save profile.");
}

export async function patchMentorAvailability(payload: Record<string, unknown>): Promise<void> {
  const res = await fetchInternal("/api/mentor/settings/availability", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Could not save availability.");
}

export async function patchMentorNotificationPrefs(payload: {
  rows: Array<{ key: string; prefs: { inApp: boolean; email: boolean; sms: boolean } }>;
}): Promise<void> {
  const res = await fetchInternal("/api/mentor/settings/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Could not save notification preferences.");
}

export async function submitMentorReviewDecision(
  reviewId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const res = await fetchInternal(`/api/mentor/reviews/${encodeURIComponent(reviewId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not submit decision.");
  }
}

export async function saveMentorReviewDraft(
  reviewId: string,
  payload: ReviewDraftPayload,
): Promise<void> {
  const res = await fetchInternal(`/api/mentor/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Could not save draft.");
}

// ── Backend proxy (real submission queue — not yet used by mock UI) ────────

export interface MentorQueueParams {
  status?: string;
  limit?: number;
}

export async function listMentorQueue(params: MentorQueueParams = {}): Promise<unknown> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.limit != null) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetchInternal(`/api/mentor/queue${suffix}`);
  if (!res.ok) throw new Error(`Could not load mentor queue (${res.status})`);
  return res.json();
}

export interface MentorDashboardStats {
  pending_reviews: number;
  completed_reviews: number;
  total_reviews: number;
  mentees: number;
  escalations: number;
}
export interface MentorDashboardQueueItem {
  id: number;
  title: string;
  submission_type?: string | null;
  contributor_name?: string | null;
  priority?: string | null;
  status: string;
  created_at?: string | null;
}
export interface MentorDashboardReal {
  stats: MentorDashboardStats;
  recent_queue: MentorDashboardQueueItem[];
}

/** Real per-mentor dashboard (counts + recent queue, scoped to this mentor's
 * account id). No mock/demo data. */
export async function fetchMentorDashboardReal(): Promise<MentorDashboardReal> {
  const res = await fetchInternal("/api/mentor/dashboard");
  if (!res.ok) throw new Error(`Could not load mentor dashboard (${res.status})`);
  const raw = (await res.json()) as { data?: MentorDashboardReal } | MentorDashboardReal;
  const data = (raw as { data?: MentorDashboardReal }).data ?? (raw as MentorDashboardReal);
  return {
    stats: data.stats ?? { pending_reviews: 0, completed_reviews: 0, total_reviews: 0, mentees: 0, escalations: 0 },
    recent_queue: Array.isArray(data.recent_queue) ? data.recent_queue : [],
  };
}

export interface MentorSowTask {
  id: string;
  title: string;
  milestone?: string | null;
  status: string;
  assignee: string;
  effortHours?: number | null;
  skills: string[];
}

/** Decomposed tasks (+ status) for a SOW assigned to the mentor. No payout. */
export async function getMentorSowTasks(sowId: string): Promise<MentorSowTask[]> {
  const res = await fetchInternal(`/api/mentor/sow/${encodeURIComponent(sowId)}/tasks`);
  if (!res.ok) throw new Error(`Could not load SOW tasks (${res.status})`);
  const body = (await res.json()) as { data?: { tasks?: MentorSowTask[] } };
  return body.data?.tasks ?? [];
}

export async function getMentorSubmission(submissionId: string): Promise<unknown> {
  const res = await fetchInternal(
    `/api/mentor/submissions/${encodeURIComponent(submissionId)}`,
  );
  if (!res.ok) throw new Error(`Could not load submission (${res.status})`);
  return res.json();
}

export async function claimSubmission(submissionId: string): Promise<unknown> {
  const res = await fetchInternal(
    `/api/mentor/submissions/${encodeURIComponent(submissionId)}/claim`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Could not claim submission (${res.status})`);
  return res.json();
}

export async function releaseSubmission(submissionId: string): Promise<unknown> {
  const res = await fetchInternal(
    `/api/mentor/submissions/${encodeURIComponent(submissionId)}/release`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Could not release submission (${res.status})`);
  return res.json();
}

export async function decideSubmission(
  submissionId: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetchInternal(
    `/api/mentor/submissions/${encodeURIComponent(submissionId)}/decide`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`Could not submit decision (${res.status})`);
  return res.json();
}
