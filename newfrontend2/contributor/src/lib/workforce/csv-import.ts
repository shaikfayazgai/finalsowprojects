/**
 * CSV parsing + normalization for internal workforce manual import.
 */

export type WorkforceImportAction = "create" | "update" | "deactivate";

export interface WorkforceImportRow {
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  primarySkills: string[];
  managerEmail: string | null;
  costCenter: string | null;
  status: "active" | "inactive";
}

export interface WorkforceImportDiff {
  email: string;
  name: string;
  role: string;
  manager: string;
  costCenter: string;
  action: WorkforceImportAction;
}

export interface WorkforceImportRowError {
  row: number;
  email?: string;
  message: string;
}

export interface WorkforceImportPreviewResult {
  diffs: WorkforceImportDiff[];
  errors: WorkforceImportRowError[];
  validRows: WorkforceImportRow[];
}

const HEADER_ALIASES: Record<string, keyof WorkforceImportRow | "status"> = {
  employee_id: "employeeId",
  employeeid: "employeeId",
  emp_id: "employeeId",
  email: "email",
  work_email: "email",
  first_name: "firstName",
  firstname: "firstName",
  given_name: "firstName",
  last_name: "lastName",
  lastname: "lastName",
  family_name: "lastName",
  department: "department",
  org: "department",
  organization: "department",
  dept: "department",
  primary_skills: "primarySkills",
  skills: "primarySkills",
  manager_email: "managerEmail",
  manager: "managerEmail",
  cost_center: "costCenter",
  costcenter: "costCenter",
  status: "status",
};

export const WORKFORCE_CSV_TEMPLATE = `employee_id,email,first_name,last_name,department,primary_skills,manager_email,cost_center,status
EMP-101,amrita@acme.com,Amrita,Bose,Finance,"Figma, UX design",rahul@acme.com,CC-300,active
EMP-102,karthik@acme.com,Karthik,Iyer,Engineering,"React, TypeScript",rahul@acme.com,CC-200,active
EMP-103,engineer-1@acme.com,Hari,Krishnan,Engineering,"Node.js, APIs",rahul@acme.com,CC-200,active`;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

function splitSkills(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseStatus(raw: string): "active" | "inactive" {
  const v = raw.trim().toLowerCase();
  if (v === "inactive" || v === "terminated" || v === "no") return "inactive";
  return "active";
}

export function parseWorkforceCsv(csvText: string): {
  rows: Record<string, string>[];
  errors: WorkforceImportRowError[];
} {
  const errors: WorkforceImportRowError[] = [];
  const trimmed = csvText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { rows: [], errors: [{ row: 0, message: "CSV file is empty." }] };
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 0, message: "CSV must include a header row and at least one data row." }],
    };
  }

  const rawHeaders = parseCsvLine(lines[0]!);
  const columnMap: Array<{ key: keyof WorkforceImportRow | "status"; index: number }> = [];

  for (let i = 0; i < rawHeaders.length; i++) {
    const norm = normalizeHeader(rawHeaders[i] ?? "");
    const key = HEADER_ALIASES[norm];
    if (key) columnMap.push({ key, index: i });
  }

  if (!columnMap.some((c) => c.key === "email")) {
    return { rows: [], errors: [{ row: 1, message: "Missing required column: email" }] };
  }

  const rows: Record<string, string>[] = [];
  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const cells = parseCsvLine(lines[lineIdx]!);
    const record: Record<string, string> = {};
    for (const { key, index } of columnMap) {
      record[key] = cells[index] ?? "";
    }
    rows.push(record);
  }

  return { rows, errors };
}

export function normalizeImportRow(
  raw: Record<string, string>,
  rowNumber: number,
): { row?: WorkforceImportRow; error?: WorkforceImportRowError } {
  const email = (raw.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: { row: rowNumber, email, message: "Valid email is required." } };
  }

  const firstName = (raw.firstName ?? "").trim();
  const lastName = (raw.lastName ?? "").trim();
  if (!firstName) {
    return { error: { row: rowNumber, email, message: "first_name is required." } };
  }

  const department = (raw.department ?? "").trim();
  if (!department) {
    return { error: { row: rowNumber, email, message: "department is required." } };
  }

  const status = parseStatus(raw.status ?? "active");

  return {
    row: {
      employeeId: (raw.employeeId ?? "").trim() || null,
      email,
      firstName,
      lastName: lastName || "",
      department,
      primarySkills: splitSkills(raw.primarySkills ?? ""),
      managerEmail: (raw.managerEmail ?? "").trim().toLowerCase() || null,
      costCenter: (raw.costCenter ?? "").trim() || null,
      status,
    },
  };
}

export function rowsToDiffs(
  rows: WorkforceImportRow[],
  existingByEmail: Map<
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
  >,
): WorkforceImportDiff[] {
  const diffs: WorkforceImportDiff[] = [];

  for (const row of rows) {
    const existing = existingByEmail.get(row.email);
    const name = `${row.firstName} ${row.lastName}`.trim();
    const manager = row.managerEmail ?? "—";
    const costCenter = row.costCenter ?? "—";

    if (!existing) {
      if (row.status === "inactive") continue;
      diffs.push({
        email: row.email,
        name,
        role: "contributor",
        manager,
        costCenter,
        action: "create",
      });
      continue;
    }

    if (existing.role !== "contributor") {
      continue;
    }

    if (row.status === "inactive") {
      if (!existing.inactive) {
        diffs.push({
          email: row.email,
          name,
          role: "contributor",
          manager,
          costCenter,
          action: "deactivate",
        });
      }
      continue;
    }

    const changed =
      existing.firstName !== row.firstName ||
      existing.lastName !== row.lastName ||
      existing.department !== row.department ||
      existing.inactive;

    if (existing.contribType !== "internal" || existing.tenantId === null) {
      diffs.push({
        email: row.email,
        name,
        role: "contributor",
        manager,
        costCenter,
        action: "create",
      });
    } else if (changed) {
      diffs.push({
        email: row.email,
        name,
        role: "contributor",
        manager,
        costCenter,
        action: "update",
      });
    }
  }

  return diffs;
}
