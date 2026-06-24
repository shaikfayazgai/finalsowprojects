"use client";

/**
 * Glimmora Billing workspace — the operator money view.
 *
 *   header → KPI band (inflow / outflow / margin / GST / pending / paid / …)
 *          → transactions ledger (filter tabs by direction + status).
 *
 * Visual language matches the admin dashboard exactly: solid `StatCard`s on a
 * `grid-cols-2 lg:grid-cols-4`, then a `DASH_CARD`-wrapped raw <table>.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Wallet,
  Landmark,
  ReceiptText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, AURORA_ACCENT } from "../../_shell/aurora";
import { StatCard, Tabs, type TabDef, type Tone } from "../../_shell/aurora-ui";
import {
  useAdminBillingSummary,
  useAdminBillingTransactions,
  type BillingDirection,
  type BillingTransaction,
} from "@/lib/hooks/use-admin-billing";

/* ── money formatting ── */

function fmtMoney(major: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `₹${Math.round(major).toLocaleString("en-IN")}`;
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

/* ── status pills ── */

const STATUS_TONE: Record<string, Tone> = {
  paid: "success",
  released: "info",
  processing: "info",
  requested: "warning",
  eligible: "warning",
  pending: "warning",
  created: "neutral",
  processed: "success",
  failed: "error",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  released: "Released",
  processing: "Processing",
  requested: "Requested",
  eligible: "Eligible",
  created: "Created",
  processed: "Processed",
  failed: "Failed",
};

const TONE_TEXT: Record<Tone, string> = {
  error: "var(--color-error-text)",
  warning: "var(--color-warning-text)",
  success: "var(--color-success-text)",
  info: "var(--color-info-text)",
  ai: "var(--color-ai-text)",
  neutral: "var(--color-text-secondary)",
};

const TONE_SOFT: Record<Tone, string> = {
  error: "var(--color-error-subtle)",
  warning: "var(--color-warning-subtle)",
  success: "var(--color-success-subtle)",
  info: "var(--color-info-subtle)",
  ai: "var(--color-ai-surface)",
  neutral: "var(--color-bg-subtle)",
};

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const label = STATUS_LABEL[status] ?? (status ? status[0].toUpperCase() + status.slice(1) : "—");
  return (
    <span
      className="inline-flex h-[20px] items-center px-2 rounded-md font-body text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      {label}
    </span>
  );
}

function DirectionBadge({ direction }: { direction: BillingDirection }) {
  const isIn = direction === "in";
  const tone: Tone = isIn ? "success" : "info";
  const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
  return (
    <span
      className="inline-flex items-center gap-1 h-[20px] px-2 rounded-md font-body text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      <Icon className="h-3 w-3" strokeWidth={2.4} aria-hidden />
      {isIn ? "In" : "Out"}
    </span>
  );
}

/* ── filter definitions ── */

type DirFilter = "all" | "in" | "out";
type StatusFilter = "all" | "paid" | "pending" | "failed";

const DIR_TABS: TabDef[] = [
  { key: "all", label: "All" },
  { key: "in", label: "Money in" },
  { key: "out", label: "Money out" },
];

const STATUS_TABS: TabDef[] = [
  { key: "all", label: "Any status" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

// statuses that count as "pending" (still-owed obligations) on the FE filter
const PENDING_SET = new Set(["eligible", "requested", "released", "processing", "created", "pending"]);
const PAID_SET = new Set(["paid", "processed"]);

function passesStatus(t: BillingTransaction, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "paid") return PAID_SET.has(t.status);
  if (filter === "failed") return t.status === "failed";
  if (filter === "pending") return PENDING_SET.has(t.status);
  return true;
}

/* ── workspace ── */

export function BillingWorkspace() {
  const { summary } = useAdminBillingSummary();
  const { transactions } = useAdminBillingTransactions();

  const [dir, setDir] = React.useState<DirFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");

  const k = summary.kpis;
  const cur = summary.currency || "INR";

  const filtered = React.useMemo(() => {
    return transactions.filter(
      (t) => (dir === "all" || t.direction === dir) && passesStatus(t, status),
    );
  }, [transactions, dir, status]);

  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      {/* ── header ── */}
      <header className="min-w-0 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] text-foreground leading-none">
              Billing
            </h1>
            <span
              className="inline-flex h-[20px] items-center px-2 rounded-md font-body text-[10.5px] font-semibold uppercase tracking-[0.04em]"
              style={{ color: TONE_TEXT.ai, background: TONE_SOFT.ai }}
            >
              Glimmora
            </span>
          </div>
          <p className="mt-2 font-body text-[13.5px] text-text-secondary max-w-2xl">
            Money in from enterprises and out to contributors — margin, GST, pending vs paid.
            Commission {summary.config.commissionPct}% · GST {summary.config.gstPct}%.
          </p>
        </div>
      </header>

      {/* ── KPI band ── */}
      <section aria-label="Billing metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Inflow"
          value={fmtMoney(k.inflow.major, cur)}
          icon={ArrowDownLeft}
          hint="Enterprise → Glimmora (paid)"
        />
        <StatCard
          label="Outflow"
          value={fmtMoney(k.outflow.major, cur)}
          icon={ArrowUpRight}
          hint="Glimmora → contributor (paid)"
        />
        <StatCard
          label="Margin"
          value={fmtMoney(k.margin.major, cur)}
          icon={TrendingUp}
          hint="Inflow − outflow − GST"
          hintTone="success"
        />
        <StatCard
          label="GST collected"
          value={fmtMoney(k.gst.major, cur)}
          icon={Percent}
          hint="Tax embedded in payouts"
        />
        <StatCard
          label="Pending payouts"
          value={fmtMoney(k.pending.major, cur)}
          icon={Clock}
          hint={`${k.pending.count} payout${k.pending.count === 1 ? "" : "s"} owed`}
          hintTone={k.pending.count > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Paid payouts"
          value={fmtMoney(k.paid.major, cur)}
          icon={CheckCircle2}
          hint={`${k.paid.count} settled`}
          hintTone="success"
        />
        <StatCard
          label="SOWs with payments"
          value={k.sowsWithPayments}
          icon={ReceiptText}
          hint="Distinct funded SOWs"
        />
        <StatCard
          label="Failed transactions"
          value={k.failedTransactions}
          icon={AlertTriangle}
          hint={k.failedTransactions > 0 ? "Need attention" : "All clear"}
          hintTone={k.failedTransactions > 0 ? "error" : "success"}
        />
      </section>

      {/* ── escrow context strip ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <EscrowStat label="Escrow funded" value={fmtMoney(k.escrow.funded.major, cur)} icon={Landmark} />
        <EscrowStat label="Escrow spent" value={fmtMoney(k.escrow.spent.major, cur)} icon={Wallet} />
        <EscrowStat label="Escrow remaining" value={fmtMoney(k.escrow.remaining.major, cur)} icon={Wallet} />
      </section>

      {/* ── transactions ledger ── */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-stroke-subtle lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-1 rounded-full shrink-0" style={{ backgroundImage: AURORA_ACCENT }} aria-hidden />
              <p className="font-display text-[16px] font-bold tracking-[-0.01em] text-foreground">Transactions</p>
            </div>
            <p className="mt-1 pl-3.5 font-body text-[12px] text-text-tertiary">
              {filtered.length} {filtered.length === 1 ? "transaction" : "transactions"} · newest first
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs tabs={DIR_TABS} active={dir} onChange={(key) => setDir(key as DirFilter)} />
            <Tabs tabs={STATUS_TABS} active={status} onChange={(key) => setStatus(key as StatusFilter)} />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                  <th className="px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Flow</th>
                  <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">SOW / Task</th>
                  <th className="hidden md:table-cell px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Counterparty</th>
                  <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Amount</th>
                  <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Status</th>
                  <th className="hidden lg:table-cell px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Txn ID</th>
                  <th className="px-5 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <TxnRow key={`${t.direction}-${t.id}`} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <ReceiptText className="mx-auto h-8 w-8 text-text-disabled" strokeWidth={1.6} aria-hidden />
            <p className="mt-3 font-body text-[14px] font-semibold text-foreground">No transactions yet</p>
            <p className="mt-1 font-body text-[12.5px] text-text-tertiary">
              Enterprise payments and contributor payouts appear here as money moves.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EscrowStat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wallet }) {
  return (
    <div className={cn(DASH_CARD, "px-4 py-3.5 flex items-center justify-between gap-3")}>
      <div className="min-w-0">
        <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">{label}</p>
        <p className="mt-1 font-display text-[20px] font-bold tabular-nums text-foreground">{value}</p>
      </div>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0" style={{ backgroundImage: AURORA_ACCENT }}>
        <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      </span>
    </div>
  );
}

function TxnRow({ t }: { t: BillingTransaction }) {
  const sowHref = t.sowId ? `/admin/sow/${t.sowId}` : null;
  const primary = t.sowName || (t.sowId ? `SOW ${t.sowId}` : "—");
  const secondary = t.taskTitle || (t.taskId ? `Task ${t.taskId}` : null);

  return (
    <tr className="border-b border-stroke-subtle last:border-b-0 hover:bg-bg-subtle/60 transition-colors">
      <td className="px-5 py-3.5 align-middle">
        <DirectionBadge direction={t.direction} />
      </td>
      <td className="px-3 py-3.5 align-middle">
        {sowHref ? (
          <Link
            href={sowHref}
            className="block font-body text-[13.5px] font-semibold text-foreground hover:text-text-link hover:underline underline-offset-2 truncate max-w-[260px]"
          >
            {primary}
          </Link>
        ) : (
          <span className="block font-body text-[13.5px] font-semibold text-foreground truncate max-w-[260px]">{primary}</span>
        )}
        {secondary ? (
          <span className="block mt-0.5 font-body text-[12px] text-text-tertiary truncate max-w-[260px]">{secondary}</span>
        ) : null}
      </td>
      <td className="hidden md:table-cell px-3 py-3.5 align-middle">
        <span className="block font-body text-[12.5px] text-text-secondary truncate max-w-[200px]">{t.counterparty}</span>
        <span className="block mt-0.5 font-body text-[10.5px] uppercase tracking-[0.04em] text-text-tertiary">{t.counterpartyRole}</span>
      </td>
      <td className="px-3 py-3.5 align-middle text-right">
        <span
          className="font-mono text-[13px] font-semibold tabular-nums"
          style={{ color: t.direction === "in" ? "var(--color-success-text)" : "var(--color-foreground)" }}
        >
          {t.direction === "in" ? "+" : "−"}
          {fmtMoney(t.amount, t.currency)}
        </span>
      </td>
      <td className="px-3 py-3.5 align-middle">
        <StatusPill status={t.status} />
      </td>
      <td className="hidden lg:table-cell px-3 py-3.5 align-middle">
        <span className="font-mono text-[11px] text-text-tertiary truncate inline-block max-w-[160px] align-middle">
          {t.transactionId || "—"}
        </span>
      </td>
      <td className="px-5 py-3.5 align-middle text-right">
        <span className="font-mono text-[11px] text-text-secondary tabular-nums whitespace-nowrap" suppressHydrationWarning>
          {fmtDate(t.date)}
        </span>
      </td>
    </tr>
  );
}
