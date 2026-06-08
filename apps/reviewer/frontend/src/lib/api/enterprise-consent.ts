/**
 * Enterprise consent inventory client — MOCK MODE.
 */

import { consentInventoryMock } from "@/lib/enterprise/mocks/compliance";

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

function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function fetchConsentInventory(q: ConsentQuery = {}): Promise<ConsentInventoryResponse> {
  return tick(consentInventoryMock(q));
}

export async function downloadConsentCsv(q: ConsentQuery = {}): Promise<{ filename: string; rowCount: number }> {
  const inv = consentInventoryMock(q);
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
  return tick({ filename, rowCount: inv.rows.length });
}
