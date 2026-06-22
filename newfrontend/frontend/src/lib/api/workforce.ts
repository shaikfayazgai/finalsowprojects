/**
 * Enterprise workforce + task assignment API client — REAL.
 *
 * Directory + CSV import call the enterprise backend
 * (`/api/enterprise/workforce*` → `/api/v1/enterprise/workforce*`). The
 * directory merges CSV-imported internal staff with the real contributors who
 * delivered this tenant's work. No mock data.
 */

import { fetchInternal } from "@/lib/api/client";
import type {
  ListWorkforceResult,
  ManualWorkforceEmployeeInput,
  WorkforceMember,
} from "@/lib/workforce/types";
import type {
  WorkforceImportDiff,
  WorkforceImportPreviewResult,
} from "@/lib/workforce/csv-import";

export async function listWorkforce(params: {
  search?: string;
  department?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<ListWorkforceResult> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.department) qs.set("department", params.department);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetchInternal(`/api/enterprise/workforce${suffix}`, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load workforce (${res.status})`);
  const body = (await res.json()) as { items?: WorkforceMember[]; total?: number };
  return { items: Array.isArray(body.items) ? body.items : [], total: body.total ?? 0 };
}

export async function previewWorkforceCsvImport(
  csv: string,
): Promise<WorkforceImportPreviewResult> {
  const res = await fetchInternal(`/api/enterprise/workforce/import/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv }),
  });
  if (!res.ok) throw new Error(`Import preview failed (${res.status})`);
  return res.json();
}

export async function applyWorkforceCsvImport(csv: string): Promise<{
  success: boolean;
  applied: number;
  created: number;
  updated: number;
  deactivated: number;
  diffs: WorkforceImportDiff[];
}> {
  const res = await fetchInternal(`/api/enterprise/workforce/import/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv }),
  });
  if (!res.ok) throw new Error(`Import apply failed (${res.status})`);
  return res.json();
}

export async function addWorkforceEmployee(
  input: ManualWorkforceEmployeeInput,
): Promise<{ member: WorkforceMember; created: boolean }> {
  const res = await fetchInternal(`/api/enterprise/workforce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Add member failed (${res.status})`);
  return res.json();
}

export type { WorkforceMember, ListWorkforceResult, ManualWorkforceEmployeeInput };
