"use client";

/**
 * Payment rails — Aurora Glass fleet directory.
 *
 *   · Summary stat strip (active / degraded / paused / pending payouts)
 *   · Glass rail list (provider · method · status · coverage · error rate)
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronRight, CreditCard } from "lucide-react";
import { usePaymentRailsList } from "@/lib/hooks/use-admin-payment-rails";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockPaymentRail, RailStatus } from "@/mocks/admin/rails";
import {
  Banner,
  Chip,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
  TONE,
  type Tone,
} from "../../_shell/aurora-ui";

const STATUS_LABEL: Record<RailStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  paused: "Paused",
};

const STATUS_TONE: Record<RailStatus, Tone> = {
  active: "success",
  degraded: "warning",
  paused: "neutral",
};

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
  const paused = rails.filter((r) => r.status === "paused").length;
  const active = rails.filter((r) => r.status === "active").length;
  const pendingTotal = rails.reduce((sum, r) => sum + r.pendingPayoutsCount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border px-4 py-2.5 font-body text-[12.5px] font-semibold"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}
        >
          {toast}
        </div>
      )}

      <PageHeader
        eyebrow="Platform · Finance"
        title="Payment rails"
        subtitle="Provider routes for contributor payouts — without configured rails, payouts fail at release."
      />

      <RecordLinks />

      {!canEdit && (
        <Banner tone="neutral" icon={CreditCard} title="View-only access">
          Rail configuration requires Platform Admin or Payments Operator.
        </Banner>
      )}

      {degraded > 0 && (
        <Banner tone="warning" icon={AlertTriangle} title={`${degraded} rail${degraded === 1 ? "" : "s"} degraded`}>
          Review error rates and hold policies before releasing pending payouts.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">
          Rail fleet
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Active" value={active} tone="success" size="lg" />
          <Stat label="Degraded" value={degraded} tone={degraded > 0 ? "warning" : "neutral"} size="lg" />
          <Stat label="Paused" value={paused} size="lg" />
          <Stat label="Pending payouts" value={pendingTotal} tone={pendingTotal > 0 ? "info" : "neutral"} size="lg" />
        </dl>
      </GlassCard>

      <SectionCard title="All rails" description={`${rails.length} configured routes`}>
        <ul className="px-3 sm:px-4 py-3 space-y-2">
          {rails.map((r) => (
            <RailRow key={r.id} rail={r} />
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function RailRow({ rail: r }: { rail: MockPaymentRail }) {
  const elevatedErr = r.errorRate1hPct > 1;
  return (
    <li>
      <Link
        href={`/admin/payment-rails/${r.id}`}
        className="group flex items-center gap-3 rounded-xl border border-white/55 bg-white/40 px-4 py-3 hover:bg-white/65 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.4)]"
      >
        <span className="grid place-items-center h-9 w-9 rounded-lg shrink-0 text-text-tertiary border border-white/70 bg-white/55">
          <CreditCard className="h-4 w-4" strokeWidth={1.85} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-[13.5px] font-semibold text-foreground truncate">
              {r.provider} ({r.method})
            </span>
            <Chip tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Chip>
          </span>
          <span className="block mt-0.5 font-body text-[11.5px] text-text-tertiary">
            {r.country}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {r.currency}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className="tabular-nums">{r.pendingPayoutsCount}</span> pending
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className="tabular-nums">{r.pendingPayoutsTotal}</span>
          </span>
        </span>
        <span className="shrink-0">
          <Chip tone={elevatedErr ? "warning" : "neutral"} dot={elevatedErr}>
            {r.errorRate1hPct.toFixed(1)}% err
          </Chip>
        </span>
        <ChevronRight
          className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </li>
  );
}

function RecordLinks() {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
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
