"use client";

/**
 * Super Admin · Work pricing — decomposition plans across all tenants. Grouped by
 * pricing status (Awaiting pricing / Priced / Sent back) AND by payment phase
 * (Completed SOW / Pending payments / Payment completed) so Glimmora can drive the
 * 3-party payout. Each row shows a delivery progress bar. Pricing is hidden from
 * the enterprise.
 */

import * as React from "react";
import Link from "next/link";
import { ListChecks, ChevronRight } from "lucide-react";
import { usePlanList } from "@/lib/hooks/use-decomposition-v2";
import type { PlanSummary } from "@/lib/decomposition/types";

type PlanDelivery = {
  total: number;
  delivered: number;
  paid: number;
  progressPct: number;
  paymentPhase: "in_progress" | "completed_sow" | "pending_payment" | "payment_completed";
  payoutCounts: Record<string, number>;
};
type Plan = PlanSummary & { delivery?: PlanDelivery };

type TabKey =
  | "awaiting" | "priced" | "sent_back"
  | "completed_sow" | "pending_payment" | "payment_completed"
  | "all";

const STATUS_CHIP: Record<string, { label: string; tone: string }> = {
  awaiting: { label: "Awaiting pricing", tone: "bg-warning-subtle text-warning-text" },
  priced: { label: "Priced · live", tone: "bg-success-subtle text-success-text" },
  sent_back: { label: "Sent back", tone: "bg-error-subtle text-error-text" },
};

const PHASE_CHIP: Record<PlanDelivery["paymentPhase"], { label: string; tone: string }> = {
  in_progress: { label: "In delivery", tone: "bg-info-subtle text-info-text" },
  completed_sow: { label: "Delivered", tone: "bg-success-subtle text-success-text" },
  pending_payment: { label: "Payment pending", tone: "bg-warning-subtle text-warning-text" },
  payment_completed: { label: "Paid", tone: "bg-brand-subtle text-brand-emphasis" },
};

function pricingBucket(p: Plan): "awaiting" | "priced" | "sent_back" | null {
  if (p.status === "submitted") return "awaiting";
  if (p.status === "active" || p.status === "approved") return "priced";
  if (p.status === "draft" && p.revisionNote) return "sent_back";
  return null;
}

function ProgressBar({ d }: { d: PlanDelivery }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="h-1.5 flex-1 max-w-[180px] rounded-full bg-bg-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${Math.min(100, Math.max(0, d.progressPct))}%` }}
        />
      </div>
      <span className="font-body text-[10.5px] text-text-tertiary tabular-nums">
        {d.delivered}/{d.total} delivered{d.paid ? ` · ${d.paid} paid` : ""}
      </span>
    </div>
  );
}

export default function AdminDecompositionQueuePage() {
  const [tab, setTab] = React.useState<TabKey>("awaiting");
  const { data, isLoading, error } = usePlanList(
    { status: ["submitted", "active", "approved", "draft"], limit: 300 },
    { staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true },
  );

  const plans = (data?.items ?? []) as Plan[];

  const buckets = React.useMemo(() => {
    const b = {
      awaiting: [] as Plan[], priced: [] as Plan[], sent_back: [] as Plan[],
      completed_sow: [] as Plan[], pending_payment: [] as Plan[], payment_completed: [] as Plan[],
    };
    for (const p of plans) {
      const pk = pricingBucket(p);
      if (pk) b[pk].push(p);
      const phase = p.delivery?.paymentPhase;
      if (phase === "completed_sow") b.completed_sow.push(p);
      else if (phase === "pending_payment") b.pending_payment.push(p);
      else if (phase === "payment_completed") b.payment_completed.push(p);
    }
    return b;
  }, [plans]);

  const shown =
    tab === "all" ? plans
    : tab === "awaiting" ? buckets.awaiting
    : tab === "priced" ? buckets.priced
    : tab === "sent_back" ? buckets.sent_back
    : buckets[tab];

  const TABS: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "awaiting", label: "Awaiting pricing", count: buckets.awaiting.length },
    { key: "priced", label: "Priced", count: buckets.priced.length },
    { key: "sent_back", label: "Sent back", count: buckets.sent_back.length },
    { key: "completed_sow", label: "Completed SOW", count: buckets.completed_sow.length },
    { key: "pending_payment", label: "Pending payments", count: buckets.pending_payment.length },
    { key: "payment_completed", label: "Payment completed", count: buckets.payment_completed.length },
    { key: "all", label: "All", count: plans.length },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-4">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">Glimmora · Pricing</p>
        <h1 className="font-display text-[22px] font-bold text-foreground tracking-[-0.025em] leading-none">Work pricing</h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
          Decomposition plans from enterprises — price the contributor work, then track delivery + drive payouts (request from the enterprise, pay the contributors). Pricing is hidden from the enterprise.
        </p>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[12.5px] font-semibold transition-colors ${
              tab === t.key ? "bg-brand text-on-brand" : "bg-bg-subtle text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 text-[10.5px] ${tab === t.key ? "bg-on-brand/20" : "bg-surface"}`}>{t.count}</span>
          </button>
        ))}
      </nav>

      {error && (
        <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 text-sm text-error-text">
          Could not load the pricing queue.
        </p>
      )}
      {isLoading && <div className="h-24 rounded-xl bg-bg-subtle animate-pulse" />}

      {!isLoading && shown.length === 0 && (
        <div className="rounded-xl border border-stroke-subtle bg-surface p-8 text-center">
          <ListChecks className="h-6 w-6 mx-auto mb-2 text-text-tertiary" aria-hidden />
          <p className="font-body text-[13px] text-text-secondary">Nothing here.</p>
        </div>
      )}

      <div className="space-y-2">
        {shown.map((p) => {
          const pk = pricingBucket(p);
          const chip = STATUS_CHIP[pk ?? "awaiting"];
          const d = p.delivery;
          const phaseChip = d && d.total > 0 ? PHASE_CHIP[d.paymentPhase] : null;
          return (
            <Link
              key={p.id}
              href={`/admin/decomposition/${encodeURIComponent(p.id)}`}
              className="flex items-center gap-3 rounded-xl border border-stroke-subtle bg-surface px-4 py-3 hover:bg-surface-hover hover:border-stroke transition-colors"
            >
              <ListChecks className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[13.5px] font-semibold text-foreground truncate">{p.sowTitle || p.summary || `Plan ${p.id.slice(0, 10)}`}</p>
                <p className="font-body text-[11.5px] text-text-tertiary truncate">
                  SOW {p.sowId} · v{p.version}{p.sowTitle && p.summary ? ` · ${p.summary}` : ""}
                </p>
                {pk === "sent_back" && p.revisionNote ? (
                  <p className="mt-0.5 font-body text-[11px] text-error-text truncate">↩ {p.revisionNote}</p>
                ) : null}
                {d && d.total > 0 ? <ProgressBar d={d} /> : null}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${chip.tone}`}>
                  {chip.label}
                </span>
                {phaseChip ? (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${phaseChip.tone}`}>
                    {phaseChip.label}
                  </span>
                ) : null}
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
