"use client";

/**
 * Billing — the enterprise's finance ANALYSIS dashboard, SOW-centric. Overall
 * spend analysis (delivered value · awaiting · released · paid), a payment-status
 * distribution bar, a per-SOW breakdown table, and a downloadable invoice per SOW.
 * Everything is the enterprise's own budget (client price) — NEVER contributor pay,
 * Glimmora margin, platform fees, or a contributor-payout ledger.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Download, FileDown, Receipt, Wallet, Landmark, Scale, Send, CheckCircle2 } from "lucide-react";
import { usePlanList } from "@/lib/hooks/use-decomposition-v2";
import { getPayoutStatus } from "@/lib/api/decomposition-v2";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, primaryBtnClass, primaryStyle, type Tone } from "@/app/admin/_shell/aurora-ui";

type Delivery = {
  total: number; delivered: number; paid: number; paymentPhase?: string;
  sowBudgetMinor?: number; // agreed/committed SOW budget (total)
  budgetMinor?: number; requestedMinor?: number; releasedMinor?: number; paidMinor?: number;
};
type Plan = { id: string; sowId: string; sowTitle?: string; delivery?: Delivery };

const fmtINR = (minor: number) => `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
const thisPeriodLabel = () => new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

const PHASE_CHIP: Record<string, { label: string; tone: Tone }> = {
  in_progress: { label: "In delivery", tone: "info" },
  completed_sow: { label: "Delivered", tone: "ai" },
  pending_payment: { label: "Payment due", tone: "warning" },
  payment_completed: { label: "Paid", tone: "success" },
};

function Section({ title, description, action, children }: { title: string; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Build + download an enterprise-safe HTML invoice (printable / save-as-PDF) for one SOW. */
async function downloadInvoice(plan: Plan, setBusy: (s: string | null) => void, setErr: (s: string) => void) {
  setBusy(plan.id); setErr("");
  try {
    const st = await getPayoutStatus(plan.id);
    const tasks = st.tasks ?? [];
    const lineRows = tasks.map((t) => `
      <tr>
        <td>${esc(t.title || t.taskId)}</td>
        <td style="text-transform:capitalize">${esc(String(t.deliveryStatus).replace(/_/g, " "))}</td>
        <td style="text-align:right">${fmtINR(t.budgetMinor || 0)}</td>
      </tr>`).join("");
    const total = st.budgetMinor || 0;
    const d = plan.delivery || ({} as Delivery);
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(plan.sowId)}</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:760px;margin:32px auto;padding:0 24px}
  h1{font-size:22px;margin:0 0 2px} .muted{color:#666;font-size:12px}
  .row{display:flex;justify-content:space-between;align-items:flex-start;margin:16px 0}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
  th,td{padding:8px 10px;border-bottom:1px solid #eee;text-align:left}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#666}
  tfoot td{font-weight:700;border-top:2px solid #222;border-bottom:none}
  .totals{margin-top:16px;font-size:13px} .totals div{display:flex;justify-content:space-between;padding:3px 0}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#eef;color:#338;font-size:11px;font-weight:600}
</style></head><body>
  <div class="row">
    <div><h1>Glimmora — Tax Invoice</h1><div class="muted">SOW payment statement · your budget only</div></div>
    <div style="text-align:right"><div class="muted">Date</div><div>${today}</div></div>
  </div>
  <div class="row">
    <div><div class="muted">Statement of Work</div><div style="font-weight:600">${esc(plan.sowTitle || plan.sowId)}</div><div class="muted">${esc(plan.sowId)}</div></div>
    <div style="text-align:right"><span class="badge">${esc((PHASE_CHIP[d.paymentPhase || ""] || { label: "—" }).label)}</span></div>
  </div>
  <table>
    <thead><tr><th>Task / deliverable</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${lineRows || '<tr><td colspan="3" style="color:#999">No line items</td></tr>'}</tbody>
    <tfoot><tr><td colspan="2">Total budget</td><td style="text-align:right">${fmtINR(total)}</td></tr></tfoot>
  </table>
  <div class="totals">
    <div><span class="muted">Awaiting your release</span><span>${fmtINR(d.requestedMinor || 0)}</span></div>
    <div><span class="muted">Released to Glimmora</span><span>${fmtINR(d.releasedMinor || 0)}</span></div>
    <div><span class="muted">Paid</span><span>${fmtINR(d.paidMinor || 0)}</span></div>
  </div>
  <p class="muted" style="margin-top:24px">Amounts shown are the enterprise's contracted budget (client price). Contributor compensation is managed by Glimmora and not itemised here.</p>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoice-${plan.sowId}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    setErr(e instanceof Error ? e.message : "Could not build invoice");
  } finally {
    setBusy(null);
  }
}

function DistributionBar({ committed, awaiting, released, paid }: { committed: number; awaiting: number; released: number; paid: number }) {
  const used = awaiting + released + paid;
  const total = Math.max(committed, used);
  if (total <= 0) return null;
  const remaining = Math.max(0, total - used);
  const pct = (v: number) => `${(100 * v) / total}%`;
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
        {paid > 0 ? <div className="h-full bg-success-emphasis" style={{ width: pct(paid) }} title={`Paid ${fmtINR(paid)}`} /> : null}
        {released > 0 ? <div className="h-full bg-info-emphasis" style={{ width: pct(released) }} title={`Released · pending payout ${fmtINR(released)}`} /> : null}
        {awaiting > 0 ? <div className="h-full bg-warning-emphasis" style={{ width: pct(awaiting) }} title={`Awaiting ${fmtINR(awaiting)}`} /> : null}
        {/* the empty track is the remaining (uncommitted/undelivered) budget */}
      </div>
      <div className="flex flex-wrap gap-4 font-body text-[11.5px] text-text-tertiary">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-emphasis" /> Paid {fmtINR(paid)}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info-emphasis" /> Released · pending {fmtINR(released)}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning-emphasis" /> Awaiting {fmtINR(awaiting)}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-bg-subtle border border-stroke" /> Remaining {fmtINR(remaining)}</span>
      </div>
    </div>
  );
}

export default function BillingOverviewPage() {
  const { data, isLoading } = usePlanList(
    { status: ["active", "approved"], limit: 300 },
    { staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true },
  );
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState("");

  const plans = (data?.items ?? []) as Plan[];
  const { totals, active } = React.useMemo(() => {
    const acc = { committed: 0, delivered: 0, awaiting: 0, released: 0, paid: 0 };
    const rows: Plan[] = [];
    for (const p of plans) {
      const d = p.delivery;
      if (!d) continue;
      // A SOW counts once it has a committed budget OR any payment activity.
      const any =
        (d.sowBudgetMinor || 0) || (d.budgetMinor || 0) || (d.requestedMinor || 0) ||
        (d.releasedMinor || 0) || (d.paidMinor || 0);
      if (!any) continue;
      acc.committed += d.sowBudgetMinor || 0;
      acc.delivered += d.budgetMinor || 0;
      acc.awaiting += d.requestedMinor || 0;
      acc.released += d.releasedMinor || 0;
      acc.paid += d.paidMinor || 0;
      rows.push(p);
    }
    rows.sort((a, b) => (b.delivery?.requestedMinor || 0) - (a.delivery?.requestedMinor || 0));
    return { totals: acc, active: rows };
  }, [plans]);
  // Outstanding = committed budget not yet fully settled (paid).
  const balance = Math.max(0, totals.committed - totals.paid);
  // "Released to Glimmora" is cumulative — once a payout is PAID it was necessarily
  // released first, so it must still count as released (the raw bucket only holds the
  // current state, which is why released could read ₹0 while paid was non-zero).
  const releasedTotal = totals.released + totals.paid;

  const exportCsv = () => {
    const head = ["SOW", "SOW ID", "Total committed", "Delivered value", "Awaiting release", "Released", "Paid", "Balance"];
    const lines = active.map((p) => {
      const d = p.delivery || ({} as Delivery);
      const bal = Math.max(0, (d.sowBudgetMinor || 0) - (d.paidMinor || 0));
      return [p.sowTitle || p.sowId, p.sowId, d.sowBudgetMinor || 0, d.budgetMinor || 0, d.requestedMinor || 0, (d.releasedMinor || 0) + (d.paidMinor || 0), d.paidMinor || 0, bal]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [head.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `billing-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const money = (v: number) => (isLoading ? "—" : fmtINR(v));

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Enterprise · Finance</p>
          <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">Billing</h1>
          <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
            Spend analysis · <span className="font-medium text-text-secondary">{thisPeriodLabel()}</span> · your budget only
          </p>
        </div>
        <button type="button" onClick={exportCsv} disabled={active.length === 0} className={cn(primaryBtnClass, "shrink-0 px-5 disabled:opacity-50")} style={primaryStyle}>
          <Download className="h-4 w-4" strokeWidth={2} aria-hidden /> Export CSV
        </button>
      </header>

      {err ? <p className="font-body text-[12px] text-error-text">{err}</p> : null}

      {/* Finance KPIs — all client price, enterprise-safe (never contributor pay) */}
      <section aria-label="Finance summary" className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total committed" value={money(totals.committed)} icon={Landmark} hint="agreed SOW budget" />
        <StatCard label="Delivered value" value={money(totals.delivered)} icon={Receipt} hint="budget for delivered work" hintTone="info" />
        <StatCard label="Outstanding balance" value={money(balance)} icon={Scale} hint="committed − paid" hintTone={!isLoading && balance > 0 ? "warning" : "success"} />
        <StatCard label="Awaiting release" value={money(totals.awaiting)} icon={Wallet} hint={!isLoading && totals.awaiting > 0 ? "needs your action" : "nothing pending"} hintTone={totals.awaiting > 0 ? "ai" : "neutral"} />
        <StatCard label="Released" value={money(releasedTotal)} icon={Send} hint="sent to Glimmora (incl. paid)" hintTone="info" />
        <StatCard label="Paid" value={money(totals.paid)} icon={CheckCircle2} hint="settled to contributors" hintTone="success" />
      </section>

      {/* Budget utilization — payment states against the total committed budget */}
      {!isLoading && totals.committed + totals.awaiting + totals.released + totals.paid > 0 ? (
        <Section title="Budget utilization" description="How your committed budget is split across payment states">
          <div className="px-5 sm:px-6 py-5">
            <DistributionBar committed={totals.committed} awaiting={totals.awaiting} released={totals.released} paid={totals.paid} />
          </div>
        </Section>
      ) : null}

      {/* Per-SOW analysis + invoice download */}
      <Section
        title="SOW breakdown"
        description={isLoading ? "Loading…" : `${active.length} SOW${active.length === 1 ? "" : "s"} with payment activity`}
        action={
          <Link href="/enterprise/billing/payouts" className="inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0">
            Pay / release
          </Link>
        }
      >
        {isLoading ? (
          <p className="px-5 sm:px-6 py-8 font-body text-[13px] text-text-tertiary text-center">Loading…</p>
        ) : active.length === 0 ? (
          <p className="px-5 sm:px-6 py-8 font-body text-[13px] text-text-secondary text-center">No SOW payment activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-stroke-subtle font-body text-[10.5px] uppercase tracking-wide text-text-tertiary">
                  <th className="px-5 sm:px-6 py-2.5 font-semibold">SOW</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Total</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Delivered</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Awaiting</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Released</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Paid</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Balance</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-5 sm:px-6 py-2.5 font-semibold text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke-subtle">
                {active.map((p) => {
                  const d = p.delivery || ({} as Delivery);
                  const chip = PHASE_CHIP[d.paymentPhase || ""] || { label: "—", tone: "neutral" as Tone };
                  const rowBalance = Math.max(0, (d.sowBudgetMinor || 0) - (d.paidMinor || 0));
                  return (
                    <tr key={p.id} className="font-body text-[12.5px] hover:bg-bg-subtle/50">
                      <td className="px-5 sm:px-6 py-3 min-w-0">
                        <Link href={`/enterprise/billing/payouts/sow/${p.id}`} className="block max-w-[260px] group">
                          <span className="block font-semibold text-foreground truncate group-hover:underline">{p.sowTitle || p.sowId}</span>
                          <span className="block font-mono text-[10px] text-text-tertiary truncate">{p.sowId}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-foreground">{fmtINR(d.sowBudgetMinor || 0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-text-secondary">{fmtINR(d.budgetMinor || 0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{(d.requestedMinor || 0) > 0 ? <span className="text-warning-text font-semibold">{fmtINR(d.requestedMinor || 0)}</span> : <span className="text-text-tertiary">—</span>}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-text-secondary">{fmtINR((d.releasedMinor || 0) + (d.paidMinor || 0))}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-success-text">{fmtINR(d.paidMinor || 0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{rowBalance > 0 ? <span className="text-foreground font-semibold">{fmtINR(rowBalance)}</span> : <span className="text-text-tertiary">—</span>}</td>
                      <td className="px-3 py-3"><Chip tone={chip.tone} dot={false}>{chip.label}</Chip></td>
                      <td className="px-5 sm:px-6 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy === p.id}
                            onClick={() => void downloadInvoice(p, setBusy, setErr)}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-stroke-subtle bg-bg-subtle font-body text-[11.5px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50"
                            title="Download this SOW's invoice"
                          >
                            <FileDown className="h-3.5 w-3.5" /> {busy === p.id ? "…" : "Invoice"}
                          </button>
                          <Link href={`/enterprise/billing/payouts/sow/${p.id}`} className="text-text-tertiary hover:text-foreground" title="Details">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
