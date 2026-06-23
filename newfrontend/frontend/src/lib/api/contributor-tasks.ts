/**
 * Contributor task + submission API client (UI1a).
 *
 * Targets the new endpoints landed in this milestone. Distinct from
 * the legacy `contributor.ts` client which calls the external Glimmora
 * backend for the V3 mock UI.
 */

import type {
  SubmissionDetail,
  SubmissionStatus,
  SubmissionSummary,
} from "@/lib/submissions/types";
import {
  acceptDemoTaskAssignment,
  declineDemoTaskAssignment,
  getDemoAssignment,
  listDemoAssignmentsForEmail,
  type DemoTaskAssignment,
} from "@/lib/enterprise/mocks/demo-task-assignments";
import type { TaskPricing } from "@/lib/pricing";
import {
  acceptMockTask,
  createMockDraft,
  declineMockTask,
  getMockContributorTaskDetail,
  isMockTaskId,
  listAssignedMockSummaries,
  MockTaskBridgeError,
  submitMockDraft,
  updateMockDraft,
  getMockSubmissionDetail,
} from "@/lib/contributor/mock-task-bridge";
import { submissionsFromTasks } from "@/lib/api/contributor-task-views";

/* ────────────────────────── Error shape ──────────────────────────── */

export class ContributorApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public issues?: unknown,
  ) {
    super(message);
    this.name = "ContributorApiError";
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let body: { error?: string; code?: string; issues?: unknown } = {};
    try {
      body = await res.json();
    } catch {
      /* noop */
    }
    throw new ContributorApiError(
      body.error ?? res.statusText,
      res.status,
      body.code,
      body.issues,
    );
  }
  return (await res.json()) as T;
}

/* ──────────────────────────── Types ─────────────────────────────── */

export interface ContributorTaskSummary {
  id: string;
  title: string;
  externalKey: string | null;
  status: string;
  requiredSkills: string[];
  estimatedHours: number | null;
  complexity: string | null;
  acceptanceCriteria: string | null;
  agreedRatePerHour: number | null;
  agreedCurrency: string | null;
  /** Contributor take-home pay, set by Glimmora. Net = gross − 18% GST (minor units). */
  payGrossMinor?: number | null;
  payNetMinor?: number | null;
  payCurrency?: string | null;
  /** Typed pricing. When present, preferred over the flat agreed* fields. */
  pricing?: TaskPricing | null;
  assignedAt: string | null;
  acceptedAt: string | null;
  /** Explicit submit-by instant when set (mock / future API); else derived from assignedAt + estimatedHours. */
  submitByAt?: string | null;
  updatedAt: string;
  sow: {
    id: string;
    title: string;
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
  } | null;
  milestone: { id: string; name: string } | null;
  latestSubmission: {
    id: string;
    version: number;
    status: SubmissionStatus;
    submittedAt: string | null;
    decidedAt: string | null;
  } | null;
}

export interface ReferenceFile {
  name?: string;
  url?: string;
  sizeBytes?: number;
}

export interface ContributorTaskDetail extends ContributorTaskSummary {
  description: string | null;
  /** Role-shared task code (T-XXXX) + the canonical decomposition task id. */
  taskRef?: string | null;
  taskId?: string | null;
  /** Live delivery lifecycle stage: submitted | qa_review | revision | completed … */
  deliveryStatus?: string | null;
  /** Reference files the enterprise attached to the task (downloadable). */
  referenceFiles?: ReferenceFile[];
  createdAt: string;
  plan: { id: string; version: number; sow: unknown } | null;
  submissions: SubmissionDetail[];
}

/* ──────────────────────── Demo overlay merge ─────────────────────── */

function demoToSummary(a: DemoTaskAssignment): ContributorTaskSummary {
  return {
    id: a.taskId,
    title: a.title,
    externalKey: a.taskId,
    status: a.status,
    requiredSkills: a.requiredSkills,
    estimatedHours: a.estimatedHours,
    complexity: null,
    acceptanceCriteria: null,
    agreedRatePerHour: a.agreedRatePerHour,
    agreedCurrency: a.agreedCurrency,
    pricing: a.pricing ?? null,
    assignedAt: a.assignedAt,
    acceptedAt: a.acceptedAt ?? null,
    updatedAt: a.acceptedAt ?? a.assignedAt,
    sow: {
      id: a.projectId,
      title: a.projectName,
    },
    milestone: null,
    latestSubmission: null,
  };
}

function demoToDetail(a: DemoTaskAssignment): ContributorTaskDetail {
  const summary = demoToSummary(a);
  return {
    ...summary,
    description: `Assigned from ${a.projectName}. Accept to begin work.`,
    createdAt: a.assignedAt,
    plan: null,
    submissions: [],
  };
}

function mergeDemoTasks(
  items: ContributorTaskSummary[],
  email: string | null | undefined,
  statusFilter?: string | string[],
): ContributorTaskSummary[] {
  if (typeof window === "undefined" || !email) return items;
  const allowed = statusFilter
    ? new Set(Array.isArray(statusFilter) ? statusFilter : [statusFilter])
    : null;
  const demos = listDemoAssignmentsForEmail(email).filter(
    (d) => !allowed || allowed.has(d.status),
  );
  const byId = new Map(items.map((t) => [t.id, t]));
  for (const d of demos) {
    byId.set(d.taskId, demoToSummary(d));
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

/* ──────────────────────── Contributor tasks ─────────────────────── */

export async function listMyTasks(
  params: {
  status?: string | string[];
  limit?: number;
  contributorEmail?: string | null;
} = {},
): Promise<{ items: ContributorTaskSummary[] }> {
  const q = new URLSearchParams();
  if (params.status) {
    const arr = Array.isArray(params.status) ? params.status : [params.status];
    arr.forEach((s) => q.append("status", s));
  }
  if (params.limit) q.set("limit", String(params.limit));
  let items: ContributorTaskSummary[] = [];
  try {
    const res = await fetchJson<{ items: ContributorTaskSummary[] }>(
      `/api/contributor/tasks?${q.toString()}`,
    );
    items = res.items;
  } catch (err) {
    if (
      err instanceof ContributorApiError &&
      (err.status === 401 || err.status >= 500)
    ) {
      items = [];
    } else {
      throw err;
    }
  }
  // Real backend tasks only — no static mock-sample injection on empty. (An
  // empty real contributor sees an honest empty state, not fabricated tasks.)
  const merged = mergeDemoTasks(items, params.contributorEmail, params.status);
  if (params.limit) return { items: merged.slice(0, params.limit) };
  return { items: merged };
}

export async function getTask(taskId: string): Promise<{ task: ContributorTaskDetail }> {
  const demo = typeof window !== "undefined" ? getDemoAssignment(taskId) : undefined;
  if (demo) return { task: demoToDetail(demo) };
  if (isMockTaskId(taskId)) {
    const mock = getMockContributorTaskDetail(taskId);
    if (mock) return { task: mock };
  }
  try {
    return await fetchJson(`/api/contributor/tasks/${taskId}`);
  } catch (err) {
    if (err instanceof ContributorApiError && err.status === 404) {
      const mock = getMockContributorTaskDetail(taskId);
      if (mock) return { task: mock };
    }
    throw err;
  }
}

export async function acceptTask(taskId: string): Promise<{ accepted: true; taskId: string }> {
  const demo = typeof window !== "undefined" ? getDemoAssignment(taskId) : undefined;
  if (demo) {
    const updated = acceptDemoTaskAssignment(taskId);
    if (!updated) {
      throw new ContributorApiError("Task not found", 404, "not_found");
    }
    return { accepted: true, taskId };
  }
  if (isMockTaskId(taskId) && acceptMockTask(taskId)) {
    return { accepted: true, taskId };
  }
  return fetchJson(`/api/contributor/tasks/${taskId}/accept`, {
    method: "POST",
    body: "{}",
  });
}

export type DeclineReason = "skills" | "capacity" | "deadline" | "conflict" | "other";

export async function declineTask(
  taskId: string,
  input: { reason: DeclineReason; note?: string },
): Promise<{ declined: true; taskId: string }> {
  // Marketplace-assigned (demo) task: drop the assignment + reopen the task
  // to the pool so the enterprise can re-select. Previously this fell through
  // to a 404 route and silently stranded the task.
  const demo = typeof window !== "undefined" ? getDemoAssignment(taskId) : undefined;
  if (demo) {
    declineDemoTaskAssignment(taskId);
    return { declined: true, taskId };
  }
  if (isMockTaskId(taskId) && declineMockTask(taskId)) {
    return { declined: true, taskId };
  }
  return fetchJson(`/api/contributor/tasks/${taskId}/decline`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function withdrawSubmission(
  submissionId: string,
): Promise<{ submission: SubmissionDetail }> {
  return fetchJson(`/api/submissions/${submissionId}/withdraw`, {
    method: "POST",
    body: "{}",
  });
}

/* ──────────────────────────── Submissions ───────────────────────── */

export async function createDraft(input: {
  taskDefinitionId: string;
  body?: string;
  payload?: Record<string, unknown>;
}): Promise<{ submission: SubmissionDetail }> {
  if (typeof window !== "undefined" && isMockTaskId(input.taskDefinitionId)) {
    try {
      const submission = createMockDraft(input.taskDefinitionId, input.body);
      if (submission) return { submission };
    } catch (err) {
      throw mapMockBridgeError(err);
    }
  }
  try {
    return await fetchJson(`/api/submissions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (err) {
    if (
      err instanceof ContributorApiError &&
      err.status === 404 &&
      isMockTaskId(input.taskDefinitionId)
    ) {
      try {
        const submission = createMockDraft(input.taskDefinitionId, input.body);
        if (submission) return { submission };
      } catch (mockErr) {
        throw mapMockBridgeError(mockErr);
      }
    }
    throw err;
  }
}

export async function listMySubmissions(params: {
  status?: string | string[];
  taskId?: string;
  limit?: number;
} = {}): Promise<{ items: SubmissionSummary[] }> {
  const q = new URLSearchParams();
  if (params.status) {
    const arr = Array.isArray(params.status) ? params.status : [params.status];
    arr.forEach((s) => q.append("status", s));
  }
  if (params.taskId) q.set("taskId", params.taskId);
  if (params.limit) q.set("limit", String(params.limit));
  try {
    const res = await fetchJson<{ items: SubmissionSummary[] }>(
      `/api/submissions?${q.toString()}`,
    );
    // Real backend submissions only — no mock-sample fallback on empty.
    return params.limit ? { items: res.items.slice(0, params.limit) } : res;
  } catch {
    // Any failure (404/403/unavailable/parse) — fall back to an empty list so
    // the caller derives submissions from the contributor's tasks (the same
    // source the Revisions + Completed lanes use). The page must never hard-fail.
    return { items: [] };
  }
}

export async function getSubmission(
  submissionId: string,
): Promise<{ submission: SubmissionDetail }> {
  if (typeof window !== "undefined") {
    const mock = getMockSubmissionDetail(submissionId);
    if (mock) return { submission: mock };
  }
  try {
    return await fetchJson(`/api/submissions/${submissionId}`);
  } catch (err) {
    if (err instanceof ContributorApiError && err.status === 404) {
      const mock = getMockSubmissionDetail(submissionId);
      if (mock) return { submission: mock };
    }
    throw err;
  }
}

export async function updateSubmission(
  submissionId: string,
  input: { body?: string; payload?: Record<string, unknown> },
): Promise<{ submission: SubmissionDetail }> {
  if (typeof window !== "undefined") {
    try {
      const submission = updateMockDraft(submissionId, input);
      if (submission) return { submission };
    } catch (err) {
      throw mapMockBridgeError(err);
    }
  }
  try {
    return await fetchJson(`/api/submissions/${submissionId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  } catch (err) {
    if (err instanceof ContributorApiError && err.status === 404) {
      try {
        const submission = updateMockDraft(submissionId, input);
        if (submission) return { submission };
      } catch (mockErr) {
        throw mapMockBridgeError(mockErr);
      }
    }
    throw err;
  }
}

export async function attachArtifact(
  submissionId: string,
  input: {
    kind: "file" | "link" | "evidence";
    name: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    caption?: string;
  },
) {
  return fetchJson<{ artifact: SubmissionDetail["artifacts"][number] }>(
    `/api/submissions/${submissionId}/artifacts`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function removeArtifact(
  submissionId: string,
  artifactId: string,
): Promise<{ removed: true }> {
  return fetchJson(
    `/api/submissions/${submissionId}/artifacts/${artifactId}`,
    { method: "DELETE" },
  );
}

export async function submitSubmission(
  submissionId: string,
): Promise<{ submission: SubmissionDetail }> {
  if (typeof window !== "undefined") {
    try {
      const submission = submitMockDraft(submissionId);
      if (submission) return { submission };
    } catch (err) {
      throw mapMockBridgeError(err);
    }
  }
  try {
    return await fetchJson(`/api/submissions/${submissionId}/submit`, {
      method: "POST",
      body: "{}",
    });
  } catch (err) {
    if (err instanceof ContributorApiError && err.status === 404) {
      try {
        const submission = submitMockDraft(submissionId);
        if (submission) return { submission };
      } catch (mockErr) {
        throw mapMockBridgeError(mockErr);
      }
    }
    throw err;
  }
}

function mapMockBridgeError(err: unknown): ContributorApiError {
  if (err instanceof MockTaskBridgeError) {
    return new ContributorApiError(err.message, err.status, err.code);
  }
  throw err;
}
