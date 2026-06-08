/**
 * Enterprise review-queue client.
 *
 * Production path: `/api/enterprise/review-queue/*` (Prisma-backed).
 * Demo fallback: when `NEXT_PUBLIC_ENTERPRISE_DEMO=1` and the live API
 * is empty or unavailable, falls back to src/lib/enterprise/mocks/reviews.ts
 * so walkthroughs keep working without a seeded DB.
 *
 * Mock contract: src/lib/enterprise/mocks/reviews.ts
 */

import type {
  EnterpriseDecision,
  EnterpriseDecisionResult,
  EnterpriseReviewQueueItem,
} from "@/lib/enterprise-review/types";
import { fetchInternal } from "@/lib/api/client";
import type { EnterpriseReviewHistoryItem } from "@/lib/enterprise/mocks/reviews";
import {
  claimReviewMock,
  decideReviewMock,
  getReviewSubmissionMock,
  listReviewHistoryMock,
  listReviewQueueMock,
  releaseReviewMock,
} from "@/lib/enterprise/mocks/reviews";

export type { EnterpriseReviewHistoryItem };

export class EnterpriseReviewApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "EnterpriseReviewApiError";
  }
}

function demoFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENTERPRISE_DEMO === "1";
}

async function parseError(res: Response): Promise<never> {
  let message = res.statusText;
  let code: string | undefined;
  try {
    const body = (await res.json()) as { error?: string; code?: string; reason?: string };
    message = body.error ?? body.reason ?? message;
    code = body.code;
  } catch {
    /* keep statusText */
  }
  throw new EnterpriseReviewApiError(message, res.status, code);
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) await parseError(res);
  return (await res.json()) as T;
}

function buildQueueQuery(params: {
  mine?: boolean;
  includeClaimed?: boolean;
  limit?: number;
}): string {
  const q = new URLSearchParams();
  if (params.mine) q.set("mine", "true");
  if (params.includeClaimed) q.set("includeClaimed", "true");
  if (params.limit != null) q.set("limit", String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function listReviewQueueLive(params: {
  mine?: boolean;
  includeClaimed?: boolean;
  limit?: number;
} = {}): Promise<{ items: EnterpriseReviewQueueItem[] }> {
  const res = await fetchInternal(
    `/api/enterprise/review-queue${buildQueueQuery(params)}`,
    { cache: "no-store" },
  );
  return parseJson<{ items: EnterpriseReviewQueueItem[] }>(res);
}

export async function listReviewQueue(params: {
  mine?: boolean;
  includeClaimed?: boolean;
  limit?: number;
} = {}): Promise<{ items: EnterpriseReviewQueueItem[] }> {
  if (!demoFallbackEnabled()) {
    return listReviewQueueLive(params);
  }
  try {
    const live = await listReviewQueueLive(params);
    if (live.items.length > 0) return live;
    return listReviewQueueMock(params);
  } catch {
    return listReviewQueueMock(params);
  }
}

async function listReviewHistoryLive(params: { limit?: number } = {}): Promise<{
  items: EnterpriseReviewHistoryItem[];
}> {
  const q = new URLSearchParams();
  if (params.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetchInternal(`/api/enterprise/review-queue/history${suffix}`, {
    cache: "no-store",
  });
  return parseJson<{ items: EnterpriseReviewHistoryItem[] }>(res);
}

export async function listReviewHistory(params: { limit?: number } = {}): Promise<{
  items: EnterpriseReviewHistoryItem[];
}> {
  if (!demoFallbackEnabled()) {
    try {
      return await listReviewHistoryLive(params);
    } catch {
      return listReviewHistoryMock(params);
    }
  }
  try {
    return await listReviewHistoryLive(params);
  } catch {
    return listReviewHistoryMock(params);
  }
}

export async function getReviewSubmission(submissionId: string): Promise<{
  item: EnterpriseReviewQueueItem;
  decided: EnterpriseReviewHistoryItem | null;
} | null> {
  if (!demoFallbackEnabled()) {
    try {
      const res = await fetchInternal(
        `/api/enterprise/review-queue/${encodeURIComponent(submissionId)}`,
        { cache: "no-store" },
      );
      if (res.status === 404) return null;
      return parseJson<{ item: EnterpriseReviewQueueItem; decided: EnterpriseReviewHistoryItem | null }>(res);
    } catch {
      return getReviewSubmissionMock(submissionId);
    }
  }
  try {
    const res = await fetchInternal(
      `/api/enterprise/review-queue/${encodeURIComponent(submissionId)}`,
      { cache: "no-store" },
    );
    if (res.status === 404) return getReviewSubmissionMock(submissionId);
    return parseJson<{ item: EnterpriseReviewQueueItem; decided: EnterpriseReviewHistoryItem | null }>(res);
  } catch {
    return getReviewSubmissionMock(submissionId);
  }
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetchInternal(path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return parseJson<T>(res);
}

export async function claimReview(
  submissionId: string,
): Promise<{ item: EnterpriseReviewQueueItem }> {
  const path = `/api/enterprise/review-queue/${encodeURIComponent(submissionId)}/claim`;
  if (demoFallbackEnabled()) {
    try {
      return await postJson<{ item: EnterpriseReviewQueueItem }>(path);
    } catch {
      return claimReviewMock(submissionId);
    }
  }
  return postJson<{ item: EnterpriseReviewQueueItem }>(path);
}

export async function releaseReview(
  submissionId: string,
): Promise<{ released: true }> {
  const path = `/api/enterprise/review-queue/${encodeURIComponent(submissionId)}/release`;
  if (demoFallbackEnabled()) {
    try {
      return await postJson<{ released: true }>(path);
    } catch {
      return releaseReviewMock(submissionId);
    }
  }
  return postJson<{ released: true }>(path);
}

export async function decideReview(
  submissionId: string,
  body: { decision: EnterpriseDecision; note?: string; deciderInitials?: string },
): Promise<{ result: EnterpriseDecisionResult }> {
  const path = `/api/enterprise/review-queue/${encodeURIComponent(submissionId)}/decide`;
  if (demoFallbackEnabled()) {
    try {
      return await postJson<{ result: EnterpriseDecisionResult }>(path, body);
    } catch {
      return decideReviewMock(submissionId, body);
    }
  }
  return postJson<{ result: EnterpriseDecisionResult }>(path, body);
}
