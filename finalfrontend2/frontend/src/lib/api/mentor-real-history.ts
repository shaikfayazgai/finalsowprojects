/**
 * Real-backend client for mentor history + escalation pages.
 *
 * All fetches hit Next.js /api/mentor/* proxy routes which inject the session
 * bearer token automatically via proxyToBackendService.
 *
 * The backend returns { success, data: { items, total } }; we unwrap and map
 * to the shapes the page components already rely on.
 */

import type { MockMentorDecision } from "@/mocks/mentor/decisions";
import type { MockEscalation } from "@/mocks/mentor/escalations";

// ── types ─────────────────────────────────────────────────────────────────

/** Concrete metrics shape (mirrors MOCK_MENTOR_METRICS structure). */
export interface MentorMetrics {
  periodDays: number;
  reviewCount: number;
  avgTimeMin: number;
  slaHitPct: number;
  acceptPct: number;
  decisionsByKind: { accept: number; rework: number; reject: number };
  aiAlignment: { tookAsIs: number; modified: number; overrode: number };
  coachingNotesWritten: number;
}

/** Shape returned by backend for a single mentor_reviews row (history). */
interface BackendHistoryItem {
  id: number | string;
  title?: string;
  contributor_name?: string;
  decision?: string;
  score?: number | null;
  comments?: string | null;
  status?: string;
  decided_at?: string | null;
  created_at?: string;
  submission_type?: string;
  mentee_id?: number | string | null;
  // notes is present in queue/{id} detail only
  notes?: BackendNote[];
  payload?: Record<string, unknown> | null;
}

interface BackendNote {
  id: number;
  body: string;
  attachments?: unknown;
  created_at: string;
}

/** Shape returned by backend for a single mentor_escalations row. */
interface BackendEscalationItem {
  id: number | string;
  subject?: string;
  category?: string;
  priority?: string;
  status?: string;
  review_id?: number | string | null;
  mentee_id?: number | string | null;
  assignee?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
  mentor_id?: string;
  mentor_email?: string;
}

interface BackendEnvelope<T> {
  success?: boolean;
  data?: T;
  // Some routes return data at the top level (not wrapped)
  items?: unknown;
  total?: unknown;
}

// ── helpers ───────────────────────────────────────────────────────────────

export class MentorHistoryApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "MentorHistoryApiError";
  }
}

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch { /* ignore */ }
    throw new MentorHistoryApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

function unwrapItems<T>(raw: BackendEnvelope<{ items?: T[]; total?: number }>): T[] {
  // Backend wraps in { success, data: { items, total } }
  if (raw.data && Array.isArray((raw.data as { items?: unknown }).items)) {
    return (raw.data as { items: T[] }).items;
  }
  // Fallback for top-level items
  if (Array.isArray(raw.items)) return raw.items as T[];
  return [];
}

/** Map backend decision string → component's MentorDecisionKind. */
function mapDecision(d: string | undefined): MockMentorDecision["decision"] {
  if (d === "accept" || d === "rework" || d === "reject" || d === "withdrawn") return d;
  if (d === "escalate" || d === "escalated") return "rework"; // escalated reviews shown as rework
  return "rework";
}

/** Map backend score/comments to confidence. */
function mapConfidence(score: number | null | undefined): MockMentorDecision["reviewerConfidence"] {
  if (score == null) return "comfortable";
  if (score >= 4) return "confident";
  if (score >= 3) return "comfortable";
  return "tentative";
}

// ── mappers ───────────────────────────────────────────────────────────────

export function mapHistoryItem(item: BackendHistoryItem): MockMentorDecision {
  const decision = mapDecision(item.decision);
  return {
    id: String(item.id),
    reviewId: String(item.id),
    taskTitle: item.title ?? "Untitled review",
    contributorId: String(item.mentee_id ?? ""),
    contributorName: item.contributor_name ?? "Unknown",
    project: item.submission_type ?? "",
    round: 1,
    totalRounds: 1,
    decision,
    decidedAt: item.decided_at ?? item.created_at ?? new Date().toISOString(),
    reviewerConfidence: mapConfidence(item.score ?? null),
    finalComment: decision === "accept" ? (item.comments ?? undefined) : undefined,
    rejectReason: decision === "reject" ? (item.comments ?? undefined) : undefined,
    reworkCorrections:
      decision === "rework" && item.comments
        ? [item.comments]
        : undefined,
    rubricOverall: item.score ?? undefined,
    aiAlignment: "modified", // backend does not track this yet
  };
}

export function mapEscalationItem(item: BackendEscalationItem): MockEscalation {
  const statusRaw = item.status ?? "open";
  let status: MockEscalation["status"] = "open";
  if (statusRaw === "resolved" || statusRaw === "closed") status = "resolved";
  else if (statusRaw === "in_progress") status = "in_review";
  else if (statusRaw === "assigned") status = "assigned";

  const categoryRaw = item.category ?? "quality";
  let type: MockEscalation["type"] = "conflict";
  if (categoryRaw === "dispute") type = "dispute";
  else if (categoryRaw === "sla" || categoryRaw === "sla_breach") type = "sla_breach";
  else if (categoryRaw === "plagiarism") type = "plagiarism";
  else if (categoryRaw === "conflict") type = "conflict";

  const priorityRaw = item.priority ?? "normal";
  let severity: MockEscalation["severity"] = "medium";
  if (priorityRaw === "critical") severity = "critical";
  else if (priorityRaw === "high" || priorityRaw === "urgent") severity = "high";
  else if (priorityRaw === "low") severity = "low";

  return {
    id: String(item.id),
    type,
    severity,
    status,
    openedAt: item.created_at ?? new Date().toISOString(),
    resolvedAt: item.resolved_at ?? undefined,
    assignedTo: item.assignee ?? undefined,
    taskTitle: item.subject ?? "Escalation",
    contributorName: "Contributor",
    contributorId: String(item.mentee_id ?? ""),
    project: "",
    originalMentorName: item.mentor_email ?? "Mentor",
    originalDecision: "reject",
    originalDecisionAt: item.created_at ?? new Date().toISOString(),
    rejectReason: item.description ?? undefined,
    contributorDispute: undefined,
  };
}

// ── API functions ─────────────────────────────────────────────────────────

function deriveMetrics(items: MockMentorDecision[]): MentorMetrics {
  const last30 = items.filter(
    (d) => new Date(d.decidedAt).getTime() > Date.now() - 30 * 86_400_000,
  );
  const accept = last30.filter((d) => d.decision === "accept").length;
  const rework = last30.filter((d) => d.decision === "rework").length;
  const reject = last30.filter((d) => d.decision === "reject").length;
  const total = last30.length;
  return {
    periodDays: 30,
    reviewCount: total,
    avgTimeMin: 20,
    slaHitPct: total === 0 ? 100 : Math.round(((accept + rework) / total) * 100),
    acceptPct: total === 0 ? 0 : Math.round((accept / total) * 100),
    decisionsByKind: { accept, rework, reject },
    aiAlignment: { tookAsIs: 0, modified: total, overrode: 0 },
    coachingNotesWritten: 0,
  };
}

export interface HistoryListResponse {
  items: MockMentorDecision[];
  total: number;
  metrics: MentorMetrics;
}

export async function fetchRealMentorHistory(signal?: AbortSignal): Promise<HistoryListResponse> {
  const raw = await getJSON<BackendEnvelope<{ items: BackendHistoryItem[]; total: number }>>(
    "/api/mentor/history",
    { signal },
  );
  const backendItems = unwrapItems<BackendHistoryItem>(raw);
  const items = backendItems.map(mapHistoryItem);
  return {
    items,
    total: items.length,
    metrics: deriveMetrics(items),
  };
}

export interface HistoryDetailResponse {
  decision: MockMentorDecision;
}

export async function fetchRealMentorDecision(
  id: string,
  signal?: AbortSignal,
): Promise<HistoryDetailResponse> {
  const raw = await getJSON<BackendEnvelope<BackendHistoryItem>>(
    `/api/mentor/history/${encodeURIComponent(id)}`,
    { signal },
  );
  // Queue detail wraps in { success, data: { ...reviewFields, notes } }
  const item = raw.data ?? (raw as unknown as BackendHistoryItem);
  return { decision: mapHistoryItem(item as BackendHistoryItem) };
}

export interface EscalationListResponse {
  items: MockEscalation[];
  total: number;
  metrics: { openCount: number; resolvedLast30: number; avgResolveHours: number };
}

export async function fetchRealMentorEscalations(
  signal?: AbortSignal,
): Promise<EscalationListResponse> {
  const raw = await getJSON<BackendEnvelope<{ items: BackendEscalationItem[]; total: number }>>(
    "/api/mentor/escalation",
    { signal },
  );
  const backendItems = unwrapItems<BackendEscalationItem>(raw);
  const items = backendItems.map(mapEscalationItem);
  const openCount = items.filter(
    (e) => e.status === "open" || e.status === "assigned" || e.status === "in_review",
  ).length;
  const resolvedLast30 = items.filter(
    (e) =>
      e.status === "resolved" &&
      e.resolvedAt &&
      new Date(e.resolvedAt).getTime() > Date.now() - 30 * 86_400_000,
  ).length;
  return {
    items,
    total: items.length,
    metrics: { openCount, resolvedLast30, avgResolveHours: 0 },
  };
}

export interface EscalationDetailResponse {
  escalation: MockEscalation;
}

export async function fetchRealMentorEscalation(
  id: string,
  signal?: AbortSignal,
): Promise<EscalationDetailResponse> {
  const raw = await getJSON<BackendEnvelope<BackendEscalationItem>>(
    `/api/mentor/escalation/${encodeURIComponent(id)}`,
    { signal },
  );
  const item = raw.data ?? (raw as unknown as BackendEscalationItem);
  return { escalation: mapEscalationItem(item as BackendEscalationItem) };
}
