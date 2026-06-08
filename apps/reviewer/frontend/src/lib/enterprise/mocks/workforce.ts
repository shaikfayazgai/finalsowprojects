/**
 * Internal workforce directory + CSV import — MOCK MODE.
 *
 * Base roster + localStorage overlay (same pattern as sows.ts). Backend team
 * replaces via real /api/v1/enterprise/workforce* when ready.
 */

import {
  normalizeImportRow,
  parseWorkforceCsv,
  rowsToDiffs,
  type WorkforceImportPreviewResult,
  type WorkforceImportRow,
} from "@/lib/workforce/csv-import";
import type { ListWorkforceResult, ManualWorkforceEmployeeInput, WorkforceMember } from "@/lib/workforce/types";
import { createOverlayStore } from "./overlay";

const OVERLAY_KEY = "glimmora.mock.workforce";

export const workforceOverlay = createOverlayStore<WorkforceMember>(OVERLAY_KEY);

/** Seed internal employees for Acme Corp demos. */
const BASE_WORKFORCE: WorkforceMember[] = [];

function memberIdForEmail(email: string): string {
  return `wf-import-${email.replace(/[^a-z0-9]/gi, "-")}`;
}

function rowToMember(row: WorkforceImportRow): WorkforceMember {
  return {
    userId: memberIdForEmail(row.email),
    email: row.email,
    displayName: `${row.firstName} ${row.lastName}`.trim(),
    department: row.department,
    contribType: "internal",
    primarySkills: row.primarySkills.length > 0 ? row.primarySkills : ["General"],
    availability: "20",
    employeeId: row.employeeId,
    managerEmail: row.managerEmail,
    costCenter: row.costCenter,
    status: row.status === "inactive" ? "inactive" : "active",
  };
}

function mergedWorkforce(): WorkforceMember[] {
  const overlay = workforceOverlay.read();
  const out: WorkforceMember[] = [];

  for (const row of BASE_WORKFORCE) {
    const patch = overlay[row.userId];
    if (patch?.__deletedAt) continue;
    out.push(patch ? ({ ...row, ...patch } as WorkforceMember) : row);
  }

  const seen = new Set(out.map((m) => m.userId));
  for (const [id, patch] of Object.entries(overlay)) {
    if (patch.__deletedAt || seen.has(id)) continue;
    if (patch.email && patch.displayName) {
      out.push({ userId: id, ...patch } as WorkforceMember);
      seen.add(id);
    }
  }

  return out;
}

function existingMap() {
  const map = new Map<
    string,
    {
      firstName: string;
      lastName: string;
      department: string;
      inactive: boolean;
      tenantId: string | null;
      role: string;
      contribType: string | null;
    }
  >();

  for (const m of mergedWorkforce()) {
    const parts = m.displayName.split(/\s+/);
    map.set(m.email, {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      department: m.department ?? "",
      inactive: false,
      tenantId: "",
      role: "contributor",
      contribType: m.contribType,
    });
  }
  return map;
}

function normalizeCsv(csvText: string): WorkforceImportPreviewResult {
  const { rows: rawRows, errors: parseErrors } = parseWorkforceCsv(csvText);
  const errors = [...parseErrors];
  const validRows: WorkforceImportRow[] = [];

  rawRows.forEach((raw, idx) => {
    const { row, error } = normalizeImportRow(raw, idx + 2);
    if (error) errors.push(error);
    else if (row) validRows.push(row);
  });

  const seen = new Set<string>();
  for (const row of validRows) {
    if (seen.has(row.email)) {
      errors.push({
        row: 0,
        email: row.email,
        message: `Duplicate email in CSV: ${row.email}`,
      });
    }
    seen.add(row.email);
  }

  return { diffs: [], errors, validRows };
}

export function listWorkforceMock(params: {
  search?: string;
  department?: string;
  limit?: number;
  offset?: number;
} = {}): ListWorkforceResult {
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;
  let items = mergedWorkforce();

  const q = params.search?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        m.displayName.toLowerCase().includes(q) ||
        (m.employeeId?.toLowerCase().includes(q) ?? false),
    );
  }

  if (params.department?.trim()) {
    const dept = params.department.trim().toLowerCase();
    items = items.filter((m) => m.department?.toLowerCase().includes(dept));
  }

  const total = items.length;
  items = items.slice(offset, offset + limit);
  return { items, total };
}

export function previewWorkforceImportMock(csvText: string): WorkforceImportPreviewResult {
  const base = normalizeCsv(csvText);
  if (base.validRows.length === 0 && base.errors.length > 0) {
    return base;
  }

  const existingByEmail = existingMap();
  base.diffs = rowsToDiffs(base.validRows, existingByEmail);
  return base;
}

export function applyWorkforceImportMock(csvText: string): {
  success: boolean;
  applied: number;
  created: number;
  updated: number;
  deactivated: number;
  diffs: WorkforceImportPreviewResult["diffs"];
} {
  const preview = previewWorkforceImportMock(csvText);
  if (preview.errors.length > 0) {
    throw new Error(preview.errors[0]?.message ?? "CSV validation failed.");
  }
  if (preview.validRows.length === 0) {
    throw new Error("No changes to apply.");
  }

  let created = 0;
  let updated = 0;
  let deactivated = 0;

  for (const row of preview.validRows) {
    const id = memberIdForEmail(row.email);
    const existing = mergedWorkforce().find((m) => m.email === row.email);

    if (row.status === "inactive") {
      if (existing) {
        workforceOverlay.remove(existing.userId);
        deactivated++;
      }
      continue;
    }

    const member = rowToMember(row);
    if (!existing || existing.contribType !== "internal") {
      workforceOverlay.insert(id, member);
      created++;
    } else {
      workforceOverlay.patch(existing.userId, member);
      updated++;
    }
  }

  return {
    success: true,
    applied: preview.validRows.length,
    created,
    updated,
    deactivated,
    diffs: preview.diffs,
  };
}

export function resetWorkforceMock(): void {
  workforceOverlay.reset();
}

export function addWorkforceEmployeeManual(
  input: ManualWorkforceEmployeeInput,
): { member: WorkforceMember; created: boolean } {
  const { row, error } = normalizeImportRow(
    {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      department: input.department,
      employeeId: input.employeeId ?? "",
      primarySkills: input.primarySkills ?? "",
      managerEmail: input.managerEmail ?? "",
      costCenter: input.costCenter ?? "",
      status: "active",
    },
    1,
  );

  if (error || !row) {
    throw new Error(error?.message ?? "Invalid employee details.");
  }

  const existing = mergedWorkforce().find((m) => m.email === row.email);
  const member = rowToMember(row);

  if (!existing) {
    workforceOverlay.insert(member.userId, member);
    return { member, created: true };
  }

  if (existing.contribType !== "internal") {
    throw new Error(`${row.email} is already registered outside your organization roster.`);
  }

  workforceOverlay.patch(existing.userId, member);
  return {
    member: { ...member, userId: existing.userId },
    created: false,
  };
}
