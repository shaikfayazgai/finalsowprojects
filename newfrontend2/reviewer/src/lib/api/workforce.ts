/**
 * Enterprise workforce + task assignment API client — MOCK MODE.
 *
 * CSV import and directory list use src/lib/enterprise/mocks/workforce.ts
 * (localStorage overlay). Task assign + matching still proxy to backend when wired.
 *
 * Backend replacement: swap list/preview/apply for fetch() to /api/enterprise/workforce*.
 */

import {
  addWorkforceEmployeeManual as addWorkforceEmployeeManualMock,
  applyWorkforceImportMock,
  listWorkforceMock,
  previewWorkforceImportMock,
} from "@/lib/enterprise/mocks/workforce";
import type {
  ListWorkforceResult,
  ManualWorkforceEmployeeInput,
  WorkforceMember,
} from "@/lib/workforce/types";
import type {
  WorkforceImportDiff,
  WorkforceImportPreviewResult,
} from "@/lib/workforce/csv-import";

function tick<T>(value: T, ms = 120): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function listWorkforce(params: {
  search?: string;
  department?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<ListWorkforceResult> {
  return tick(listWorkforceMock(params));
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

export type { WorkforceMember, ListWorkforceResult, ManualWorkforceEmployeeInput };
