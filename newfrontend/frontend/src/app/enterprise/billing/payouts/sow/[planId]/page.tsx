"use client";

/**
 * Enterprise · SOW payment detail. Full payment picture for ONE SOW — total budget,
 * completed work, awaiting release, released, paid, and a per-task breakdown — all in
 * the enterprise's own budget (client price). Never shows contributor pay or margin.
 * The enterprise can release the full completed amount or a partial/manual amount here.
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CheckCircle2, ChevronDown, Receipt } from "lucide-react";
import { getPayoutStatus, releasePayment, fundEscrow, getPlan, getPaymentTransactions, type PayoutStatus, type PayoutTask, type PaymentTxn, type SowEscrow } from "@/lib/api/decomposition-v2";
import { deliveryCell } from "@/lib/delivery/status-matrix";

const inr = (m: number) => "₹" + (m / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const toMinor = (s: string) => Math.round((parseFloat(s) || 0) * 100);
const fmtDateTime = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") || iso.includes("+") ? iso : iso.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? iso : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// Work-progress labels only (no per-task payment detail — the enterprise pays per
// SOW and never sees a task's price or payment state).
const WORK_LABEL: Record<string, string> = {
  ready: "Ready", assigned: "Assigned", in_progress: "In progress",
  req_check_pending: "In requirement check", req_check_rework: "Rework", req_check_failed: "Needs rework",
  qa_review_pending: "In QA review", qa_review_rework: "QA rework", qa_review_failed: "QA failed",
  payment_pending: "Delivered", paid: "Completed", declined: "Declined", cancelled: "Cancelled",
};
const workLabel = (s: string) => WORK_LABEL[s] ?? s.replace(/_/g, " ");

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/30 px-3.5 py-2.5">
      <p className="font-body text-[11px] text-text-tertiary">{label}</p>
      <p className={`font-body text-[15px] font-semibold tabular-nums ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

export default function SowPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = String(params.planId);
  const [status, setStatus] = React.useState<PayoutStatus | null>(null);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [manual, setManual] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [fundAmt, setFundAmt] = React.useState("");
  const [fundComment, setFundComment] = React.useState("");
  const [txns, setTxns] = React.useState<PaymentTxn[]>([]);
  const [openRef, setOpenRef] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    getPayoutStatus(planId).then(setStatus).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
    getPaymentTransactions(planId).then((r) => setTxns(r.transactions)).catch(() => {});
  }, [planId]);
  React.useEffect(() => { reload(); }, [reload]);
  React.useEffect(() => { getPlan(planId).then((p) => setName(p.sowTitle ?? "")).catch(() => {}); }, [planId]);

  const doRelease = async (amountMinor?: number) => {
    setBusy(true); setErr("");
    try { const r = await releasePayment(planId, amountMinor, comment.trim() || undefined); setStatus(r.status); setManual(""); setComment(""); reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Release failed"); }
    finally { setBusy(false); }
  };

  // Pre-fund: release the SOW budget to Glimmora up front (full or partial), once
  // priced — without waiting for task delivery. Held in escrow; Glimmora draws from it.
  const doFund = async (amountMinor?: number) => {
    setBusy(true); setErr("");
    try { const r = await fundEscrow(planId, amountMinor, fundComment.trim() || undefined); setStatus(r.status); setFundAmt(""); setFundComment(""); reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Release failed"); }
    finally { setBusy(false); }
  };

  const tasks: PayoutTask[] = status?.tasks ?? [];
  const sum = (pred: (t: PayoutTask) => boolean) => tasks.filter(pred).reduce((a, t) => a + (t.budgetMinor || 0), 0);
  const awaiting = sum((t) => t.payoutStatus === "requested");
  const released = sum((t) => t.payoutStatus === "released");
  const paid = sum((t) => t.payoutStatus === "paid");
  const sowBudget = status?.sowBudgetMinor ?? 0;        // agreed SOW budget (the reference)
  const billed = status?.budgetMinor ?? 0;              // actual delivered-work cost
  const paidSent = paid + released;                     // money the enterprise has sent
  const pending = awaiting;                             // money the enterprise still owes
  const remaining = sowBudget - billed;                 // >0 under budget · <0 over budget
  const escrow: SowEscrow = status?.escrow ?? { fundedMinor: 0, spentMinor: 0, remainingMinor: 0, currency: "INR" };
  const escrowToFund = Math.max(0, sowBudget - escrow.fundedMinor);  // budget not yet released

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="font-display text-[20px] font-semibold text-foreground">{name || "SOW payment"}</h1>
        <p className="font-mono text-[11px] text-text-tertiary mt-0.5">{status?.sowId ?? planId}</p>
        <p className="font-body text-[12.5px] text-text-tertiary mt-1">Your budget only — contributor pay is private to Glimmora.</p>
      </div>

      {err ? <p className="font-body text-[12px] text-error-text">{err}</p> : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat label="SOW budget" value={inr(sowBudget)} />
        <Stat label="Billed" value={inr(billed)} />
        <Stat label="Paid" value={inr(paidSent)} tone={paidSent > 0 ? "text-success-text" : undefined} />
        <Stat label="Pending" value={inr(pending)} tone={pending > 0 ? "text-warning-text" : undefined} />
        {sowBudget > 0 ? (
          <Stat label={remaining >= 0 ? "Budget remaining" : "Over budget"} value={inr(Math.abs(remaining))} tone={remaining < 0 ? "text-error-text" : undefined} />
        ) : (
          <Stat label="Billed" value={inr(billed)} />
        )}
      </div>
      {sowBudget > 0 ? (
        <p className="-mt-2 font-body text-[11.5px] text-text-tertiary">
          Agreed budget {inr(sowBudget)} · billed {inr(billed)} ·{" "}
          {remaining >= 0
            ? <span className="text-success-text font-medium">{inr(remaining)} under budget</span>
            : <span className="text-error-text font-medium">{inr(-remaining)} over budget — additional pending</span>}.
        </p>
      ) : null}

      {/* Pre-fund: release the SOW budget to Glimmora up front (full or partial),
          once priced — without waiting for task delivery. Held in escrow; Glimmora
          pays contributors from it as work completes. */}
      {sowBudget > 0 ? (
        <section className="rounded-2xl border border-stroke-subtle bg-surface p-4 space-y-3">
          <div>
            <p className="font-body text-[12.5px] font-semibold text-foreground">Release SOW budget to Glimmora</p>
            <p className="font-body text-[11.5px] text-text-tertiary">
              Pre-fund the full budget or a partial amount now — Glimmora pays contributors from it as
              work completes. No need to wait for delivery.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Released" value={inr(escrow.fundedMinor)} tone={escrow.fundedMinor > 0 ? "text-success-text" : undefined} />
            <Stat label="Drawn" value={inr(escrow.spentMinor)} />
            <Stat label="Available" value={inr(escrow.remainingMinor)} tone={escrow.remainingMinor > 0 ? "text-info-text" : undefined} />
          </div>
          {escrowToFund > 0 ? (
            <>
              <input
                type="text" value={fundComment} onChange={(e) => setFundComment(e.target.value)}
                placeholder="Add a note for this release (optional)"
                className="w-full h-9 rounded-lg border border-stroke-subtle bg-surface px-3 font-body text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-body text-[11px] text-text-tertiary">₹</span>
                  <input
                    type="number" min="0" inputMode="decimal" value={fundAmt}
                    onChange={(e) => setFundAmt(e.target.value)} placeholder="partial"
                    className="h-9 w-28 rounded-lg border border-stroke-subtle bg-surface px-2 font-body text-[12px] tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <button
                    type="button" disabled={busy || toMinor(fundAmt) <= 0}
                    onClick={() => doFund(toMinor(fundAmt))}
                    className="inline-flex items-center h-9 px-3 rounded-lg border border-stroke-subtle bg-bg-subtle font-body text-[12px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Release partial
                  </button>
                </div>
                <button
                  type="button" disabled={busy}
                  onClick={() => doFund()}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-on-brand font-body text-[12.5px] font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Banknote className="h-3.5 w-3.5" /> {busy ? "Releasing…" : `Release full (${inr(escrowToFund)})`}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-text" />
              <span className="font-body text-[12.5px] text-success-text">
                Full SOW budget released to Glimmora ({inr(escrow.fundedMinor)}).
              </span>
            </div>
          )}
        </section>
      ) : null}

      {awaiting > 0 ? (
        <section className="rounded-2xl border border-warning-border bg-warning-subtle/20 p-4 space-y-2">
          <p className="font-body text-[12.5px] font-semibold text-foreground">Release budget to Glimmora</p>
          <p className="font-body text-[11.5px] text-text-tertiary">Pay the full completed amount, or a partial amount (pays whole delivered tasks up to it).</p>
          <input
            type="text" value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note for this payment (optional)"
            className="w-full h-9 rounded-lg border border-stroke-subtle bg-surface px-3 font-body text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1">
              <span className="font-body text-[11px] text-text-tertiary">₹</span>
              <input
                type="number" min="0" inputMode="decimal" value={manual}
                onChange={(e) => setManual(e.target.value)} placeholder="partial"
                className="h-9 w-28 rounded-lg border border-stroke-subtle bg-surface px-2 font-body text-[12px] tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button
                type="button" disabled={busy || toMinor(manual) <= 0}
                onClick={() => doRelease(toMinor(manual))}
                className="inline-flex items-center h-9 px-3 rounded-lg border border-stroke-subtle bg-bg-subtle font-body text-[12px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Release partial
              </button>
            </div>
            <button
              type="button" disabled={busy}
              onClick={() => doRelease()}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-on-brand font-body text-[12.5px] font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <Banknote className="h-3.5 w-3.5" /> {busy ? "Releasing…" : `Pay completed (${inr(awaiting)})`}
            </button>
          </div>
        </section>
      ) : released > 0 || paid > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-stroke-subtle bg-bg-subtle/30 px-3.5 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-success-text" />
          <span className="font-body text-[12.5px] text-success-text">
            {awaiting === 0 && released === 0 && paid > 0 ? "All work fully paid." : "Budget released to Glimmora."}
          </span>
        </div>
      ) : null}

      <section className="rounded-2xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[13px] font-semibold text-foreground">Tasks ({tasks.length})</h2>
          <p className="font-body text-[11px] text-text-tertiary mt-0.5">Delivery progress — per-task pricing is private to Glimmora.</p>
        </div>
        <div className="divide-y divide-stroke-subtle">
          {tasks.length === 0 ? (
            <p className="px-4 py-6 font-body text-[12.5px] text-text-tertiary">No tasks yet.</p>
          ) : (
            tasks.map((t) => {
              const life = deliveryCell(t.deliveryStatus, "enterprise");
              return (
                <div key={t.taskId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <p className="min-w-0 flex-1 font-body text-[13px] font-medium text-foreground truncate">{t.title || t.taskId}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${life.tone}`}>
                    {workLabel(t.deliveryStatus)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Payments — each release the enterprise made; click a row for full details */}
      <section className="rounded-2xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-stroke-subtle flex items-center gap-2">
          <Receipt className="h-4 w-4 text-text-tertiary" aria-hidden />
          <h2 className="font-body text-[13px] font-semibold text-foreground">Payments ({txns.length})</h2>
          {txns.length > 0 ? (
            <span className="ml-auto font-body text-[11.5px] text-text-tertiary tabular-nums">
              {inr(txns.reduce((a, t) => a + t.amountMinor, 0))} total
            </span>
          ) : null}
        </div>
        <div className="divide-y divide-stroke-subtle">
          {txns.length === 0 ? (
            <p className="px-4 py-6 font-body text-[12.5px] text-text-tertiary">No payments yet. Released budgets appear here.</p>
          ) : (
            txns.map((tx) => {
              const open = openRef === tx.ref;
              return (
                <div key={tx.ref}>
                  <button
                    type="button"
                    onClick={() => setOpenRef(open ? null : tx.ref)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-subtle/50 transition-colors"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-success-subtle shrink-0">
                      <Banknote className="h-4 w-4 text-success-text" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-[12.5px] font-semibold text-foreground">{inr(tx.amountMinor)}</p>
                      <p className="font-body text-[11px] text-text-tertiary">{fmtDateTime(tx.at)} · {tx.ref}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tx.status === "settled" ? "bg-success-subtle text-success-text" : "bg-info-subtle text-info-text"}`}>
                      {tx.status === "settled" ? "Settled" : "Released"}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-text-tertiary shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open ? (
                    <dl className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-body text-[12px] bg-bg-subtle/30">
                      <div className="flex justify-between gap-3"><dt className="text-text-tertiary">Reference</dt><dd className="font-mono text-text-secondary">{tx.ref}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-text-tertiary">Amount</dt><dd className="font-semibold tabular-nums">{inr(tx.amountMinor)}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-text-tertiary">Date &amp; time</dt><dd className="text-text-secondary">{fmtDateTime(tx.at)}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-text-tertiary">Method</dt><dd className="text-text-secondary">{tx.method}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-text-tertiary">Released by</dt><dd className="text-text-secondary truncate">{tx.by || "—"}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-text-tertiary">Status</dt><dd className="text-text-secondary capitalize">{tx.status}</dd></div>
                      {tx.comment ? (
                        <div className="sm:col-span-2 pt-1">
                          <dt className="text-text-tertiary mb-0.5">Note</dt>
                          <dd className="text-text-secondary">{tx.comment}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
