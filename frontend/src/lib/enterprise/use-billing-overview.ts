/**
 * Enterprise V2 — Billing Overview hook.
 *
 * Derives the financial closure layer of the workforce ecosystem from
 * the unified contributor task store + orchestration project mock:
 *
 *   Accepted delivery (Enterprise Review V2)
 *     → billable line item
 *       → grouped per program (SOW)
 *         → synthesized invoice in a state machine
 *           → payout readiness
 *             → operational closure
 *
 * Mock-only. No backend. The "invoice" concept is synthesized
 * deterministically from accepted-task counts + project health, so the
 * billing surface stays in sync with what Enterprise Review accepts.
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import {
  enterpriseProjects,
  type EnterpriseProject,
} from "@/mocks/data/enterprise-v2-orchestration";

export type InvoiceState = "eligible" | "draft" | "sent" | "paid";

export interface BillableLine {
  task: Task;
  /** Payout amount in cents, parsed from task.payoutAmount string. */
  amountCents: number;
  /** When the enterprise accepted (or the activity arrived if not yet decided). */
  acceptedAt: string;
}

export interface ProgramInvoice {
  program: EnterpriseProject;
  state: InvoiceState;
  lines: BillableLine[];
  totalCents: number;
  /** Synthesized invoice id (program-scoped). */
  invoiceId: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  /** Whether budget envelope is breached on this invoice's program. */
  overBudget: boolean;
  /** Days the invoice has been sitting in its current state. */
  daysInState: number;
}

export interface WorkforceComp {
  /** Aggregation key — skill + level, e.g. "React · L3". */
  key: string;
  skill: string;
  level: string;
  unitsPaid: number;
  unitsPending: number;
  /** Total accepted comp, cents. */
  paidCents: number;
  /** Comp on invoiced-but-unpaid lines, cents. */
  pendingCents: number;
}

export interface BillingOverview {
  invoices: ProgramInvoice[];
  /** Lines that are accepted but live on a still-eligible (un-issued) invoice. */
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

  // Counts
  eligibleCount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overBudgetPrograms: number;
}

/* ─────────────────────── Helpers ─────────────────────── */

function parsePayoutCents(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const v = parseFloat(cleaned);
  if (isNaN(v)) return 0;
  // Source is whole dollars; convert to cents.
  return Math.round(v * 100);
}

function deriveInvoiceState(acceptedCount: number, healthCompleted: boolean): InvoiceState {
  if (healthCompleted && acceptedCount >= 1) return "paid";
  if (acceptedCount >= 3) return "sent";
  if (acceptedCount >= 2) return "draft";
  return "eligible";
}

function daysBetween(from: string, to = new Date().toISOString()): number {
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function quarterStart(): Date {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  return new Date(now.getFullYear(), q * 3, 1);
}

/* ─────────────────────── Hook ─────────────────────── */

export function useBillingOverview(): BillingOverview {
  const tasksById = useContributorTasksStore((s) => s.tasksById);

  return React.useMemo(() => {
    const qStart = quarterStart();

    const invoices: ProgramInvoice[] = enterpriseProjects.map((program, programIdx) => {
      // Accepted = enterpriseAccepted OR state === approved
      const acceptedTasks = program.taskIds
        .map((id) => tasksById[id])
        .filter(Boolean)
        .filter(
          (t): t is Task =>
            t!.state === "approved" ||
            (t!.state === "completed" && !!t!.enterpriseAccepted),
        );

      const lines: BillableLine[] = acceptedTasks.map((t) => ({
        task: t,
        amountCents: parsePayoutCents(t.payoutAmount),
        acceptedAt: t.enterpriseDecisionAt ?? t.acceptedAt ?? t.lastActivityAt,
      }));

      const totalCents = lines.reduce((acc, l) => acc + l.amountCents, 0);
      const state = deriveInvoiceState(lines.length, program.health === "completed");
      const overBudget = program.spent > program.budget;

      // Synthesize lifecycle timestamps deterministically from the program's startedAt
      const issuedAt = state !== "eligible" ? program.startedAt : undefined;
      const dueAt =
        state === "draft" || state === "sent"
          ? new Date(new Date(program.startedAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;
      const paidAt = state === "paid" ? program.targetDate : undefined;

      const stateAnchor =
        state === "paid"
          ? paidAt
          : state === "sent"
          ? issuedAt
          : state === "draft"
          ? program.startedAt
          : lines[0]?.acceptedAt ?? program.startedAt;
      const daysInState = daysBetween(stateAnchor ?? program.startedAt);

      return {
        program,
        state,
        lines,
        totalCents,
        invoiceId: `INV-${new Date(program.startedAt).getFullYear() || 2026}-Q${
          Math.floor((new Date(program.startedAt).getMonth() || 0) / 3) + 1
        }-${String(programIdx + 1).padStart(3, "0")}`,
        issuedAt,
        dueAt,
        paidAt,
        overBudget,
        daysInState,
      };
    });

    // Eligibility queue = lines whose invoice is still "eligible"
    const eligibilityQueue: BillableLine[] = invoices
      .filter((i) => i.state === "eligible")
      .flatMap((i) => i.lines);

    /* Workforce compensation rollup — keyed by skill + level */
    const compMap = new Map<string, WorkforceComp>();
    for (const inv of invoices) {
      const paid = inv.state === "paid";
      for (const line of inv.lines) {
        const key = `${line.task.skill} · ${line.task.skillLevel}`;
        const cur =
          compMap.get(key) ??
          ({
            key,
            skill: line.task.skill,
            level: line.task.skillLevel,
            unitsPaid: 0,
            unitsPending: 0,
            paidCents: 0,
            pendingCents: 0,
          } as WorkforceComp);
        if (paid) {
          cur.unitsPaid += 1;
          cur.paidCents += line.amountCents;
        } else {
          cur.unitsPending += 1;
          cur.pendingCents += line.amountCents;
        }
        compMap.set(key, cur);
      }
    }
    const workforce = Array.from(compMap.values()).sort(
      (a, b) => b.paidCents + b.pendingCents - (a.paidCents + a.pendingCents),
    );

    // KPIs
    const allLines = invoices.flatMap((i) => i.lines);
    const acceptedThisQuarterCents = allLines
      .filter((l) => new Date(l.acceptedAt).getTime() >= qStart.getTime())
      .reduce((acc, l) => acc + l.amountCents, 0);

    const invoicedCents = invoices
      .filter((i) => i.state === "sent" || i.state === "paid")
      .reduce((acc, i) => acc + i.totalCents, 0);
    const paidCentsTotal = invoices
      .filter((i) => i.state === "paid")
      .reduce((acc, i) => acc + i.totalCents, 0);
    const outstandingCents = invoicedCents - paidCentsTotal;

    const budgetTotalCents = enterpriseProjects.reduce((acc, p) => acc + p.budget, 0);
    const budgetSpentCents = enterpriseProjects.reduce((acc, p) => acc + p.spent, 0);
    const budgetUtilizationPct =
      budgetTotalCents > 0
        ? Math.round((budgetSpentCents / budgetTotalCents) * 100)
        : 0;

    return {
      invoices,
      eligibilityQueue,
      workforce,
      acceptedThisQuarterCents,
      invoicedCents,
      paidCents: paidCentsTotal,
      outstandingCents,
      budgetTotalCents,
      budgetSpentCents,
      budgetUtilizationPct,
      eligibleCount: invoices.filter((i) => i.state === "eligible").length,
      draftCount: invoices.filter((i) => i.state === "draft").length,
      sentCount: invoices.filter((i) => i.state === "sent").length,
      paidCount: invoices.filter((i) => i.state === "paid").length,
      overBudgetPrograms: invoices.filter((i) => i.overBudget).length,
    };
  }, [tasksById]);
}

/* ─────────────────────── State tone helper ─────────────────────── */

export function invoiceStateTone(s: InvoiceState): { chip: string; label: string; tint: string; ring: string } {
  switch (s) {
    case "eligible":
      return {
        chip: "border-beige-300 bg-beige-100 text-beige-800",
        ring: "ring-beige-200 bg-beige-50",
        tint: "text-beige-700",
        label: "Eligible",
      };
    case "draft":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-800",
        ring: "ring-gold-200 bg-gold-50",
        tint: "text-gold-800",
        label: "Draft",
      };
    case "sent":
      return {
        chip: "border-brown-200 bg-brown-50 text-brown-800",
        ring: "ring-brown-200 bg-brown-50",
        tint: "text-brown-700",
        label: "Sent",
      };
    case "paid":
      return {
        chip: "border-forest-200 bg-forest-50 text-forest-700",
        ring: "ring-forest-200 bg-forest-50",
        tint: "text-forest-700",
        label: "Paid",
      };
  }
}
