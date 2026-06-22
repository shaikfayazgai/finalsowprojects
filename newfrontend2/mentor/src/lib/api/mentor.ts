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

/** Load the mentor's persisted availability (null if none saved yet). */
export async function fetchMentorAvailability(): Promise<Record<string, unknown> | null> {
  const res = await fetchInternal("/api/mentor/settings/availability", { method: "GET" });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { availability?: Record<string, unknown> | null };
  return data.availability ?? null;
}

/** Load the mentor's persisted notification rows (null if none saved yet). */
export async function fetchMentorNotificationPrefs(): Promise<
  Array<{ key: string; prefs: { inApp: boolean; email: boolean; sms: boolean } }> | null
> {
  const res = await fetchInternal("/api/mentor/settings/notifications", { method: "GET" });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as {
    rows?: Array<{ key: string; prefs: { inApp: boolean; email: boolean; sms: boolean } }> | null;
  };
  return data.rows ?? null;
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
