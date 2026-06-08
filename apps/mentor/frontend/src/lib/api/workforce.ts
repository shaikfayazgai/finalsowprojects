/**
 * Enterprise workforce + task assignment API client — MOCK MODE.
 *
 * CSV import and directory list use src/lib/enterprise/mocks/workforce.ts
 * (localStorage overlay). Task assign + matching still proxy to backend when wired.
 *
 * Backend replacement: swap list/preview/apply for fetch() to /api/enterprise/workforce*.
 */

import { fetchInternal } from "@/lib/api/client";
import type { FindCandidatesResult } from "@/lib/matching/types";
import {
  addWorkforceEmployeeManual as addWorkforceEmployeeManualMock,
  applyWorkforceImportMock,
  listWorkforceMock,
  previewWorkforceImportMock,
} from "@/lib/enterprise/mocks/workforce";
import type {
  AssignTaskResult,
  ListWorkforceResult,
  ManualWorkforceEmployeeInput,
  WorkforceMember,
} from "@/lib/workforce/types";
import type {
  WorkforceImportDiff,
  WorkforceImportPreviewResult,
} from "@/lib/workforce/csv-import";

export class WorkforceApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "WorkforceApiError";
  }
}

function tick<T>(value: T, ms = 120): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

async function parseError(res: Response): Promise<never> {
  let message = res.statusText;
  let code: string | undefined;
  try {
    const body = (await res.json()) as { error?: string; code?: string };
    message = body.error ?? message;
    code = body.code;
  } catch {
    /* keep statusText */
  }
  throw new WorkforceApiError(message, res.status, code);
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) await parseError(res);
  return (await res.json()) as T;
}

export async function listWorkforce(params: {
  search?: string;
  department?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<ListWorkforceResult> {
  return tick(listWorkforceMock(params));
}

export async function fetchMatchCandidates(
  taskId: string,
  pool: "organization" | "network" | "organization_first",
  limit = 20,
): Promise<FindCandidatesResult> {
  const q = new URLSearchParams({ pool, limit: String(limit) });
  const res = await fetchInternal(
    `/api/matching/tasks/${encodeURIComponent(taskId)}/candidates?${q.toString()}`,
    { cache: "no-store" },
  );
  return parseJson(res);
}

/**
 * Derive the decomposition planId from a DB task id. Backend task ids are shaped
 * `task-<planId>-<index>` (e.g. task-plan-acme-mq4qsvqi-0 → plan-acme-mq4qsvqi).
 */
function planIdFromTaskId(taskId: string): string | null {
  const m = taskId.match(/^task-(.+)-\d+$/);
  return m ? m[1] : null;
}

export async function assignTask(
  taskId: string,
  contributorUserId: string,
  directAssign = false,
  contributorEmail?: string,
): Promise<AssignTaskResult> {
  // Real backend assign lives on the decomposition plan:
  // POST /api/v1/enterprise/decomposition/plans/{planId}/tasks/{taskId}/assign
  const planId = planIdFromTaskId(taskId);
  const url = planId
    ? `/api/v1/enterprise/decomposition/plans/${encodeURIComponent(planId)}/tasks/${encodeURIComponent(taskId)}/assign`
    : `/api/enterprise/tasks/${encodeURIComponent(taskId)}/assign`; // legacy fallback
  const res = await fetchInternal(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contributorId: contributorUserId,
      contributorEmail,
      directAssign,
    }),
  });
  return parseJson(res);
}

export async function previewWorkforceCsvImport(
  csv: string,
): Promise<WorkforceImportPreviewResult> {
  return tick(previewWorkforceImportMock(csv));
}

export async function applyWorkforceCsvImport(csv: string): Promise<{
  success: boolean;
  applied: number;
  created: number;
  updated: number;
  deactivated: number;
  diffs: WorkforceImportDiff[];
}> {
  return tick(applyWorkforceImportMock(csv));
}

export async function addWorkforceEmployee(
  input: ManualWorkforceEmployeeInput,
): Promise<{ member: WorkforceMember; created: boolean }> {
  return tick(addWorkforceEmployeeManualMock(input));
}

export type { WorkforceMember, AssignTaskResult, ListWorkforceResult, ManualWorkforceEmployeeInput };
