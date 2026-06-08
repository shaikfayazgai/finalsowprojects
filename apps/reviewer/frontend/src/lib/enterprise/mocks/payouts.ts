/**
 * Payouts mock data — 14 rows across all statuses so the §5.G.7
 * payouts ledger is rich enough for demo + the "Release pending batch"
 * button enables.
 *
 * Backend handoff:
 *   GET /api/payouts/tenant?status=  → { items: PayoutDetail[] }
 *   POST /api/payouts/release-batch  → { releasedCount, totalMinor }
 */

import type { PayoutDetail, PayoutStatus } from "@/lib/payouts/types";
import { applyOverlay, createOverlayStore } from "./overlay";

const TENANT = "";

function iso(daysAgo: number, hours = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hours, 0, 0, 0);
  return d.toISOString();
}

interface MkP {
  id: string;
  contributor: string;
  taskId: string;
  amountMinor: number;
  status: PayoutStatus;
  eligibleDaysAgo: number;
  requestedDaysAgo?: number;
  processingDaysAgo?: number;
  sentDaysAgo?: number;
  failedDaysAgo?: number;
  onHoldDaysAgo?: number;
  externalRef?: string;
  failureReason?: string;
}

function mk(a: MkP): PayoutDetail {
  return {
    id: a.id,
    contributorId: a.contributor,
    taskDefinitionId: a.taskId,
    submissionId: `sub-${a.taskId}`,
    tenantId: TENANT,
    amountMinor: a.amountMinor,
    currency: "INR",
    computation: {
      currency: "INR",
      ratePerHour: 1200,
      hoursBilled: Math.max(1, Math.round(a.amountMinor / 120_000)),
      amountMinor: a.amountMinor,
      minorMultiplier: 100,
    },
    status: a.status,
    payoutMethodId: a.status === "sent" ? "pm-bank-1" : null,
    externalRef: a.externalRef ?? null,
    failureReason: a.failureReason ?? null,
    eligibleAt: iso(a.eligibleDaysAgo),
    requestedAt: a.requestedDaysAgo != null ? iso(a.requestedDaysAgo) : null,
    processingAt: a.processingDaysAgo != null ? iso(a.processingDaysAgo) : null,
    sentAt: a.sentDaysAgo != null ? iso(a.sentDaysAgo) : null,
    failedAt: a.failedDaysAgo != null ? iso(a.failedDaysAgo) : null,
    onHoldAt: a.onHoldDaysAgo != null ? iso(a.onHoldDaysAgo) : null,
    createdAt: iso(a.eligibleDaysAgo + 1),
    updatedAt: iso(a.sentDaysAgo ?? a.failedDaysAgo ?? a.processingDaysAgo ?? a.requestedDaysAgo ?? a.eligibleDaysAgo),
  };
}

const SEED: PayoutDetail[] = [];

const overlay = createOverlayStore<PayoutDetail>("glimmora.mock.payouts.v1");

function merged(): PayoutDetail[] {
  return applyOverlay<PayoutDetail>(SEED, overlay.read());
}

export function listTenantPayoutsMock(params: { status?: string | string[] } = {}): { items: PayoutDetail[] } {
  let items = merged();
  if (params.status) {
    const allowed = Array.isArray(params.status) ? new Set(params.status) : new Set([params.status]);
    items = items.filter((p) => allowed.has(p.status));
  }
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { items };
}

export function getPayoutMock(id: string): PayoutDetail | undefined {
  return merged().find((p) => p.id === id);
}

/** "Release pending batch" — flips all `eligible` rows to `requested`. */
export function releasePendingBatchMock(): { releasedCount: number; totalMinor: number } {
  const eligible = merged().filter((p) => p.status === "eligible");
  const now = new Date().toISOString();
  let total = 0;
  for (const p of eligible) {
    overlay.patch(p.id, { status: "requested", requestedAt: now, updatedAt: now });
    total += p.amountMinor;
  }
  return { releasedCount: eligible.length, totalMinor: total };
}

export { overlay as payoutOverlay };
