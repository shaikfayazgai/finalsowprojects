/**
 * REAL backend client for the mentor review queue + detail.
 *
 * Replaces the mock reads (mentor-mock.ts) for the queue and submission detail.
 * Proxies through /api/mentor/* → the mentor backend (8101, /api/v1/mentor/*),
 * which returns raw mentor_reviews rows wrapped as { success, data }. We map
 * those into the MockReview shape the existing UI renders, defaulting the rich
 * fields (rubric/evidence) the backend doesn't store yet to safe empties.
 *
 * Same function signatures as mentor-mock so pages import-swap cleanly.
 * Decisions are submitted via the real decideSubmission path (see mentor.ts).
 */

import type {
  MockReview,
  MockContributorDecision,
  ReviewState,
  SlaTier,
} from "@/mocks/mentor";

const BASE = "/api/mentor";

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
    try {
      const body = (await res.json()) as { error?: string; detail?: string; message?: string };
      msg = body.error || body.detail || body.message || msg;
    } catch {
      /* ignore */
    }
    throw new MentorApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function slaFrom(dueAt: string): SlaTier {
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms < 0) return "breached";
  if (ms < 4 * 3_600_000) return "critical";
  if (ms < 12 * 3_600_000) return "warning";
  if (ms < 24 * 3_600_000) return "watch";
  return "healthy";
}

const STATE_BY_STATUS: Record<string, ReviewState> = {
  pending: "open",
  in_review: "open",
  escalated: "open",
  accepted: "decided_accept",
  rework: "decided_rework",
  rejected: "decided_reject",
  withdrawn: "withdrawn",
};

/** Map a raw mentor_reviews row (snake_case + payload JSONB) → MockReview. */
function toMockReview(row: Record<string, unknown>): MockReview {
  const payload = asObj(row.payload);
  const createdAt = (row.created_at as string) || new Date().toISOString();
  const dueAt =
    (payload.dueAt as string) ||
    new Date(new Date(createdAt).getTime() + 48 * 3_600_000).toISOString();
  const status = String(row.status || "pending");

  // Evidence the mentor can actually open: the GitHub deliverable link first,
  // then every uploaded file (artifact) with its viewable url.
  const githubUrl = (payload.githubUrl ?? payload.url) as string | undefined;
  const rawArtifacts = Array.isArray(payload.artifacts)
    ? (payload.artifacts as Array<Record<string, unknown>>)
    : [];
  const refFiles = Array.isArray(payload.referenceFiles)
    ? (payload.referenceFiles as Array<Record<string, unknown>>)
    : [];
  const evidence = [
    ...(githubUrl
      ? [{ id: "gh", name: "GitHub deliverable", kind: "doc" as const, sizeBytes: 0, url: githubUrl }]
      : []),
    ...rawArtifacts
      .filter((a) => a && a.url)
      .map((a, i) => ({
        id: `art-${i}`,
        name: String(a.name ?? "file"),
        kind: "doc" as const,
        sizeBytes: Number(a.sizeBytes ?? 0),
        url: String(a.url ?? ""),
      })),
    ...refFiles
      .filter((r) => r && r.url)
      .map((r, i) => ({
        id: `ref-${i}`,
        name: "Task file: " + String(r.name ?? "file"),
        kind: "doc" as const,
        sizeBytes: Number(r.sizeBytes ?? 0),
        url: String(r.url ?? ""),
      })),
  ];

  return {
    id: String(row.id),
    taskId: String(payload.canonicalTaskId ?? payload.taskId ?? payload.taskDefinitionId ?? ""),
    taskRef: String(payload.taskRef ?? ""),
    submissionRef: String(payload.submissionRef ?? ""),
    githubUrl: githubUrl ?? null,
    completionPct: payload.completionPct != null ? Number(payload.completionPct) : null,
    acceptanceCriteria: (payload.acceptanceCriteria as string) ?? null,
    taskTitle: String(row.title ?? "Submission"),
    taskSubtitle: String(payload.taskSubtitle ?? ""),
    contributorId: String(row.contributor_id ?? payload.accountId ?? ""),
    contributorName: String(row.contributor_name ?? "Contributor"),
    project: String(payload.project ?? payload.projectName ?? ""),
    tenant: String(payload.tenant ?? ""),
    skills: Array.isArray(payload.skills) ? (payload.skills as string[]) : [],
    round: Number(payload.round ?? 1),
    totalRounds: Number(payload.totalRounds ?? 3),
    stage: payload.twoStage ? "two_stage" : "single",
    submittedAt: (payload.submittedAt as string) || createdAt,
    dueAt,
    slaTier: slaFrom(dueAt),
    flag: null,
    brief: String(payload.description ?? payload.summary ?? payload.body ?? ""),
    evidence,
    criteria: [],
    coverNote: (payload.coverNote as string) ?? (payload.body as string) ?? undefined,
    state: STATE_BY_STATUS[status] ?? "open",
    aiOverallConfidence: 0,
    riskFlags: [],
    references: [],
  };
}

export interface AssignedSow {
  sowId: string;
  title: string;
  status?: string | null;
  ownerEmail?: string | null;
  assignmentStatus?: string | null;
  assignedAt?: string | null;
}

export function fetchAssignedSows(signal?: AbortSignal): Promise<{ sows: AssignedSow[]; total: number }> {
  return getJSON<{ sows: AssignedSow[]; total: number }>("/assigned-sows", { signal });
}

export interface ReviewListResponse { items: MockReview[]; total: number }
export interface ReviewDetailResponse {
  review: MockReview;
  contributorDecisions: MockContributorDecision[];
  draft?: import("@/lib/mentor/runtime-store").ReviewDraftPayload;
  sowId?: string | null;
}

export async function fetchMentorReviews(signal?: AbortSignal): Promise<ReviewListResponse> {
  const body = await getJSON<{ data?: { items?: unknown[]; total?: number } }>("/queue", { signal });
  const items = (body.data?.items ?? []).map((r) => toMockReview(asObj(r)));
  return { items, total: body.data?.total ?? items.length };
}

export async function fetchMentorReview(id: string, signal?: AbortSignal): Promise<ReviewDetailResponse> {
  const body = await getJSON<{ data?: Record<string, unknown> }>(
    `/submissions/${encodeURIComponent(id)}`,
    { signal },
  );
  const row = asObj(body.data);
  const sowId = (asObj(row.payload).sowId as string | undefined) ?? null;
  return { review: toMockReview(row), contributorDecisions: [], draft: undefined, sowId };
}
