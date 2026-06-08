"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { usePaymentRailsList } from "@/lib/hooks/use-admin-payment-rails";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockPaymentRail, RailStatus } from "@/mocks/admin/rails";
import { cn } from "@/lib/utils/cn";

const STATUS_LABEL: Record<RailStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  paused: "Paused",
};

function statusChip(s: RailStatus): "success" | "warning" | "neutral" {
  if (s === "active") return "success";
  if (s === "degraded") return "warning";
  return "neutral";
}

export function PaymentRailsWorkspace() {
  const rails = usePaymentRailsList();
  const canEdit = useAdminSectionCanEdit("paymentRails");
  const sp = useSearchParams();
  const [toast, setToast] = React.useState<string | null>(
    sp.get("drained") === "1"
      ? "Payouts drained to fallback rail."
      : sp.get("paused") === "1"
        ? "Rail paused."
        : null,
  );

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const degraded = rails.filter((r) => r.status === "degraded").length;
  const pendingTotal = rails.reduce((sum, r) => sum + r.pendingPayoutsCount, 0);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text">
          {toast}
        </div>
      )}

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Rail configuration requires Platform Admin or Payments Operator.
          </p>
        </div>
      )}

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Payments
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Payment rails
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Provider routes for contributor payouts — without configured rails, payouts fail at release.
        </p>
        <RecordLinks />
      </header>

      {degraded > 0 && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {degraded} rail{degraded === 1 ? "" : "s"} degraded
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Review error rates and hold policies before releasing pending payouts.
          </p>
        </div>
      )}

      <DashboardSection title="Rail fleet" description="Status and pending payout backlog">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Active" value={String(rails.filter((r) => r.status === "active").length)} highlight />
          <SummaryStat label="Degraded" value={String(degraded)} alert={degraded > 0} />
          <SummaryStat label="Paused" value={String(rails.filter((r) => r.status === "paused").length)} />
          <SummaryStat label="Pending payouts" value={String(pendingTotal)} highlight={pendingTotal > 0} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground">All rails</h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">{rails.length} configured routes</p>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          {rails.map((r) => (
            <RailRow key={r.id} rail={r} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function RailRow({ rail: r }: { rail: MockPaymentRail }) {
  return (
    <li>
      <Link
        href={`/admin/payment-rails/${r.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          r.status === "degraded" && "bg-warning-subtle/10 hover:bg-warning-subtle/20",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <StatusChip status={statusChip(r.status)} size="sm" showDot={r.status === "degraded"}>
              {STATUS_LABEL[r.status]}
            </StatusChip>
            <span className="font-body text-[13px] font-medium text-foreground truncate">
              {r.provider} ({r.method})
            </span>
          </span>
          <span className="font-body text-[12px] text-text-secondary block mt-0.5">
            {r.country} · {r.currency}
          </span>
          <span className="font-body text-[11px] text-text-tertiary block mt-0.5">
            {r.pendingPayoutsCount} pending · {r.pendingPayoutsTotal}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <StatusChip
            status={r.errorRate1hPct > 1 ? "warning" : "neutral"}
            size="sm"
            showDot={r.errorRate1hPct > 1}
          >
            {r.errorRate1hPct.toFixed(1)}% err
          </StatusChip>
        </span>
      </Link>
    </li>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-warning-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link href="/admin/system-health" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        System health
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/admin/audit?resource=payout" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        Payout audit
      </Link>
    </p>
  );
}
