import { apiCall } from "./client";

/**
 * Mentor portal API client → mentor-service (proxied via /api/mentor/*).
 * The backend wraps payloads as { success, message, data }; these helpers
 * unwrap `data` so pages get the bare object/array.
 */

export interface QueueItem {
  id: number; title: string; submission_type: string; contributor_name?: string;
  priority: string; status: string; decision?: string | null; score?: number | null;
  mentee_id?: number; created_at?: string; updated_at?: string;
}
export interface MentorStats {
  pending_reviews: number; completed_reviews: number; total_reviews: number;
  mentees: number; escalations: number;
}
export interface Mentee { id: number; name: string; [k: string]: unknown }
export interface Escalation { id: number; [k: string]: unknown }

async function unwrap<T>(p: Promise<{ data?: T } | T>): Promise<T> {
  const r = (await p) as { data?: T };
  return (r && typeof r === "object" && "data" in r ? r.data : r) as T;
}

export function fetchMentorDashboard(token: string) {
  return unwrap<{ stats: MentorStats; recent_queue: QueueItem[] }>(
    apiCall("/api/mentor/dashboard", { method: "GET", token }));
}
export function fetchMentorQueue(token: string) {
  return unwrap<{ items: QueueItem[] }>(apiCall("/api/mentor/queue", { method: "GET", token }));
}
export function fetchReview(token: string, reviewId: number | string) {
  return unwrap<QueueItem>(apiCall(`/api/mentor/queue/${reviewId}`, { method: "GET", token }));
}
export function decideReview(token: string, reviewId: number | string, body: { decision: string; score?: number; feedback?: string }) {
  // Backend DecisionRequest expects `comments` (not `feedback`).
  const payload = { decision: body.decision, score: body.score, comments: body.feedback };
  return unwrap(apiCall(`/api/mentor/queue/${reviewId}/decision`, { method: "POST", token, body: JSON.stringify(payload) }));
}
export function fetchMentorHistory(token: string) {
  return unwrap<{ items: QueueItem[] }>(apiCall("/api/mentor/history", { method: "GET", token }));
}
export function fetchMentees(token: string) {
  return unwrap<{ items: Mentee[] }>(apiCall("/api/mentor/mentorship", { method: "GET", token }));
}
export function fetchEscalations(token: string) {
  return unwrap<{ items: Escalation[] }>(apiCall("/api/mentor/escalation", { method: "GET", token }));
}
export function fetchMentorProfile(token: string) {
  return unwrap<Record<string, unknown>>(apiCall("/api/mentor/profile", { method: "GET", token }));
}
export function fetchMentorSettings(token: string) {
  return unwrap<Record<string, unknown>>(apiCall("/api/mentor/settings", { method: "GET", token }));
}
export function updateMentorSettings(token: string, body: Record<string, unknown>) {
  return unwrap(apiCall("/api/mentor/settings", { method: "PATCH", token, body: JSON.stringify(body) }));
}
