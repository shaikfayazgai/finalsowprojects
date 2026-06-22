/**
 * Real mentor queue API client.
 *
 * Calls the Next.js proxy routes under /api/mentor/... which forward to the
 * Glimmora gateway at http://127.0.0.1:9000 with the session bearer token
 * auto-injected by proxyToBackendService.
 *
 * Backend shape (from /api/mentor/queue):
 *   { success, data: { items: BackendQueueItem[], page, page_size, total } }
 *
 * Backend shape (from /api/mentor/queue/{id}):
 *   { success, data: { id, title, submission_type, contributor_name, priority,
 *                      status, decision, score, mentee_id, payload, comments,
 *                      created_at, updated_at, decided_at, notes } }
 *
 * The mapper converts these to MockReview so existing components need zero
 * changes to their rendering logic.
 */

import { fetchInternal } from "@/lib/api/client";
import type {
  MockReview,
  MockContributorDecision,
  MockRubricCriterion,
  MockEvidenceFile,
  SlaTier,
} from "@/mocks/mentor";
import type { ReviewDraftPayload } from "@/lib/mentor/runtime-store";

// ── Types from the real backend ──────────────────────────────────────────────

interface BackendQueueItem {
  id: number;
  title: string;
  submission_type?: string;
  contributor_name?: string;
  priority?: "urgent" | "high" | "normal" | "low";
  status?: string;
  decision?: string | null;
  score?: number | null;
  mentee_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BackendReviewDetail extends BackendQueueItem {
  payload?: Record<string, unknown> | null;
  comments?: string | null;
  decided_at?: string | null;
  mentor_id?: string;
  notes?: BackendNote[];
}

interface BackendNote {
  id: number;
  body: string;
  attachments?: unknown[];
  created_at?: string;
}

interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

// ── Error class ──────────────────────────────────────────────────────────────

export class MentorQueueError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "MentorQueueError";
  }
}

// ── SLA helpers ──────────────────────────────────────────────────────────────

function computeSlaTier(createdAt: string, priority: string): { tier: SlaTier; dueAt: string } {
  const slaHours: Record<string, number> = {
    urgent: 4,
    high: 12,
    normal: 48,
    low: 96,
  };
  const hours = slaHours[priority] ?? 48;
  const created = new Date(createdAt).getTime();
  const dueMs = created + hours * 3_600_000;
  const remaining = dueMs - Date.now();

  let tier: SlaTier;
  if (remaining < 0) tier = "breached";
  else if (remaining < 2 * 3_600_000) tier = "critical";
  else if (remaining < 6 * 3_600_000) tier = "warning";
  else if (remaining < 24 * 3_600_000) tier = "watch";
  else tier = "healthy";

  return { tier, dueAt: new Date(dueMs).toISOString() };
}

// ── Mapper: BackendQueueItem → MockReview (list shape) ───────────────────────

function mapQueueItem(item: BackendQueueItem): MockReview {
  const priority = item.priority ?? "normal";
  const createdAt = item.created_at ?? new Date().toISOString();
  const { tier, dueAt } = computeSlaTier(createdAt, priority);

  return {
    id: String(item.id),
    taskId: item.mentee_id ? `task-${item.mentee_id}` : `task-${item.id}`,
    taskTitle: item.title ?? "Untitled review",
    taskSubtitle: item.submission_type ?? "",
    contributorId: item.mentee_id ?? String(item.id),
    contributorName: item.contributor_name ?? "Contributor",
    contributorTrack: undefined,
    project: item.submission_type ?? "Review",
    tenant: "",
    skills: [],
    round: 1,
    totalRounds: 1,
    stage: "single",
    submittedAt: createdAt,
    dueAt,
    slaTier: tier,
    flag: null,
    brief: "",
    evidence: [],
    criteria: [],
    state: mapStatus(item.status ?? "pending"),
    aiOverallConfidence: 0,
    riskFlags: [],
    references: [],
  };
}

// ── Mapper: BackendReviewDetail → MockReview (detail shape) ──────────────────

function mapDetailItem(item: BackendReviewDetail): MockReview {
  const base = mapQueueItem(item);
  const payload = (item.payload ?? {}) as Record<string, unknown>;

  // Extract richer fields from payload if the contributor service stored them
  const brief =
    typeof payload.brief === "string"
      ? payload.brief
      : typeof payload.description === "string"
        ? payload.description
        : typeof payload.summary === "string"
          ? payload.summary
          : "";

  const skills: string[] = Array.isArray(payload.skills)
    ? (payload.skills as string[])
    : Array.isArray(payload.requiredSkills)
      ? (payload.requiredSkills as string[])
      : [];

  const rawEvidence = Array.isArray(payload.evidence) ? payload.evidence : [];
  const evidence: MockEvidenceFile[] = rawEvidence.map((e, i) => {
    const ev = (e ?? {}) as Record<string, unknown>;
    return {
      id: String(ev.id ?? i),
      name: String(ev.name ?? `file-${i + 1}`),
      kind: (ev.kind ?? ev.type ?? "doc") as MockEvidenceFile["kind"],
      sizeBytes: Number(ev.sizeBytes ?? ev.size ?? 0),
      url: typeof ev.url === "string" ? ev.url : undefined,
    };
  });

  const rawCriteria = Array.isArray(payload.criteria) ? payload.criteria : [];
  const criteria: MockRubricCriterion[] = rawCriteria.map((c, i) => {
    const cr = (c ?? {}) as Record<string, unknown>;
    return {
      id: String(cr.id ?? i),
      label: String(cr.label ?? cr.name ?? `Criterion ${i + 1}`),
      aiSuggestion: (cr.aiSuggestion as 1 | 2 | 3 | 4 | 5 | null) ?? null,
      aiConfidence: typeof cr.aiConfidence === "number" ? cr.aiConfidence : null,
      aiSource: String(cr.aiSource ?? ""),
      isCoverageGap: Boolean(cr.isCoverageGap),
    };
  });

  const coverNote = typeof payload.coverNote === "string" ? payload.coverNote : undefined;
  const projectName =
    typeof payload.projectName === "string"
      ? payload.projectName
      : typeof payload.project === "string"
        ? payload.project
        : item.submission_type ?? "Review";

  return {
    ...base,
    brief,
    evidence,
    criteria,
    coverNote,
    skills,
    project: projectName,
    round: typeof payload.round === "number" ? payload.round : 1,
    totalRounds: typeof payload.totalRounds === "number" ? payload.totalRounds : 1,
    stage:
      payload.stage === "two_stage" ? "two_stage" : "single",
    flag: null,
    aiOverallConfidence:
      typeof payload.aiOverallConfidence === "number" ? payload.aiOverallConfidence : 0,
    riskFlags: Array.isArray(payload.riskFlags)
      ? (payload.riskFlags as string[])
      : [],
    references: Array.isArray(payload.references)
      ? (payload.references as Array<{ label: string; url: string }>)
      : [],
  };
}

function mapStatus(s: string): MockReview["state"] {
  if (s === "accepted") return "decided_accept";
  if (s === "rework") return "decided_rework";
  if (s === "escalated") return "decided_reject";
  return "open";
}

// ── Public API ────────────────────────────────────────────────────────────────

async function rpc<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchInternal(path, { ...init, cache: "no-store" } as RequestInit);
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string; detail?: string };
      msg = body.error ?? body.message ?? body.detail ?? msg;
    } catch {
      // ignore
    }
    throw new MentorQueueError(res.status, msg);
  }
  const wrapper = (await res.json()) as BackendResponse<T>;
  // The backend wraps in { success, data } — unwrap it.
  // If the response is flat (not wrapped), return as-is.
  if (wrapper && typeof wrapper === "object" && "data" in wrapper) {
    return wrapper.data as T;
  }
  return wrapper as unknown as T;
}

export interface RealQueueListResponse {
  items: MockReview[];
  total: number;
}

export interface RealReviewDetailResponse {
  review: MockReview;
  contributorDecisions: MockContributorDecision[];
  draft?: ReviewDraftPayload;
}

export async function fetchRealMentorQueue(
  signal?: AbortSignal,
): Promise<RealQueueListResponse> {
  const data = await rpc<{ items: BackendQueueItem[]; total: number }>(
    "/api/mentor/queue",
    { signal },
  );
  const items = (data.items ?? []).map(mapQueueItem);
  return { items, total: data.total ?? items.length };
}

export async function fetchRealMentorSubmission(
  id: string,
  signal?: AbortSignal,
): Promise<RealReviewDetailResponse> {
  const data = await rpc<BackendReviewDetail>(
    `/api/mentor/queue/${encodeURIComponent(id)}`,
    { signal },
  );
  const review = mapDetailItem(data);
  return { review, contributorDecisions: [] };
}

export async function claimRealSubmission(id: string): Promise<void> {
  // The real backend doesn't have a separate /claim endpoint;
  // opening a review effectively claims it via mentor_id update on decision.
  // No-op from FE side — claim is implicit.
  void id;
}

export async function releaseRealSubmission(id: string): Promise<void> {
  // No dedicated /release endpoint on real backend; no-op.
  void id;
}

export async function decideRealSubmission(
  id: string,
  body: {
    decision: "accept" | "rework" | "escalate";
    score?: number;
    comments?: string;
  },
): Promise<void> {
  await rpc<unknown>(`/api/mentor/queue/${encodeURIComponent(id)}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
