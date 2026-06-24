"use client";

/**
 * Glimmora · 3-party payout, rendered INLINE on each pricing row.
 *  - usePlanPayout(planId): fetches per-task delivery + payout status from the
 *    enterprise API and exposes the per-task actions.
 *  - PayoutSummary: compact plan-level progress bar + phase.
 *  - TaskPayoutControl: per-task status chip + contextual button (activates only
 *    once the task is delivered). All state persists in the DB — no mock.
 */

import * as React from "react";
import { Send, Wallet, CheckCircle2, Clock } from "lucide-react";
import {
  getPayoutStatus, requestPayout, payoutContributors, requestTopup,
  type PayoutStatus, type PayoutTask,
} from "@/lib/api/decomposition-v2";
import { deliveryCell } from "@/lib/delivery/status-matrix";

const inr = (m: number) => "₹" + (m / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const PHASE: Record<PayoutStatus["paymentPhase"], { label: string; tone: string }> = {
  in_progress: { label: "In delivery", tone: "bg-info-subtle text-info-text" },
  completed_sow: { label: "Delivered", tone: "bg-success-subtle text-success-text" },
  pending_payment: { label: "Payment in progress", tone: "bg-warning-subtle text-warning-text" },
  payment_completed: { label: "Paid", tone: "bg-brand-subtle text-brand-emphasis" },
};

const DELIVERY_LABEL: Record<string, string> = {
  ready: "Ready to assign", assigned: "Assigned", in_progress: "In progress", declined: "Declined",
  req_check_pending: "Requirement check", req_check_rework: "Rework", req_check_failed: "Failed",
  qa_review_pending: "QA review", qa_review_rework: "QA rework", qa_review_failed: "QA failed",
  payment_pending: "Delivered", paid: "Paid",
};
const deliveryLabel = (s: string) => DELIVERY_LABEL[s] ?? s.replace(/_/g, " ");

export interface PlanPayout {
  status: PayoutStatus | null;
  byTask: Record<string, PayoutTask>;
  busy: string | null;
  error: string;
  reload: () => void;
  request: (taskId: string) => Promise<void>;
  requestAll: (amountMinor?: number) => Promise<void>;
  payout: (taskId: string) => Promise<void>;
}

export function usePlanPayout(planId: string, enabled = true): PlanPayout {
  const [status, setStatus] = React.useState<PayoutStatus | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const reload = React.useCallback(() => {
    if (!enabled || !planId) return;
    getPayoutStatus(planId).then(setStatus).catch(() => {});
  }, [planId, enabled]);

  React.useEffect(() => { reload(); }, [reload]);

  const byTask = React.useMemo(() => {
    const m: Record<string, PayoutTask> = {};
    for (const t of status?.tasks ?? []) m[t.taskId] = t;
    return m;
  }, [status]);

  const run = React.useCallback(async (key: string, fn: () => Promise<{ status: PayoutStatus }>) => {
    setBusy(key); setError("");
    try { const r = await fn(); setStatus(r.status); }
    catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(null); }
  }, []);

  const request = React.useCallback((taskId: string) => run(`req:${taskId}`, () => requestPayout(planId, { taskId })), [run, planId]);
  const requestAll = React.useCallback(
    (amountMinor?: number) => run("req:all", () => requestPayout(planId, amountMinor != null ? { amountMinor } : undefined)),
    [run, planId],
  );
  const payout = React.useCallback((taskId: string) => run(`pay:${taskId}`, () => payoutContributors(planId, taskId)), [run, planId]);

  return { status, byTask, busy, error, reload, request, requestAll, payout };
}

export function PayoutSummary({ status, error, busy, onRequestAll, enterprisePriceMinor }: {
  status: PayoutStatus;
  error?: string;
  busy?: string | null;
  onRequestAll?: (amountMinor?: number) => void;
  enterprisePriceMinor?: number; // GST-inclusive total the enterprise must fund (drives top-up math)
}) {
  const [amt, setAmt] = React.useState(""); // custom request amount, in rupees
  const [topup, setTopup] = React.useState<"idle" | "requesting" | "done">("idle");
  const [topupAmt, setTopupAmt] = React.useState(""); // top-up amount, in rupees
  const [topupNote, setTopupNote] = React.useState(""); // optional note for the enterprise
  if (status.totalTasks === 0) return null;
  const phase = PHASE[status.paymentPhase];
  const tasks = status.tasks ?? [];
  // Completed tasks not yet requested from the enterprise.
  const eligible = tasks.filter((t) => t.payoutStatus === "eligible");
  const eligibleMinor = eligible.reduce((a, t) => a + (t.budgetMinor || 0), 0);
  const totalMinor = status.budgetMinor || tasks.reduce((a, t) => a + (t.budgetMinor || 0), 0);
  const settledMinor = tasks
    .filter((t) => t.payoutStatus === "released" || t.payoutStatus === "paid")
    .reduce((a, t) => a + (t.budgetMinor || 0), 0);
  const remainingMinor = Math.max(0, totalMinor - settledMinor);

  // Quick-fill presets (in rupees) for the request amount.
  const presets = [
    { key: "completed", label: "Completed tasks", minor: eligibleMinor },
    { key: "remaining", label: "Remaining balance", minor: remainingMinor },
    { key: "total", label: "Total", minor: totalMinor },
  ].filter((p) => p.minor > 0);

  const customMinor = amt.trim() ? Math.round(Number(amt) * 100) : null;
  // A custom amount BELOW the eligible total = partial request; otherwise request all eligible.
  const cap =
    customMinor != null && !Number.isNaN(customMinor) && customMinor > 0 && customMinor < eligibleMinor
      ? customMinor
      : undefined;

  // SOW funding (top-up) math: the enterprise must fund the GST-inclusive final
  // price; compare against what they've released. Fully funded → top-up disabled.
  const fundedMinor = status.escrow?.fundedMinor ?? 0;
  const fundTarget = enterprisePriceMinor ?? 0;
  const topupShortfall = fundTarget > 0 ? Math.max(0, fundTarget - fundedMinor) : 0;
  const fullyFunded = fundTarget > 0 && fundedMinor >= fundTarget;
  const topupMinor = topupAmt.trim()
    ? Math.round(Number(topupAmt) * 100)
    : (topupShortfall > 0 ? topupShortfall : undefined);

  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="font-body text-[12.5px] font-semibold text-foreground">Delivery &amp; payout</h2>
        <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${phase.tone}`}>{phase.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-bg-subtle overflow-hidden">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.max(0, status.progressPct))}%` }} />
        </div>
        <span className="font-body text-[11px] text-text-tertiary tabular-nums">
          {status.deliveredTasks}/{status.totalTasks} delivered{status.paidTasks ? ` · ${status.paidTasks} paid` : ""}
        </span>
      </div>
      {status.escrow && status.escrow.fundedMinor > 0 ? (
        <div className="pt-2 border-t border-stroke-subtle/60 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-text-tertiary" aria-hidden />
            <span className="font-body text-[11.5px] font-semibold text-foreground">SOW funds · pre-funded by enterprise</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-[11px] text-text-secondary">
            <span>Released <b className="text-foreground tabular-nums">{inr(status.escrow.fundedMinor)}</b></span>
            <span>Drawn <b className="text-foreground tabular-nums">{inr(status.escrow.spentMinor)}</b></span>
            <span>Available <b className="tabular-nums" style={{ color: status.escrow.remainingMinor > 0 ? "#0F9D6B" : "#D97706" }}>{inr(status.escrow.remainingMinor)}</b></span>
            {fundTarget > 0 ? (
              <span>{fullyFunded ? "Fully funded" : "Remaining to fund"} <b className="tabular-nums" style={{ color: fullyFunded ? "#0F9D6B" : "#D97706" }}>{inr(topupShortfall)}</b></span>
            ) : null}
          </div>
          {fullyFunded ? (
            <button type="button" disabled className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stroke text-success-text font-body text-[11.5px] font-semibold opacity-70 cursor-not-allowed">
              <CheckCircle2 className="h-3.5 w-3.5" /> Fully funded ✓
            </button>
          ) : (
            <>
              {topupShortfall > 0 ? (
                <button
                  type="button"
                  onClick={() => setTopupAmt(String(Math.round(topupShortfall / 100)))}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-body text-[11px] transition-colors ${topupMinor === topupShortfall && topupAmt.trim() ? "border-brand bg-brand-subtle text-brand-emphasis" : "border-stroke text-text-secondary hover:bg-surface-hover"}`}
                >
                  Remaining balance <span className="tabular-nums opacity-80">{inr(topupShortfall)}</span>
                </button>
              ) : null}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-stroke px-2 h-8 flex-1 min-w-0">
                  <span className="font-body text-[12px] text-text-tertiary">₹</span>
                  <input
                    type="number" min={0} value={topupAmt}
                    onChange={(e) => setTopupAmt(e.target.value)}
                    placeholder={topupShortfall > 0 ? `Custom · default remaining (${inr(topupShortfall)})` : "Custom amount"}
                    className="w-full bg-transparent font-body text-[12px] tabular-nums text-foreground outline-none placeholder:text-text-disabled"
                  />
                </div>
                <button
                  type="button"
                  disabled={topup === "requesting"}
                  onClick={async () => {
                    setTopup("requesting");
                    try { await requestTopup(status.planId, topupMinor, topupNote.trim() || undefined); setTopup("done"); }
                    catch { setTopup("idle"); }
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stroke text-text-secondary font-body text-[11.5px] font-semibold hover:bg-surface-hover disabled:opacity-50 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  {topup === "done" ? "Top-up requested ✓" : topup === "requesting" ? "Requesting…" : "Request top-up"}
                </button>
              </div>
              <input
                type="text" value={topupNote}
                onChange={(e) => setTopupNote(e.target.value)}
                placeholder="Add a note for the enterprise (optional)"
                className="w-full h-8 rounded-lg border border-stroke-subtle bg-surface px-2.5 font-body text-[11.5px] text-foreground outline-none focus:ring-2 focus:ring-brand/30 placeholder:text-text-tertiary"
              />
            </>
          )}
        </div>
      ) : null}
      {eligible.length > 0 && onRequestAll ? (
        <div className="space-y-2 pt-2 border-t border-stroke-subtle/60">
          <p className="font-body text-[11.5px] text-text-secondary">
            Request payment from the enterprise — {eligible.length} completed task{eligible.length === 1 ? "" : "s"} ready ({inr(eligibleMinor)}).
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map((p) => {
              const active = customMinor === p.minor;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setAmt(String(Math.round(p.minor / 100)))}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-body text-[11px] transition-colors ${active ? "border-brand bg-brand-subtle text-brand-emphasis" : "border-stroke text-text-secondary hover:bg-surface-hover"}`}
                >
                  {p.label} <span className="tabular-nums opacity-80">{inr(p.minor)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-stroke px-2 h-8 flex-1 min-w-0">
              <span className="font-body text-[12px] text-text-tertiary">₹</span>
              <input
                type="number"
                min={0}
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                placeholder={`Custom amount · default all (${inr(eligibleMinor)})`}
                className="w-full bg-transparent font-body text-[12px] tabular-nums text-foreground outline-none placeholder:text-text-disabled"
              />
            </div>
            <button
              type="button"
              disabled={busy === "req:all"}
              onClick={() => onRequestAll(cap)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand text-on-brand font-body text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
            >
              <Send className="h-3.5 w-3.5" /> {busy === "req:all" ? "Requesting…" : "Request payment"}
            </button>
          </div>
          <p className="font-body text-[10.5px] text-text-tertiary">
            {cap != null
              ? `Will request whole completed tasks up to ${inr(cap)}.`
              : `Will request all completed tasks (${inr(eligibleMinor)}). Enter a smaller amount for a partial request.`}
          </p>
        </div>
      ) : null}
      {error ? <p className="font-body text-[11px] text-error-text">{error}</p> : null}
    </div>
  );
}

export const taskIsPaid = (t?: PayoutTask) =>
  !!t && (t.payoutStatus === "paid" || t.deliveryStatus === "paid");

// Contributor pay is LOCKED once a contributor is assigned — Glimmora can no
// longer change the price (mirrors the backend's _PRICE_LOCKED_STATUSES). The
// price input is read-only for any task in these states.
const PRICE_LOCKED_STATUSES = new Set<string>([
  "assigned", "in_progress", "submitted", "req_check_pending", "req_check_failed",
  "qa_review_pending", "qa_review_failed", "payment_pending", "paid",
]);
export const taskPriceLocked = (t?: PayoutTask) =>
  !!t && (PRICE_LOCKED_STATUSES.has(t.deliveryStatus) || t.payoutStatus === "paid");

/**
 * STATUS columns — rendered BETWEEN the task title and the pricing inputs:
 *   col 1 = actual task lifecycle status (the label the enterprise sees)
 *   col 2 = payout sub-state + budget
 */
export function TaskStatusCells({ task }: { task?: PayoutTask }) {
  if (!task) {
    return (<><span className="w-[150px] shrink-0" /><span className="w-[110px] shrink-0" /></>);
  }
  const life = deliveryCell(task.deliveryStatus, "enterprise");
  let chip: { label: string; tone: string };
  if (taskIsPaid(task)) chip = { label: "Paid", tone: "bg-brand-subtle text-brand-emphasis" };
  else if (task.payoutStatus === "released") chip = { label: "Released", tone: "bg-info-subtle text-info-text" };
  else if (task.payoutStatus === "requested") chip = { label: "Requested", tone: "bg-warning-subtle text-warning-text" };
  else if (task.payoutStatus === "eligible") chip = { label: "Eligible", tone: "bg-success-subtle text-success-text" };
  else chip = { label: "—", tone: "bg-bg-subtle text-text-tertiary" };
  return (
    <>
      <div className="w-[150px] shrink-0">
        <span className="block font-body text-[9px] font-semibold uppercase tracking-wide text-text-disabled">Task status</span>
        <span className={`mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${life.tone}`}>
          {life.label ?? deliveryLabel(task.deliveryStatus)}
        </span>
      </div>
      <div className="w-[110px] shrink-0">
        <span className="block font-body text-[9px] font-semibold uppercase tracking-wide text-text-disabled">Payout</span>
        <span className={`mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chip.tone}`}>{chip.label}</span>
        <span className="mt-0.5 block font-body text-[10px] text-text-tertiary tabular-nums">{inr(task.budgetMinor)}</span>
      </div>
    </>
  );
}

/**
 * ACTION column — rendered AFTER the price. The REQUEST is SOW-level (see
 * PayoutSummary); per task we only show the contributor payout once the
 * enterprise has released that task's budget.
 */
export function TaskPayoutAction({ task, busy, onPayout, onPayEligible, localPaid }: {
  task?: PayoutTask;
  busy: string | null;
  onPayout: (taskId: string) => void;
  onPayEligible?: (taskId: string) => void;
  localPaid?: Set<string>;
}) {
  if (!task) return <span className="w-[130px] shrink-0" />;
  const payKey = `pay:${task.taskId}`;
  const btn = "inline-flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg font-body text-[11.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full";
  return (
    <div className="w-[130px] shrink-0">
      {(taskIsPaid(task) || localPaid?.has(task.taskId)) ? (
        <span className="inline-flex items-center gap-1 h-9 text-[11.5px] font-semibold text-success-text"><CheckCircle2 className="h-3.5 w-3.5" /> Paid</span>
      ) : task.payoutStatus === "released" ? (
        <button type="button" disabled={busy === payKey} onClick={() => onPayout(task.taskId)} className={`${btn} bg-brand text-on-brand hover:opacity-90`}>
          <Wallet className="h-3.5 w-3.5" /> {busy === payKey ? "Paying…" : "Pay contributor"}
        </button>
      ) : task.payoutStatus === "requested" ? (
        <span className="inline-flex items-center gap-1 h-9 text-[11px] text-text-tertiary"><Clock className="h-3.5 w-3.5" /> Awaiting enterprise</span>
      ) : task.payoutStatus === "eligible" ? (
        onPayEligible ? (
          <button type="button" disabled={busy === payKey} onClick={() => onPayEligible(task.taskId)} className={`${btn} bg-brand text-on-brand hover:opacity-90`}>
            <Wallet className="h-3.5 w-3.5" /> {busy === payKey ? "Paying…" : "Pay"}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 h-9 text-[11px] text-text-secondary"><Send className="h-3.5 w-3.5" /> Ready to bill</span>
        )
      ) : (
        <span className="inline-flex items-center h-9 text-[11px] text-text-tertiary">—</span>
      )}
    </div>
  );
}
