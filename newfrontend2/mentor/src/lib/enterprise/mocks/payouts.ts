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

const TENANT = "tnt-acme-corp";

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

const SEED: PayoutDetail[] = [
  mk({ id: "po-1001", contributor: "u-sneha",   taskId: "task-1-t1", amountMinor: 2_160_000, status: "sent",    eligibleDaysAgo: 14, requestedDaysAgo: 12, processingDaysAgo: 11, sentDaysAgo: 10, externalRef: "RZP-X-9001" }),
  mk({ id: "po-1002", contributor: "u-yusuf",   taskId: "task-1-t2", amountMinor: 1_440_000, status: "sent",    eligibleDaysAgo: 12, requestedDaysAgo: 11, processingDaysAgo: 10, sentDaysAgo: 9,  externalRef: "RZP-X-9002" }),
  mk({ id: "po-1003", contributor: "u-priya",   taskId: "task-5-t1", amountMinor: 1_680_000, status: "sent",    eligibleDaysAgo: 18, requestedDaysAgo: 16, processingDaysAgo: 15, sentDaysAgo: 14, externalRef: "RZP-X-9003" }),
  mk({ id: "po-1004", contributor: "u-amit",    taskId: "task-1-t3", amountMinor: 2_880_000, status: "processing", eligibleDaysAgo: 6, requestedDaysAgo: 4, processingDaysAgo: 2 }),
  mk({ id: "po-1005", contributor: "u-kavya",   taskId: "task-1-t4", amountMinor: 1_920_000, status: "processing", eligibleDaysAgo: 5, requestedDaysAgo: 3, processingDaysAgo: 1 }),
  mk({ id: "po-1006", contributor: "u-rohit",   taskId: "task-5-t2", amountMinor: 2_640_000, status: "requested",  eligibleDaysAgo: 3, requestedDaysAgo: 1 }),
  mk({ id: "po-1007", contributor: "u-divya",   taskId: "task-1-t5", amountMinor: 2_400_000, status: "eligible", eligibleDaysAgo: 2 }),
  mk({ id: "po-1008", contributor: "u-arjun",   taskId: "task-1-t6", amountMinor:   960_000, status: "eligible", eligibleDaysAgo: 1 }),
  mk({ id: "po-1009", contributor: "u-meera",   taskId: "task-10-t1", amountMinor: 1_200_000, status: "eligible", eligibleDaysAgo: 0 }),
  mk({ id: "po-1010", contributor: "u-vikram",  taskId: "task-10-t2", amountMinor: 1_680_000, status: "eligible", eligibleDaysAgo: 0 }),
  mk({ id: "po-1011", contributor: "u-anjali",  taskId: "task-5-t3", amountMinor: 2_160_000, status: "on_hold",  eligibleDaysAgo: 7, requestedDaysAgo: 6, onHoldDaysAgo: 5, failureReason: "KYC re-verification required" }),
  mk({ id: "po-1012", contributor: "u-sandeep", taskId: "task-2-t1", amountMinor: 1_440_000, status: "failed",   eligibleDaysAgo: 9, requestedDaysAgo: 8, processingDaysAgo: 7, failedDaysAgo: 6, failureReason: "Bank account closed; new method needed" }),
  mk({ id: "po-1013", contributor: "u-pooja",   taskId: "task-2-t2", amountMinor: 1_680_000, status: "sent",     eligibleDaysAgo: 25, requestedDaysAgo: 23, processingDaysAgo: 22, sentDaysAgo: 21, externalRef: "RZP-X-8954" }),
  mk({ id: "po-1014", contributor: "u-rahul",   taskId: "task-7-t1", amountMinor: 1_920_000, status: "sent",     eligibleDaysAgo: 30, requestedDaysAgo: 28, processingDaysAgo: 27, sentDaysAgo: 26, externalRef: "RZP-X-8901" }),
];

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
