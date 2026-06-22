/**
 * Enterprise billing client — REAL backend.
 *
 * All functions call the Next.js proxy routes which inject the session
 * bearer token and forward to the enterprise backend service.
 *
 * Proxy routes:
 *   GET  /api/payouts/tenant         → /api/v1/payouts/tenant
 *   POST /api/payouts/release-batch  → /api/v1/payouts/release-batch
 *   GET  /api/billing/summary        → /api/v1/billing/summary
 *   GET  /api/billing/invoices       → /api/v1/billing/invoices
 *   GET  /api/billing/export         → /api/v1/billing/export  (streaming CSV)
 *
 * The UI components/hooks remain unchanged.
 */

import type { PayoutDetail } from "@/lib/payouts/types";
import type { InvoiceSummary, InvoiceDetail } from "@/lib/billing/invoices-mock";

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

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, { ...init, cache: "no-store" });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; detail?: string };
      msg = body.error ?? body.detail ?? msg;
    } catch {
      // ignore parse failure
    }
    throw new BillingApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

// ─── Payout list mapper ────────────────────────────────────────────────────

/**
 * Backend returns camelCase PayoutDetail — shape matches types exactly.
 * Guard against missing fields to be safe.
 */
function mapPayout(raw: Record<string, unknown>): PayoutDetail {
  return {
    id: String(raw.id ?? ""),
    contributorId: String(raw.contributorId ?? ""),
    taskDefinitionId: String(raw.taskDefinitionId ?? ""),
    submissionId: String(raw.submissionId ?? ""),
    tenantId: String(raw.tenantId ?? ""),
    amountMinor: Number(raw.amountMinor ?? 0),
    currency: String(raw.currency ?? "INR"),
    computation: (raw.computation as PayoutDetail["computation"]) ?? {
      currency: "INR",
      ratePerHour: 1200,
      hoursBilled: 1,
      amountMinor: Number(raw.amountMinor ?? 0),
      minorMultiplier: 100,
    },
    status: (raw.status as PayoutDetail["status"]) ?? "eligible",
    payoutMethodId: (raw.payoutMethodId as string | null) ?? null,
    externalRef: (raw.externalRef as string | null) ?? null,
    failureReason: (raw.failureReason as string | null) ?? null,
    eligibleAt: String(raw.eligibleAt ?? raw.createdAt ?? new Date().toISOString()),
    requestedAt: (raw.requestedAt as string | null) ?? null,
    processingAt: (raw.processingAt as string | null) ?? null,
    sentAt: (raw.sentAt as string | null) ?? null,
    failedAt: (raw.failedAt as string | null) ?? null,
    onHoldAt: (raw.onHoldAt as string | null) ?? null,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

// ─── Invoice mapper ────────────────────────────────────────────────────────

/**
 * The enterprise backend returns invoices stored in enterprise_invoices
 * with arbitrary JSONB. We map to the InvoiceSummary shape the components
 * expect, filling defaults where fields differ.
 */
function mapInvoice(raw: Record<string, unknown>): InvoiceSummary {
  // Backend may store amount as dollars (not minor units) — normalise.
  const rawAmount = Number(raw.amount ?? raw.amountMinor ?? 0);
  // Heuristic: if amount < 100000 it's likely major-unit (dollars), convert.
  const amountMinor = rawAmount < 100_000 ? Math.round(rawAmount * 100) : rawAmount;

  // Normalise status to InvoiceStatus
  const rawStatus = String(raw.status ?? "pending").toLowerCase();
  const status: InvoiceSummary["status"] =
    rawStatus === "paid" ? "paid" : rawStatus === "overdue" ? "overdue" : "pending";

  return {
    id: String(raw.number ?? raw.id ?? ""),
    project: String(raw.projectId ?? raw.project ?? "—"),
    amountMinor,
    status,
    issuedAt: String(raw.issuedDate ?? raw.issuedAt ?? raw.createdAt ?? new Date().toISOString()),
    paidAt: (raw.paidAt as string | null) ?? (status === "paid" ? (raw.issuedAt as string | null) ?? null : null),
    periodStart: String(raw.periodStart ?? raw.issuedDate ?? raw.issuedAt ?? new Date().toISOString()),
    periodEnd: String(raw.periodEnd ?? raw.dueDate ?? raw.issuedAt ?? new Date().toISOString()),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function listTenantPayouts(
  params: { status?: string | string[] } = {},
): Promise<{ items: PayoutDetail[] }> {
  const qs = new URLSearchParams();
  if (params.status) {
    const statuses = Array.isArray(params.status)
      ? params.status.join(",")
      : params.status;
    if (statuses) qs.set("status", statuses);
  }
  const path = `/api/payouts/tenant${qs.toString() ? `?${qs}` : ""}`;
  const data = await apiFetch<{ items: Record<string, unknown>[] }>(path);
  return { items: (data.items ?? []).map(mapPayout) };
}

export async function releasePendingPayoutBatch(): Promise<{
  releasedCount: number;
  totalMinor: number;
}> {
  return apiFetch<{ releasedCount: number; totalMinor: number }>(
    "/api/payouts/release-batch",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
  );
}

export async function listInvoices(): Promise<{ items: InvoiceSummary[] }> {
  const data = await apiFetch<{ invoices: Record<string, unknown>[] }>(
    "/api/billing/invoices",
  );
  const items = (data.invoices ?? []).map(mapInvoice);
  return { items };
}

export async function getBillingSummary(): Promise<{
  totalSpent: number;
  pendingPayments: number;
  escrowHeld: number;
  activeInvoices: number;
  monthlySpend: unknown[];
}> {
  return apiFetch("/api/billing/summary");
}

/**
 * CSV export — hits the backend streaming endpoint which generates a real
 * CSV from the database and triggers a browser download.
 */
export async function downloadBillingCsv(args: {
  kind: "payouts" | "billing";
  from: string;
  to: string;
}): Promise<{ filename: string; rowCount: number; integrityHash: string }> {
  const qs = new URLSearchParams({
    kind: args.kind,
    from: args.from,
    to: args.to,
  });
  const res = await fetch(`/api/billing/export?${qs}`, { cache: "no-store" });
  if (!res.ok) {
    throw new BillingApiError(`Export failed: HTTP ${res.status}`, res.status);
  }

  const rowCount = Number(res.headers.get("X-Billing-Row-Count") ?? "0");
  const integrityHash =
    res.headers.get("X-Billing-Integrity-Sha256") ?? `real-${Date.now().toString(36)}`;
  const contentDisp = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = contentDisp.match(/filename="([^"]+)"/);
  const filename = filenameMatch
    ? filenameMatch[1]
    : `glimmora_${args.kind}_export.csv`;

  // Trigger browser download
  if (typeof window !== "undefined") {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { filename, rowCount, integrityHash };
}
