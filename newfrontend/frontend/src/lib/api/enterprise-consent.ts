/**
 * Enterprise consent inventory client — REAL.
 * Proxies to /api/enterprise/compliance/consent → /api/v1/enterprise/compliance/consent,
 * which reads real consent flags off contributor_profiles for contributors
 * assigned to this tenant's tasks. No mock data.
 */

import { fetchInternal } from "@/lib/api/client";

export interface ConsentRow {
  contributorId: string;
  email: string;
  name: string;
  ndaAccepted: boolean;
  acceptTos: boolean;
  acceptCoc: boolean;
  acceptPrivacy: boolean;
  acceptFee: boolean;
  acceptAhp: boolean;
  marketingOptIn: boolean;
  profileUpdatedAt: string | null;
  missingRequired: string[];
  isComplete: boolean;
}

export interface ConsentInventoryResponse {
  tenantId: string;
  total: number;
  complete: number;
  missing: number;
  rows: ConsentRow[];
}

export interface ConsentQuery {
  search?: string;
  missing?: boolean;
  limit?: number;
}

export class ConsentApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ConsentApiError";
  }
}

function buildQuery(q: ConsentQuery, extra: Record<string, string> = {}): string {
  const qs = new URLSearchParams(extra);
  if (q.search) qs.set("search", q.search);
  if (q.missing) qs.set("missing", "true");
  if (q.limit != null) qs.set("limit", String(q.limit));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function fetchConsentInventory(q: ConsentQuery = {}): Promise<ConsentInventoryResponse> {
  const res = await fetchInternal(`/api/enterprise/compliance/consent${buildQuery(q)}`, { method: "GET" });
  if (!res.ok) {
    throw new ConsentApiError(`Failed to load consent inventory (${res.status})`, res.status);
  }
  return res.json();
}

export async function downloadConsentCsv(q: ConsentQuery = {}): Promise<{ filename: string; rowCount: number }> {
  const res = await fetchInternal(`/api/enterprise/compliance/consent${buildQuery(q)}`, { method: "GET" });
  if (!res.ok) throw new ConsentApiError(`Failed to load consent inventory (${res.status})`, res.status);
  const inv = (await res.json()) as ConsentInventoryResponse;
  const header = "contributorId,email,name,ndaAccepted,acceptTos,acceptCoc,acceptPrivacy,acceptFee,acceptAhp,marketingOptIn,profileUpdatedAt,missingRequired,isComplete\n";
  const rows = inv.rows
    .map((r) => `${r.contributorId},${r.email},${JSON.stringify(r.name)},${r.ndaAccepted},${r.acceptTos},${r.acceptCoc},${r.acceptPrivacy},${r.acceptFee},${r.acceptAhp},${r.marketingOptIn},${r.profileUpdatedAt ?? ""},${r.missingRequired.join("|")},${r.isComplete}`)
    .join("\n");
  const csv = header + rows + "\n";
  const filename = `glimmora_consent_${new Date().toISOString().slice(0, 10)}.csv`;
  if (typeof window !== "undefined") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { filename, rowCount: inv.rows.length };
}
