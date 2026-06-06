/**
 * Super Admin KYC API client — wraps the live superadmin KYC proxy routes and
 * maps backend items into the `MockKycCase` shape the existing UI renders.
 *
 * Backend item shape:
 *   { accountId, email, name, role, segment, status, data, updatedAt }
 * Backend KYC statuses: not_started | pending | verified | rejected
 */

import { apiCall } from "@/lib/api/client";
import type { KycStatus, KycTrack, MockKycCase } from "@/mocks/admin/kyc";

/** Raw item as returned by the backend. */
export interface BackendKycItem {
  accountId: string;
  email: string;
  name?: string | null;
  role?: string | null;
  segment?: string | null;
  status: string;
  data?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

export interface BackendKycListResponse {
  items?: BackendKycItem[];
  total?: number;
  counts?: Record<string, number>;
}

export type BackendKycStatus = "not_started" | "pending" | "verified" | "rejected";
export type KycDecision = "approve" | "reject";

/** Map backend KYC status → the UI's KycStatus union. */
function mapStatus(status: string): KycStatus {
  switch (status) {
    case "verified":
      return "approved";
    case "rejected":
      return "rejected";
    case "pending":
    case "not_started":
    default:
      return "pending";
  }
}

/** Best-effort mapping of role/segment → the UI track label. */
function mapTrack(item: BackendKycItem): KycTrack {
  const raw = `${item.segment ?? ""} ${item.role ?? ""}`.toLowerCase();
  if (raw.includes("women")) return "Women WF";
  if (raw.includes("student")) return "Student";
  if (raw.includes("internal") || raw.includes("admin")) return "Internal";
  return "Freelancer";
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

const VALID_ID_TYPES: MockKycCase["idType"][] = [
  "Aadhaar",
  "Passport",
  "Driving Licence",
  "National ID",
];

function mapIdType(v: unknown): MockKycCase["idType"] {
  return VALID_ID_TYPES.includes(v as MockKycCase["idType"])
    ? (v as MockKycCase["idType"])
    : "National ID";
}

function mapAutoChecks(v: unknown): MockKycCase["autoChecks"] {
  if (!Array.isArray(v)) return [];
  return v
    .map((c) => {
      if (typeof c !== "object" || c === null) return null;
      const o = c as Record<string, unknown>;
      const state = o.state === "pass" || o.state === "warn" || o.state === "fail" ? o.state : "pass";
      return { label: str(o.label, "Check"), state };
    })
    .filter((c): c is { label: string; state: "pass" | "warn" | "fail" } => c !== null);
}

/**
 * Convert a backend KYC item into the `MockKycCase` shape used throughout the
 * KYC workspace and detail UI. Rich fields are read from `data` when present
 * and fall back to safe defaults so the UI never crashes on sparse payloads.
 */
export function toKycCase(item: BackendKycItem): MockKycCase {
  const data = (item.data ?? {}) as Record<string, unknown>;
  const status = mapStatus(item.status);
  const decisionData = data.decision as Record<string, unknown> | undefined;

  return {
    id: item.accountId,
    contributorName: item.name ?? str(data.name) ?? item.email,
    contributorEmail: item.email,
    dob: str(data.dob),
    country: str(data.country),
    track: mapTrack(item),
    submittedAt: str(data.submittedAt) || item.updatedAt || new Date().toISOString(),
    slaHours: typeof data.slaHours === "number" ? data.slaHours : 8,
    status,
    idType: mapIdType(data.idType),
    idNumberLast4: str(data.idNumberLast4, "0000"),
    autoChecks: mapAutoChecks(data.autoChecks),
    decision:
      decisionData &&
      (decisionData.outcome === "approved" ||
        decisionData.outcome === "rejected" ||
        decisionData.outcome === "more_info")
        ? {
            outcome: decisionData.outcome,
            reason: str(decisionData.reason) || undefined,
            note: str(decisionData.note) || undefined,
            at: str(decisionData.at) || item.updatedAt || new Date().toISOString(),
            by: str(decisionData.by, "Admin"),
          }
        : status === "approved"
          ? { outcome: "approved", at: item.updatedAt ?? new Date().toISOString(), by: "Admin" }
          : status === "rejected"
            ? { outcome: "rejected", at: item.updatedAt ?? new Date().toISOString(), by: "Admin" }
            : undefined,
  };
}

/** List KYC cases for a given backend status (defaults to "pending"). */
export async function listKyc(
  token: string,
  status: BackendKycStatus = "pending",
): Promise<{ cases: MockKycCase[]; total: number; counts: Record<string, number> }> {
  const res = await apiCall<BackendKycListResponse>(
    `/api/superadmin/kyc?status=${encodeURIComponent(status)}`,
    { method: "GET", token },
  );
  return {
    cases: (res.items ?? []).map(toKycCase),
    total: res.total ?? res.items?.length ?? 0,
    counts: res.counts ?? {},
  };
}

/** Fetch a single KYC case by account id. */
export async function getKyc(token: string, accountId: string): Promise<MockKycCase> {
  const item = await apiCall<BackendKycItem>(
    `/api/superadmin/kyc/${encodeURIComponent(accountId)}`,
    { method: "GET", token },
  );
  return toKycCase(item);
}

/** Record an approve/reject decision for a KYC case. */
export async function decideKyc(
  token: string,
  accountId: string,
  decision: KycDecision,
  note?: string,
): Promise<{ ok?: boolean; accountId?: string; status?: string }> {
  return apiCall<{ ok?: boolean; accountId?: string; status?: string }>(
    `/api/superadmin/kyc/${encodeURIComponent(accountId)}/decision`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ decision, ...(note ? { note } : {}) }),
    },
  );
}
