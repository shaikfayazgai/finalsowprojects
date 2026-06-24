"use client";

/**
 * Super Admin · Price + approve a decomposition plan.
 *
 * Glimmora sets the contributor pay per task — Fixed (₹) or Hourly (₹/hr × est.
 * hours) — then approves (provisions delivery) or sends back to the enterprise
 * with feedback. The amounts here are Glimmora's cost and are NEVER shown to the
 * enterprise/mentor/reviewer (the margin is private). The contributor later sees
 * their net pay (−18% GST).
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, RotateCcw, Paperclip, Pencil, Lock, ChevronRight } from "lucide-react";
import { usePlan, useApprovePlan, useSendBackPlan, useRepricePlan } from "@/lib/hooks/use-decomposition-v2";
import type { TaskPricing } from "@/lib/api/decomposition-v2";
import { usePlanPayout, PayoutSummary, TaskStatusCells, TaskPayoutAction, taskIsPaid, taskPriceLocked } from "./payout-panel";

type PriceRow = { type: "fixed" | "hourly"; value: string };

const INPUT = "h-9 w-28 rounded-md border border-stroke-subtle bg-surface px-2 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";
const SELECT = "h-9 rounded-md border border-stroke-subtle bg-surface px-2 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";

function inr(minor: number): string {
  return "₹" + (minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function AdminPricePlanPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const planId = params?.planId ?? "";
  const { data: plan, isLoading, error } = usePlan(planId);
  const approve = useApprovePlan(planId);
  const sendBack = useSendBackPlan(planId);
  const reprice = useRepricePlan(planId);
  // 3-party payout — per-task delivery + payout status from the enterprise API.
  const payout = usePlanPayout(planId);

  const [localPaidTaskIds, setLocalPaidTaskIds] = React.useState<Set<string>>(new Set());
  const [price, setPrice] = React.useState<Record<string, PriceRow>>({});
  const [comment, setComment] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const seeded = React.useRef(false);

  // Live, super-admin-controlled platform rates (commission % + GST %). Editable
  // here so pricing happens with the margin/GST in view — same setting as
  // Admin → Settings (single source of truth: /api/admin/commission).
  const [commissionPct, setCommissionPct] = React.useState(15);
  const [gstPct, setGstPct] = React.useState(18);
  const [ratesLoaded, setRatesLoaded] = React.useState(false);
  const [savingRates, setSavingRates] = React.useState(false);
  const [ratesMsg, setRatesMsg] = React.useState<string | null>(null);
  // Edit-locks: rates + task pricing are read-only until "Edit", and saving needs
  // an explicit confirm (so a misclick can't change a live, paid-out price).
  const [ratesEditing, setRatesEditing] = React.useState(false);
  const [ratesConfirm, setRatesConfirm] = React.useState(false);
  const ratesSnap = React.useRef({ c: 15, g: 18 });
  const [pricingConfirm, setPricingConfirm] = React.useState(false);
  // Per-task pricing edit-lock: each task's price is read-only until you click
  // "Edit"; the value snapshot lets Cancel restore the pre-edit amount.
  const [editingTasks, setEditingTasks] = React.useState<Record<string, PriceRow>>({});

  // Load Razorpay checkout.js once on mount
  React.useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);

  const openRazorpay = (amountMinor: number, description: string): Promise<void> =>
    new Promise((resolve, reject) => {
      fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor, currency: "INR", notes: { planId } }),
      })
        .then((r) => r.ok ? r.json() : r.json().then((e: { message?: string }) => Promise.reject(new Error(e?.message ?? "Order creation failed"))))
        .then((order: { orderId: string; amount: number; currency: string; keyId: string }) => {
          type RzpInstance = { open(): void; on(e: string, cb: (r: unknown) => void): void };
          type RzpCtor = new (opts: unknown) => RzpInstance;
          const RzpClass = (window as unknown as { Razorpay?: RzpCtor }).Razorpay;
          if (!RzpClass) { reject(new Error("Payment gateway not loaded — please refresh")); return; }
          const rzp = new RzpClass({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "Glimmora",
            description,
            order_id: order.orderId,
            handler: () => resolve(),
            modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
          });
          rzp.on("payment.failed", (r: unknown) =>
            reject(new Error((r as { error?: { description?: string } })?.error?.description ?? "Payment failed"))
          );
          rzp.open();
        })
        .catch(reject);
    });

  const doPayEligible = async (taskId: string) => {
    const task = payout.byTask[taskId];
    // Disburse the CONTRIBUTOR pay (costMinor), NOT budgetMinor (the client price,
    // which carries Glimmora's margin + GST). Fall back to budget only if the
    // backend didn't supply the contributor cost.
    const contributorMinor = task?.costMinor != null ? task.costMinor : (task?.budgetMinor ?? 0);
    if (!task || contributorMinor <= 0) return;
    setActionError(null);
    try {
      await openRazorpay(contributorMinor, `Task payout: ${task.title || taskId}`);
      await payout.payout(taskId);
      setLocalPaidTaskIds((prev) => new Set([...prev, taskId]));
      payout.reload();
    } catch (e) {
      if (e instanceof Error && e.message !== "Payment cancelled") setActionError(e.message);
    }
  };

  // "Pay all delivered tasks" — bulk disburse. In TEST/simulated mode this runs the
  // real state machine on the backend (no Razorpay checkout per task); the backend
  // caps at the remaining payable and skips any task that exceeds it.
  const doPayAll = async () => {
    setActionError(null);
    try {
      await payout.payAll();
      payout.reload();
    } catch (e) {
      if (e instanceof Error) setActionError(e.message);
    }
  };

  React.useEffect(() => {
    fetch("/api/admin/commission", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.commissionPct != null) setCommissionPct(Number(j.data.commissionPct));
        if (j?.data?.gstPct != null) setGstPct(Number(j.data.gstPct));
      })
      .catch(() => {})
      .finally(() => setRatesLoaded(true));
  }, []);

  const saveRates = async () => {
    setSavingRates(true); setRatesMsg(null);
    try {
      const r = await fetch("/api/admin/commission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPct, gstPct }),
      });
      setRatesMsg(r.ok ? "Saved" : "Save failed");
    } catch {
      setRatesMsg("Save failed");
    } finally {
      setSavingRates(false);
    }
  };

  const startEditRates = () => { ratesSnap.current = { c: commissionPct, g: gstPct }; setRatesMsg(null); setRatesEditing(true); };
  const cancelEditRates = () => { setCommissionPct(ratesSnap.current.c); setGstPct(ratesSnap.current.g); setRatesEditing(false); setRatesConfirm(false); };
  const confirmSaveRates = async () => { await saveRates(); setRatesEditing(false); setRatesConfirm(false); };

  // Seed price rows from any existing pricing once the plan loads.
  React.useEffect(() => {
    if (!plan || seeded.current) return;
    seeded.current = true;
    const seed: Record<string, PriceRow> = {};
    for (const t of plan.tasks) {
      if (t.payType === "hourly" && t.payRateMinor != null) {
        seed[t.id] = { type: "hourly", value: String(t.payRateMinor / 100) };
      } else if (t.contributorAmountMinor != null) {
        seed[t.id] = { type: "fixed", value: String(t.contributorAmountMinor / 100) };
      } else {
        seed[t.id] = { type: "fixed", value: "" };
      }
    }
    setPrice(seed);
  }, [plan]);

  if (isLoading && !plan) return <div className="h-40 rounded-xl bg-bg-subtle animate-pulse" />;
  if (error || !plan) {
    return (
      <div className="rounded-xl border border-stroke-subtle bg-surface p-8 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">Plan not found</p>
        <Link href="/admin/decomposition" className="mt-3 inline-block font-body text-[12.5px] text-text-link hover:underline">Back to pricing queue</Link>
      </div>
    );
  }

  const tasks = [...plan.tasks].sort((a, b) => a.order - b.order);
  const set = (id: string, patch: Partial<PriceRow>) => setPrice((p) => ({ ...p, [id]: { ...(p[id] ?? { type: "fixed", value: "" }), ...patch } }));

  // Per-task edit-lock helpers.
  const isTaskEditing = (id: string) => id in editingTasks;
  const startTaskEdit = (id: string) =>
    setEditingTasks((e) => ({ ...e, [id]: { ...(price[id] ?? { type: "fixed", value: "" }) } }));
  const confirmTaskEdit = (id: string) =>
    setEditingTasks((e) => { const n = { ...e }; delete n[id]; return n; });
  const cancelTaskEdit = (id: string) => {
    const backup = editingTasks[id];
    setEditingTasks((e) => { const n = { ...e }; delete n[id]; return n; });
    if (backup) setPrice((p) => ({ ...p, [id]: backup }));
  };

  const lineMinor = (t: (typeof tasks)[number]): number => {
    const row = price[t.id];
    if (!row || !row.value) return 0;
    const v = Number(row.value) || 0;
    return row.type === "hourly" ? Math.round(v * 100 * (t.estimatedHours ?? 0)) : Math.round(v * 100);
  };
  const totalMinor = tasks.reduce((s, t) => s + lineMinor(t), 0);
  const allPriced = tasks.every((t) => (Number(price[t.id]?.value) || 0) > 0);
  const busy = approve.isPending || sendBack.isPending || reprice.isPending;
  // submitted → first-time pricing (approve provisions); active/approved → already
  // priced & live, so editing here re-prices without changing status.
  const isPriced = plan.status === "active" || plan.status === "approved";

  const buildPricing = (): TaskPricing[] =>
    tasks.map((t) => {
      const row = price[t.id];
      const minor = Math.round((Number(row.value) || 0) * 100);
      return row.type === "hourly"
        ? { taskId: t.id, payType: "hourly", rateMinor: minor }
        : { taskId: t.id, payType: "fixed", amountMinor: minor };
    });

  const onApprove = async () => {
    setActionError(null);
    if (!allPriced) { setActionError("Every task needs a price before you can approve."); return; }
    try {
      await approve.mutateAsync(buildPricing());
      router.push("/admin/decomposition");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not approve the plan.");
    }
  };

  const onSavePricing = async () => {
    setActionError(null);
    if (!allPriced) { setActionError("Every task needs a price."); return; }
    try {
      await reprice.mutateAsync(buildPricing());
      setActionError(null);
      setPricingConfirm(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not save pricing.");
    }
  };

  const confirmSavePricing = () => { void onSavePricing(); };

  const onSendBack = async () => {
    setActionError(null);
    if (!comment.trim()) { setActionError("Add a comment so the enterprise knows what to revise."); return; }
    try {
      await sendBack.mutateAsync(comment.trim());
      router.push("/admin/decomposition");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not send the plan back.");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <Link href="/admin/decomposition" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to pricing queue
      </Link>

      <header className="border-b border-stroke-subtle pb-4">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Glimmora · {isPriced ? "Edit pricing · priced & live" : "Price + approve"} · v{plan.version}
        </p>
        <h1 className="font-display text-[22px] font-bold text-foreground tracking-[-0.025em] leading-none">{plan.sowTitle || plan.summary || `Plan ${plan.id.slice(0, 10)}`}</h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary">SOW {plan.sowId} · {tasks.length} tasks{plan.summary ? ` · ${plan.summary}` : ""}. Set the contributor pay per task — hidden from the enterprise.</p>
      </header>

      {actionError && <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 text-sm text-error-text">{actionError}</p>}

      {/* Platform rates — commission (margin) + GST, editable in-context. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-stroke-subtle bg-surface px-4 py-3">
        <span className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">Platform rates</span>
        <label className="flex items-center gap-2 font-body text-[12.5px] text-text-secondary">
          Commission
          <input
            type="number" min={0} max={89} step={0.5}
            value={commissionPct} disabled={!ratesEditing}
            onChange={(e) => setCommissionPct(Number(e.target.value))}
            className="h-8 w-20 rounded-md border border-stroke-subtle bg-surface px-2 text-[13px] tabular-nums text-foreground disabled:bg-bg-subtle/50 disabled:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
          />%
        </label>
        <label className="flex items-center gap-2 font-body text-[12.5px] text-text-secondary">
          GST
          <input
            type="number" min={0} max={50} step={0.5}
            value={gstPct} disabled={!ratesEditing}
            onChange={(e) => setGstPct(Number(e.target.value))}
            className="h-8 w-20 rounded-md border border-stroke-subtle bg-surface px-2 text-[13px] tabular-nums text-foreground disabled:bg-bg-subtle/50 disabled:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
          />%
        </label>
        {!ratesEditing ? (
          <button
            type="button" onClick={startEditRates} disabled={!ratesLoaded}
            className="inline-flex items-center gap-1.5 rounded-md border border-stroke-subtle bg-surface px-3 py-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-60"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : ratesConfirm ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-warning-border bg-warning-subtle/40 px-2.5 py-1">
            <span className="font-body text-[11.5px] font-semibold text-warning-text">Save these rates?</span>
            <button type="button" onClick={confirmSaveRates} disabled={savingRates} className="rounded-md bg-brand px-2.5 py-1 font-body text-[11.5px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-60">{savingRates ? "Saving…" : "Confirm"}</button>
            <button type="button" onClick={() => setRatesConfirm(false)} className="rounded-md px-2 py-1 font-body text-[11.5px] font-semibold text-text-secondary hover:text-foreground">Cancel</button>
          </span>
        ) : (
          <>
            <button type="button" onClick={() => setRatesConfirm(true)} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-body text-[12.5px] font-semibold text-on-brand hover:opacity-90">Save rates</button>
            <button type="button" onClick={cancelEditRates} className="rounded-md px-2.5 py-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground">Cancel</button>
          </>
        )}
        {ratesMsg ? <span className="font-body text-[12px] text-success-text">{ratesMsg}</span> : null}
        <span className="font-body text-[11.5px] text-text-tertiary">Drives client price = cost ÷ (1 − {commissionPct}%); enterprise budget = client + {gstPct}% GST. Contributor is paid in full.</span>
      </div>

      {/* Per-task pricing */}
      <div className="rounded-2xl border border-stroke-subtle bg-surface divide-y divide-stroke-subtle">
        {tasks.map((t) => {
          const row = price[t.id] ?? { type: "fixed", value: "" };
          return (
            <div key={t.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/decomposition/${plan.id}/tasks/${t.id}`}
                    className="font-body text-[13.5px] font-semibold text-foreground hover:text-brand hover:underline"
                  >
                    {t.title}
                  </Link>
                  <p className="font-body text-[11.5px] text-text-tertiary">
                    {t.estimatedHours ? `${t.estimatedHours}h est.` : "no estimate"}
                    {t.requiredSkills.length ? ` · ${t.requiredSkills.join(", ")}` : ""}
                  </p>
                  <Link
                    href={`/admin/decomposition/${plan.id}/tasks/${t.id}`}
                    className="mt-1 inline-flex items-center gap-0.5 font-body text-[11px] font-medium text-brand hover:gap-1.5 transition-all"
                  >
                    View full details <ChevronRight className="h-3 w-3" aria-hidden />
                  </Link>
                  {t.description ? <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{t.description}</p> : null}
                  {t.attachments && t.attachments.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Paperclip className="h-3 w-3 text-text-tertiary" aria-hidden />
                      {t.attachments.map((a) => (
                        <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="rounded border border-stroke-subtle bg-bg-subtle/40 px-1.5 py-0.5 text-[10.5px] text-text-link hover:underline max-w-[160px] truncate">{a.name}</a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status columns — between the task and the price (only once priced/live) */}
                  {isPriced ? <TaskStatusCells task={payout.byTask[t.id]} /> : null}
                  {taskPriceLocked(payout.byTask[t.id]) ? (
                    /* Price LOCKS once a contributor is assigned (through paid).
                       Same two-slot layout as the editable row (fixed-width value
                       slot + action slot) so every row's columns line up exactly. */
                    <>
                      <span className="inline-flex items-center justify-end rounded-md border border-stroke-subtle bg-bg-subtle/50 px-2.5 h-9 w-[88px] font-body text-[12.5px] text-text-secondary tabular-nums">
                        {Number(row.value) > 0
                          ? (row.type === "hourly" ? `₹${row.value}/hr` : `₹${row.value}`)
                          : "Not priced"}
                      </span>
                      <span
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-stroke-subtle bg-bg-subtle/50 px-2.5 h-9 w-[80px] font-body text-[12px] font-medium text-text-tertiary"
                        title={taskIsPaid(payout.byTask[t.id]) ? "Paid — pricing is locked" : "Locked — a contributor is assigned; the price can no longer be changed"}
                      >
                        <Lock className="h-3.5 w-3.5" aria-hidden /> Locked
                      </span>
                    </>
                  ) : isTaskEditing(t.id) ? (
                    /* Editing — choose mode + amount, then Confirm or Cancel. */
                    <>
                      <select
                        className={SELECT}
                        value={row.type}
                        onChange={(e) => set(t.id, { type: e.target.value as PriceRow["type"] })}
                      >
                        <option value="fixed">Fixed ₹</option>
                        <option value="hourly">Hourly ₹/hr</option>
                      </select>
                      <input
                        className={INPUT}
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={row.value}
                        autoFocus
                        onChange={(e) => set(t.id, { value: e.target.value })}
                        placeholder={row.type === "hourly" ? "rate/hr" : "amount"}
                      />
                      <button
                        type="button"
                        onClick={() => confirmTaskEdit(t.id)}
                        disabled={!(Number(row.value) > 0)}
                        className="rounded-md bg-brand px-2.5 h-9 font-body text-[12px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelTaskEdit(t.id)}
                        className="rounded-md px-2 h-9 font-body text-[12px] font-semibold text-text-secondary hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    /* Read-only value + Edit (available until the task is assigned). */
                    <>
                      <span className="inline-flex items-center justify-end rounded-md border border-stroke-subtle bg-surface px-2.5 h-9 w-[88px] font-body text-[12.5px] text-foreground tabular-nums">
                        {Number(row.value) > 0
                          ? (row.type === "hourly" ? `₹${row.value}/hr` : `₹${row.value}`)
                          : "Not priced"}
                      </span>
                      <button
                        type="button"
                        onClick={() => startTaskEdit(t.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-stroke-subtle bg-surface px-2.5 h-9 w-[80px] font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </>
                  )}
                  <span className="w-24 text-right font-body text-[12px] text-text-secondary tabular-nums">
                    = {inr(lineMinor(t))}
                  </span>
                  {/* Payout-action column — after the price (only once priced/live) */}
                  {isPriced ? (
                    <TaskPayoutAction
                      task={payout.byTask[t.id]}
                      busy={payout.busy}
                      onPayout={payout.payout}
                      onPayEligible={doPayEligible}
                      localPaid={localPaidTaskIds}
                      payableMinor={payout.status?.payableMinor}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Economics (driven by the live commission % + GST %) */}
      {(() => {
        const cf = Math.max(0, Math.min(commissionPct, 89)) / 100;
        const gf = Math.max(0, Math.min(gstPct, 50)) / 100;
        // Contributor receives the FULL amount (no GST withheld). Glimmora margin and
        // GST are ADDED on top to form the enterprise budget.
        const contributorMinor = totalMinor;                          // full contributor payout
        const clientMinor = cf < 1 ? Math.round(totalMinor / (1 - cf)) : totalMinor; // deal price = contributor + margin
        const marginMinor = clientMinor - contributorMinor;           // Glimmora margin (commission only)
        const gstMinor = Math.round(clientMinor * gf);                // GST pass-through on the deal price
        const enterpriseMinor = clientMinor + gstMinor;               // enterprise pays = contributor + margin + GST
        // Budget assumed at SOW approval — shown for REFERENCE while pricing. From the
        // payout status once live, else the plan's delivery rollup (first-time pricing).
        const sowBudgetMinor = payout.status?.sowBudgetMinor ?? plan.delivery?.budgetMinor ?? 0;
        const budgetHeadroomMinor = sowBudgetMinor - enterpriseMinor; // actual budget vs what we'll actually bill
        const withinBudget = budgetHeadroomMinor >= 0;
        return (
          <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/40 px-4 py-3 space-y-2 font-body text-[12px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div><p className="text-text-tertiary">Contributor payout (full)</p><p className="font-semibold text-foreground tabular-nums">{inr(contributorMinor)}</p></div>
              <div><p className="text-text-tertiary">Glimmora margin ({commissionPct}%)</p><p className="font-semibold text-success-text tabular-nums">{inr(marginMinor)}</p></div>
              <div><p className="text-text-tertiary">Client price (÷ {(1 - cf).toFixed(2)})</p><p className="font-semibold text-foreground tabular-nums">{inr(clientMinor)}</p></div>
              <div><p className="text-text-tertiary">GST ({gstPct}% pass-through)</p><p className="font-semibold text-foreground tabular-nums">{inr(gstMinor)}</p></div>
              <div><p className="text-text-tertiary">Enterprise pays</p><p className="font-semibold text-foreground tabular-nums">{inr(enterpriseMinor)}</p></div>
            </div>
            <p className="text-[10.5px] text-text-tertiary leading-relaxed">
              Enterprise pays ({inr(enterpriseMinor)}) = contributor payout ({inr(contributorMinor)}, paid in full) + Glimmora margin ({inr(marginMinor)}, {commissionPct}%) + GST ({inr(gstMinor)}, {gstPct}%). GST is a pass-through; the contributor is never deducted.
            </p>
            {sowBudgetMinor > 0 ? (
              <div className="mt-1 rounded-lg border border-stroke-subtle bg-surface px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary mb-1.5">
                  Budget comparison · vs what was assumed at SOW approval
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-text-tertiary">Actual budget (SOW approval)</p>
                    <p className="font-semibold text-foreground tabular-nums">{inr(sowBudgetMinor)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Final enterprise price (now)</p>
                    <p className="font-semibold text-foreground tabular-nums">{inr(enterpriseMinor)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">{withinBudget ? "Headroom · under budget" : "Over budget"}</p>
                    <p className={`font-semibold tabular-nums ${withinBudget ? "text-success-text" : "text-warning-text"}`}>
                      {withinBudget ? "" : "−"}{inr(Math.abs(budgetHeadroomMinor))}
                    </p>
                  </div>
                </div>
                <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed">
                  Actual budget = the enterprise&apos;s given SOW target set at approval. Final enterprise price ({inr(enterpriseMinor)}) = contributor pay + Glimmora margin ({commissionPct}%) + GST ({gstPct}%) — what they&apos;ll actually be billed.
                  {withinBudget
                    ? ` Your pricing lands ${inr(budgetHeadroomMinor)} below the assumed budget.`
                    : ` ⚠ Your pricing is ${inr(Math.abs(budgetHeadroomMinor))} above the assumed budget.`}
                </p>
              </div>
            ) : null}
          </div>
        );
      })()}

      {/* Delivery + payout summary (per-task controls live on each row above) */}
      {isPriced && payout.status ? (() => {
        const cf = Math.max(0, Math.min(commissionPct, 89)) / 100;
        const gf = Math.max(0, Math.min(gstPct, 50)) / 100;
        const clientMinor = cf < 1 ? Math.round(totalMinor / (1 - cf)) : totalMinor;
        const enterprisePriceMinor = clientMinor + Math.round(clientMinor * gf); // contributor + margin + GST
        return <PayoutSummary status={payout.status} error={payout.error} busy={payout.busy} onRequestAll={payout.requestAll} onPayAll={doPayAll} enterprisePriceMinor={enterprisePriceMinor} />;
      })() : null}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-stroke-subtle bg-bg-subtle/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              className="h-9 w-56 rounded-md border border-stroke-subtle bg-surface px-2.5 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Feedback (for send back)"
            />
            <button
              type="button"
              onClick={onSendBack}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-stroke-subtle bg-surface px-3 py-2 font-body text-[13px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" /> Send back
            </button>
          </div>
          {isPriced ? (
            pricingConfirm ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-warning-border bg-warning-subtle/40 px-3 py-1.5">
                <span className="font-body text-[12.5px] font-semibold text-warning-text">Save task pricing?</span>
                <button type="button" onClick={confirmSavePricing} disabled={busy || !allPriced} className="rounded-md bg-brand px-3 py-1.5 font-body text-[12.5px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-60">{reprice.isPending ? "Saving…" : "Confirm"}</button>
                <button type="button" onClick={() => setPricingConfirm(false)} className="rounded-md px-2 py-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground">Cancel</button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPricingConfirm(true)}
                disabled={busy || !allPriced}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-body text-[13px] font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" /> Save pricing
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onApprove}
              disabled={busy || !allPriced}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-body text-[13px] font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" /> {approve.isPending ? "Approving…" : "Approve & provision"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
