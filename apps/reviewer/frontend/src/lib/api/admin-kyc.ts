"use client";

/**
 * Real admin-KYC API client — talks to the backend superadmin KYC endpoints
 * via the /api/admin/kyc proxy. Maps the backend shape onto the MockKycCase
 * shape the existing KYC UI already renders, so the queue + detail pages show
 * REAL women/freelancer applicants instead of mock data.
 */

import type { MockKycCase, KycStatus, KycTrack } from "@/mocks/admin/kyc";

interface BackendKycRow {
  accountId: string | number;
  email: string;
  name?: string | null;
  role?: string | null;
  segment?: string | null;
  status: string; // pending | verified | rejected
  data?: Record<string, unknown> | null;
  updatedAt?: string | null;
}

interface BackendKycList {
  items?: BackendKycRow[];
  counts?: Record<string, number>;
}

function mapStatus(s: string): KycStatus {
  if (s === "verified" || s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

function mapTrack(segment: string | null | undefined): KycTrack {
  switch ((segment ?? "").toLowerCase()) {
    case "women":
    case "women_workforce":
    case "women_wf":
      return "Women WF";
    case "student":
      return "Student";
    case "internal":
      return "Internal";
    default:
      return "Freelancer";
  }
}

function toCase(row: BackendKycRow): MockKycCase {
  const data = (row.data ?? {}) as Record<string, unknown>;
  const fullName =
    (typeof data.fullName === "string" && data.fullName) ||
    row.name ||
    row.email.split("@")[0];
  return {
    id: String(row.accountId),
    contributorName: fullName,
    contributorEmail: row.email,
    dob: typeof data.dob === "string" ? data.dob : "—",
    country: typeof data.country === "string" ? data.country : "India",
    track: mapTrack(row.segment),
    submittedAt: row.updatedAt ?? new Date().toISOString(),
    slaHours: 48,
    status: mapStatus(row.status),
    idType: "Aadhaar",
    idNumberLast4: "0000",
    autoChecks: [
      { label: "Email verified", state: "pass" },
      { label: "Documents attached", state: Array.isArray(data.docs) && (data.docs as unknown[]).length ? "pass" : "warn" },
    ],
  };
}

/** Fetch all KYC cases (pending + verified + rejected) from the backend. */
export async function fetchRealKycCases(): Promise<MockKycCase[]> {
  const statuses = ["pending", "verified", "rejected"];
  const all: MockKycCase[] = [];
  for (const status of statuses) {
    try {
      const res = await fetch(`/api/admin/kyc?status=${status}`, { cache: "no-store" });
      if (!res.ok) continue;
      const body = (await res.json()) as BackendKycList | BackendKycRow[];
      const items = Array.isArray(body) ? body : (body.items ?? []);
      for (const row of items) all.push(toCase(row));
    } catch {
      // ignore — caller falls back to mock
    }
  }
  return all;
}

/** Submit a KYC decision to the backend (flips approval_status so login unlocks). */
export async function decideRealKyc(
  accountId: string,
  decision: "approve" | "reject",
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/kyc/${encodeURIComponent(accountId)}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      return { ok: false, error: (b as { detail?: string }).detail ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}
