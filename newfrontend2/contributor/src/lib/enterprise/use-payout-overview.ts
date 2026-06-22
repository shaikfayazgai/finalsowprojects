/**
 * Payout governance overview — derives batches + failed + on-hold lists
 * from the unified task store. Each accepted (or paid) line generates a
 * payout entry; entries are bucketed into weekly batches. Edge states
 * (failed transfer, KYC hold, beneficiary mismatch) are synthesized
 * deterministically from task identifiers so the demo renders a varied
 * but stable picture.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import { useBillingStore } from "@/lib/stores/billing-store";
import type {
  PayoutBatch,
  PayoutBatchState,
  PayoutEntry,
} from "@/types/billing";

export interface PayoutOverview {
  batches: PayoutBatch[];
  failed: PayoutEntry[];
  onHold: PayoutEntry[];
  readyCount: number;
  inFlightCount: number;
  failedCount: number;
  onHoldCount: number;
  readyCents: number;
  inFlightCents: number;
  totalContributors: number;
}

const HOLD_REASONS = [
  "KYC pending",
  "Beneficiary mismatch",
  "Tax form missing",
] as const;
const FAILED_REASONS = [
  "Beneficiary mismatch",
  "Bank account closed",
  "Compliance review",
] as const;

function parsePayoutCents(raw?: string): number {
  if (!raw) return 0;
  const v = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(v) ? 0 : Math.round(v * 100);
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "BAT-unknown";
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const year = monday.getFullYear();
  const start = new Date(year, 0, 1);
  const day = Math.floor((monday.getTime() - start.getTime()) / 86400000);
  const week = Math.max(1, Math.ceil((day + start.getDay() + 1) / 7));
  return `BAT-${year}-W${String(week).padStart(2, "0")}`;
}

// Stable hash so a given task always maps to the same edge state.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function entryStateFor(task: Task): {
  state: PayoutEntry["state"];
  holdReason?: string;
} {
  const h = hash(task.id);
  // Reserve ~12% for failed, ~8% for on_hold, rest ready/in_flight.
  if (h % 100 < 8) {
    return { state: "on_hold", holdReason: HOLD_REASONS[h % HOLD_REASONS.length] };
  }
  if (h % 100 < 18) {
    return { state: "failed", holdReason: FAILED_REASONS[h % FAILED_REASONS.length] };
  }
  if (task.state === "approved") return { state: "completed" };
  return { state: "ready" };
}

function batchStateFromEntries(entries: PayoutEntry[]): PayoutBatchState {
  if (entries.length === 0) return "preparing";
  if (entries.every((e) => e.state === "completed")) return "completed";
  if (entries.some((e) => e.state === "in_flight")) return "in_flight";
  if (entries.every((e) => e.state === "on_hold" || e.state === "failed")) return "on_hold";
  return "ready";
}

export function usePayoutOverview(): PayoutOverview {
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  const storeBatches = useBillingStore((s) => s.payoutBatches);

  return React.useMemo(() => {
    const derived: Record<string, PayoutBatch> = {};

    Object.values(tasksById)
      .filter(
        (t): t is Task =>
          t.state === "approved" || (t.state === "completed" && !!t.enterpriseAccepted),
      )
      .forEach((t) => {
        const anchor = t.enterpriseDecisionAt ?? t.acceptedAt ?? t.lastActivityAt;
        const key = weekKey(anchor);
        const entry: PayoutEntry = {
          id: `pe-${t.id}`,
          contributorName: t.mentor?.name ?? "Contributor",
          contributorInitials: t.mentor?.initials ?? "??",
          sourceTaskId: t.id,
          amountCents: parsePayoutCents(t.payoutAmount),
          ...entryStateFor(t),
        };
        if (!derived[key]) {
          derived[key] = {
            id: key,
            label: key,
            state: "preparing",
            createdAt: anchor,
            entries: [],
            totalCents: 0,
          };
        }
        derived[key].entries.push(entry);
        derived[key].totalCents += entry.amountCents;
      });

    // Apply store overrides + finalize batch state
    const batchList = Object.values(derived).map<PayoutBatch>((b) => {
      const stored = storeBatches.find((sb) => sb.id === b.id);
      if (stored) return { ...b, ...stored, entries: b.entries };
      return { ...b, state: batchStateFromEntries(b.entries) };
    });

    batchList.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const allEntries = batchList.flatMap((b) => b.entries);
    const ready = allEntries.filter((e) => e.state === "ready");
    const inFlight = allEntries.filter((e) => e.state === "in_flight");
    const failed = allEntries.filter((e) => e.state === "failed");
    const onHold = allEntries.filter((e) => e.state === "on_hold");

    return {
      batches: batchList,
      failed,
      onHold,
      readyCount: ready.length,
      inFlightCount: inFlight.length,
      failedCount: failed.length,
      onHoldCount: onHold.length,
      readyCents: ready.reduce((a, e) => a + e.amountCents, 0),
      inFlightCents: inFlight.reduce((a, e) => a + e.amountCents, 0),
      totalContributors: new Set(allEntries.map((e) => e.contributorName)).size,
    };
  }, [tasksById, storeBatches]);
}
