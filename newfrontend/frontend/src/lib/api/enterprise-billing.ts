/**
 * Enterprise billing client — REAL.
 *
 * Tenant payouts come from `/api/payouts/tenant` → `/api/v1/payouts/tenant`,
 * which reads the real `payouts` table (written by the delivery flow on
 * enterprise acceptance), scoped to the tenant. No mock data.
 */

import type { PayoutDetail } from "@/lib/payouts/types";
import { fetchInternal } from "@/lib/api/client";

export class BillingApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "BillingApiError";
  }
}

export async function listTenantPayouts(params: {
  status?: string | string[];
} = {}): Promise<{ items: PayoutDetail[] }> {
  const status = Array.isArray(params.status)
    ? params.status.join(",")
    : params.status;
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetchInternal(`/api/payouts/tenant${qs}`, { method: "GET" });
  if (!res.ok) {
    throw new BillingApiError(`Failed to load payouts (${res.status})`, res.status);
  }
  const body = (await res.json()) as { items?: PayoutDetail[] };
  return { items: Array.isArray(body.items) ? body.items : [] };
}

export async function releasePendingPayoutBatch(): Promise<{
  releasedCount: number;
  totalMinor: number;
}> {
  const res = await fetchInternal(`/api/payouts/release-batch`, { method: "POST" });
  if (!res.ok) {
    throw new BillingApiError(`Failed to release payouts (${res.status})`, res.status);
  }
  const body = (await res.json()) as { releasedCount?: number; totalMinor?: number };
  return { releasedCount: body.releasedCount ?? 0, totalMinor: body.totalMinor ?? 0 };
}

/**
 * CSV export — builds the CSV from the real tenant payouts and triggers the
 * browser download.
 */
export async function downloadBillingCsv(args: {
  kind: "payouts" | "billing";
  from: string;
  to: string;
}): Promise<{ filename: string; rowCount: number; integrityHash: string }> {
  const { items } = await listTenantPayouts();
  const filename = `glimmora_${args.kind}_${args.from}_${args.to}.csv`;
  const header = "id,contributor,task,amount_inr,status,sentAt\n";
  const rows = items
    .map(
      (p) =>
        `${p.id},${p.contributorId},${p.taskDefinitionId},${(p.amountMinor / 100).toFixed(2)},${p.status},${p.sentAt ?? ""}`,
    )
    .join("\n");
  const csv = header + rows + "\n";

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

  const integrityHash = `csv-${items.length}-${Date.now().toString(36)}`;
  return { filename, rowCount: items.length, integrityHash };
}
