/**
 * Billing v3 — explicit 7-state invoice lifecycle.
 *
 * Reuses the v2 derivation (lines from accepted tasks, totals from
 * task payouts, budget from projects) as the *base*, then merges the
 * persisted billing-store metadata to produce a final invoice with an
 * explicit state, approvals, disputes, audit, and edge-case flags.
 *
 * No new mock data is introduced — when the store has no metadata for
 * a derived invoice, the v3 state is mapped from the v2 state
 * (eligible | draft | sent | paid → eligible | draft | sent | paid).
 */

"use client";

import * as React from "react";
import {
  useBillingOverview,
  type ProgramInvoice as V2ProgramInvoice,
  type BillingOverview as V2BillingOverview,
  type BillableLine,
  type WorkforceComp,
} from "./use-billing-overview";
import { useBillingStore } from "@/lib/stores/billing-store";
import type {
  ApprovalRecord,
  DisputeRecord,
  InvoiceAuditEntry,
  InvoiceFlag,
  InvoiceMetadata,
  InvoiceState,
} from "@/types/billing";

export type { BillableLine, WorkforceComp };

export interface InvoiceV3 {
  /** Derived base from v2 — program, lines, totals, budget. */
  base: V2ProgramInvoice;
  /** Final state — store override or v2-derived fallback. */
  state: InvoiceState;
  flags: InvoiceFlag[];
  approvals: ApprovalRecord[];
  disputes: DisputeRecord[];
  audit: InvoiceAuditEntry[];

  /** Lifecycle timestamps (preferring store overrides over v2-derived). */
  draftedAt?: string;
  submittedForApprovalAt?: string;
  approvedAt?: string;
  sentAt?: string;
  paidAt?: string;
  reconciledAt?: string;

  /** Snapshot of due date (override → v2 derived). */
  dueAt?: string;
  /** Total cents — base.totalCents + recorded tax. */
  totalCents: number;
  taxCents: number;
  paidCents: number;
  outstandingCents: number;

  /** Days the invoice has been sitting in its current state. */
  daysInState: number;

  /** Whether the invoice has crossed the overdue threshold. */
  overdue: boolean;
  /** When overdue, hours past due. */
  hoursOverdue: number;
}

export interface BillingOverviewV3 {
  invoices: InvoiceV3[];
  eligibilityQueue: BillableLine[];
  workforce: WorkforceComp[];

  // Headline KPIs (cents)
  acceptedThisQuarterCents: number;
  invoicedCents: number;
  paidCents: number;
  outstandingCents: number;
  budgetTotalCents: number;
  budgetSpentCents: number;
  budgetUtilizationPct: number;

  // Counts by v3 state
  counts: Record<InvoiceState, number>;
  overdueCount: number;
  disputedCount: number;
  onHoldCount: number;
  overBudgetPrograms: number;

  /** Whatever the underlying v2 hook returned, for callers that still need it. */
  raw: V2BillingOverview;
}

const OVERDUE_HOURS = 48;

function fallbackState(v2: V2ProgramInvoice["state"]): InvoiceState {
  switch (v2) {
    case "eligible":
      return "eligible";
    case "draft":
      return "draft";
    case "sent":
      return "sent";
    case "paid":
      return "paid";
  }
}

function hoursSince(raw?: string): number {
  if (!raw) return 0;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, (Date.now() - d.getTime()) / 36e5);
}

function daysSince(raw?: string): number {
  return Math.floor(hoursSince(raw) / 24);
}

export function useBillingOverviewV3(): BillingOverviewV3 {
  const raw = useBillingOverview();
  const metaById = useBillingStore((s) => s.metaById);

  return React.useMemo(() => {
    const invoices: InvoiceV3[] = raw.invoices.map((inv) => {
      const meta: InvoiceMetadata | undefined = metaById[inv.invoiceId];
      const state = meta?.state ?? fallbackState(inv.state);
      const taxCents = meta?.taxCents ?? 0;
      const paidCents = meta?.paidCents ?? (state === "paid" || state === "reconciled" ? inv.totalCents : 0);
      const totalCents = inv.totalCents + taxCents;
      const outstandingCents = Math.max(0, totalCents - paidCents);

      const dueAt = meta?.dueAtOverride ?? inv.dueAt;
      const hoursOver = state === "sent" && dueAt ? hoursSince(dueAt) : 0;
      const overdue = hoursOver > OVERDUE_HOURS && outstandingCents > 0;

      const flags: InvoiceFlag[] = meta?.flags ? [...meta.flags] : [];
      if (overdue && !flags.includes("overdue")) flags.push("overdue");
      if (paidCents > 0 && outstandingCents > 0 && !flags.includes("partial_payment"))
        flags.push("partial_payment");
      if (inv.overBudget && !flags.includes("budget_overrun")) flags.push("budget_overrun");

      // Stage anchor for "days in state" calculation
      const anchor =
        state === "paid"
          ? meta?.paidAt ?? inv.paidAt
          : state === "sent"
            ? meta?.sentAt ?? inv.issuedAt
            : state === "approved"
              ? meta?.approvedAt
              : state === "pending_approval"
                ? meta?.submittedForApprovalAt
                : state === "draft"
                  ? meta?.draftedAt ?? inv.issuedAt
                  : state === "reconciled"
                    ? meta?.reconciledAt
                    : inv.lines[0]?.acceptedAt;

      return {
        base: inv,
        state,
        flags,
        approvals: meta?.approvals ?? [],
        disputes: meta?.disputes ?? [],
        audit: meta?.audit ?? [],
        draftedAt: meta?.draftedAt ?? inv.issuedAt,
        submittedForApprovalAt: meta?.submittedForApprovalAt,
        approvedAt: meta?.approvedAt,
        sentAt: meta?.sentAt ?? inv.issuedAt,
        paidAt: meta?.paidAt ?? inv.paidAt,
        reconciledAt: meta?.reconciledAt,
        dueAt,
        totalCents,
        taxCents,
        paidCents,
        outstandingCents,
        daysInState: daysSince(anchor),
        overdue,
        hoursOverdue: overdue ? Math.round(hoursOver - OVERDUE_HOURS) : 0,
      };
    });

    const counts: Record<InvoiceState, number> = {
      eligible: 0,
      draft: 0,
      pending_approval: 0,
      approved: 0,
      sent: 0,
      paid: 0,
      reconciled: 0,
    };
    invoices.forEach((i) => {
      counts[i.state] += 1;
    });

    const overdueCount = invoices.filter((i) => i.overdue).length;
    const disputedCount = invoices.filter((i) => i.flags.includes("disputed")).length;
    const onHoldCount = invoices.filter((i) => i.flags.includes("on_hold")).length;

    return {
      invoices,
      eligibilityQueue: raw.eligibilityQueue,
      workforce: raw.workforce,
      acceptedThisQuarterCents: raw.acceptedThisQuarterCents,
      invoicedCents: raw.invoicedCents,
      paidCents: raw.paidCents,
      outstandingCents: raw.outstandingCents,
      budgetTotalCents: raw.budgetTotalCents,
      budgetSpentCents: raw.budgetSpentCents,
      budgetUtilizationPct: raw.budgetUtilizationPct,
      counts,
      overdueCount,
      disputedCount,
      onHoldCount,
      overBudgetPrograms: raw.overBudgetPrograms,
      raw,
    };
  }, [raw, metaById]);
}
