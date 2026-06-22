/**
 * Preview + apply internal workforce CSV imports (tenant-scoped).
 */

import { Prisma } from "@/generated/prisma/client";
import {
  normalizeImportRow,
  parseWorkforceCsv,
  rowsToDiffs,
  type WorkforceImportPreviewResult,
  type WorkforceImportRow,
} from "./csv-import";
import { WorkforceServiceError } from "./service";

type Tx = Prisma.TransactionClient;

const DEFAULT_PROFILE = {
  country: "India",
  dob: new Date("1990-01-01"),
  timezone: "Asia/Kolkata",
  secondarySkills: [] as string[],
  otherSkills: [] as string[],
  availability: "20",
  ndaAccepted: true,
  acceptTos: true,
  acceptCoc: true,
  acceptPrivacy: true,
  acceptFee: true,
  acceptAhp: true,
  marketingOptIn: false,
};

async function ensureContributorRole(tx: Tx, userId: string) {
  const role = await tx.userRole.findFirst({
    where: { userId, roleCode: "contributor" },
  });
  if (!role) {
    await tx.userRole.create({
      data: { userId, roleCode: "contributor", tenantId: null },
    });
  }
}

async function upsertInternalFromRow(
  tx: Tx,
  tenantId: string,
  row: WorkforceImportRow,
): Promise<void> {
  const displayName = `${row.firstName} ${row.lastName}`.trim();
  const inactive = row.status === "inactive";

  const user = await tx.user.upsert({
    where: { email: row.email },
    update: {
      firstName: row.firstName,
      lastName: row.lastName,
      tenantId: inactive ? null : tenantId,
      role: "contributor",
      provider: "sso",
      passwordHash: null,
      emailVerified: true,
    },
    create: {
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      tenantId,
      role: "contributor",
      provider: "sso",
      passwordHash: null,
      emailVerified: true,
    },
  });

  await ensureContributorRole(tx, user.id);

  const profileBase = {
    contribType: "internal" as const,
    departmentCategory: inactive ? "inactive" : "other",
    departmentOther: row.department,
    primarySkills: row.primarySkills.length > 0 ? row.primarySkills : ["General"],
    ndaSignature: displayName || row.email,
    ...DEFAULT_PROFILE,
  };

  await tx.contributorProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...profileBase },
    update: profileBase,
  });
}

async function deactivateInternal(tx: Tx, tenantId: string, email: string): Promise<void> {
  const user = await tx.user.findUnique({
    where: { email },
    include: { contributorProfile: true },
  });
  if (!user || user.tenantId !== tenantId) return;

  await tx.user.update({
    where: { id: user.id },
    data: { tenantId: null },
  });

  if (user.contributorProfile) {
    await tx.contributorProfile.update({
      where: { userId: user.id },
      data: { departmentCategory: "inactive" },
    });
  }
}

function normalizeRowsFromCsv(csvText: string): WorkforceImportPreviewResult {
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

export async function previewWorkforceCsvImport(
  tx: Tx,
  tenantId: string,
  csvText: string,
): Promise<WorkforceImportPreviewResult> {
  const base = normalizeRowsFromCsv(csvText);
  if (base.validRows.length === 0 && base.errors.length > 0) {
    return base;
  }

  const emails = base.validRows.map((r) => r.email);
  const existingUsers = await tx.user.findMany({
    where: { email: { in: emails } },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      tenantId: true,
      role: true,
      contributorProfile: {
        select: { contribType: true, departmentOther: true, departmentCategory: true },
      },
    },
  });

  const existingByEmail = new Map(
    existingUsers.map((u) => [
      u.email,
      {
        firstName: u.firstName,
        lastName: u.lastName,
        department: u.contributorProfile?.departmentOther ?? "",
        inactive: u.contributorProfile?.departmentCategory === "inactive",
        tenantId: u.tenantId,
        role: u.role,
        contribType: u.contributorProfile?.contribType ?? null,
      },
    ]),
  );

  for (const row of base.validRows) {
    const existing = existingByEmail.get(row.email);
    if (
      existing &&
      existing.role !== "contributor" &&
      row.status !== "inactive"
    ) {
      base.errors.push({
        row: 0,
        email: row.email,
        message: `${row.email} is already registered as ${existing.role} and cannot be imported as internal workforce.`,
      });
    } else if (
      existing &&
      existing.tenantId &&
      existing.tenantId !== tenantId &&
      existing.role === "contributor"
    ) {
      base.errors.push({
        row: 0,
        email: row.email,
        message: `${row.email} belongs to another organization.`,
      });
    }
  }

  const validAfterConflicts = base.validRows.filter(
    (r) => !base.errors.some((e) => e.email === r.email),
  );

  base.diffs = rowsToDiffs(validAfterConflicts, existingByEmail);
  base.validRows = validAfterConflicts;
  return base;
}

export async function applyWorkforceCsvImport(
  tx: Tx,
  tenantId: string,
  rows: WorkforceImportRow[],
): Promise<{ applied: number; created: number; updated: number; deactivated: number }> {
  if (!rows.length) {
    throw new WorkforceServiceError("No rows to import.", "validation");
  }

  let created = 0;
  let updated = 0;
  let deactivated = 0;

  for (const row of rows) {
    if (row.status === "inactive") {
      await deactivateInternal(tx, tenantId, row.email);
      deactivated++;
      continue;
    }

    const existing = await tx.user.findUnique({
      where: { email: row.email },
      include: {
        contributorProfile: { select: { contribType: true, departmentCategory: true } },
      },
    });

    const isNew =
      !existing ||
      existing.tenantId !== tenantId ||
      existing.contributorProfile?.contribType !== "internal";

    await upsertInternalFromRow(tx, tenantId, row);
    if (isNew) created++;
    else updated++;
  }

  return { applied: rows.length, created, updated, deactivated };
}

export async function applyWorkforceImportFromCsv(
  tx: Tx,
  tenantId: string,
  csvText: string,
): Promise<{ applied: number; created: number; updated: number; deactivated: number; preview: WorkforceImportPreviewResult }> {
  const preview = await previewWorkforceCsvImport(tx, tenantId, csvText);
  if (preview.errors.length > 0) {
    throw new WorkforceServiceError(
      preview.errors[0]?.message ?? "CSV validation failed.",
      "validation",
    );
  }
  if (preview.validRows.length === 0) {
    throw new WorkforceServiceError("No changes to apply.", "validation");
  }

  const stats = await applyWorkforceCsvImport(tx, tenantId, preview.validRows);
  return { ...stats, preview };
}
