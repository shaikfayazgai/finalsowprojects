/**
 * Enterprise billing client — MOCK MODE.
 *
 * Backend handoff: each function below is a thin pass-through to
 * src/lib/enterprise/mocks/payouts.ts. Replace bodies with real fetch()
 * calls once the API ships; UI components/hooks stay unchanged.
 */

import type { PayoutDetail } from "@/lib/payouts/types";
import { listTenantPayoutsMock, releasePendingBatchMock } from "@/lib/enterprise/mocks/payouts";

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

function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function listTenantPayouts(params: {
  status?: string | string[];
} = {}): Promise<{ items: PayoutDetail[] }> {
  return tick(listTenantPayoutsMock(params));
}

export async function releasePendingPayoutBatch(): Promise<{
  releasedCount: number;
  totalMinor: number;
}> {
  return tick(releasePendingBatchMock());
}

/**
 * CSV export — mock generates a small CSV in-memory and triggers the
 * browser download. Backend dev: replace with the streaming endpoint.
 */
export async function downloadBillingCsv(args: {
  kind: "payouts" | "billing";
  from: string;
  to: string;
}): Promise<{ filename: string; rowCount: number; integrityHash: string }> {
  const { items } = listTenantPayoutsMock();
  const filename = `glimmora_${args.kind}_${args.from}_${args.to}.csv`;
  const header = "id,contributor,task,amount_inr,status,sentAt\n";
  const rows = items
    .map((p) => `${p.id},${p.contributorId},${p.taskDefinitionId},${(p.amountMinor / 100).toFixed(2)},${p.status},${p.sentAt ?? ""}`)
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

  const integrityHash = `mock-${Date.now().toString(36)}`;
  return tick({ filename, rowCount: items.length, integrityHash });
}
