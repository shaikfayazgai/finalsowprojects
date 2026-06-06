"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  PauseCircle,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  drainRailToFallback,
  rotateRailKey,
  setRailHoldPolicy,
  setRailStatus,
} from "@/lib/admin/mocks/rails-service";
import { usePaymentRail } from "@/lib/hooks/use-admin-payment-rails";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockPaymentRail, RailStatus } from "@/mocks/admin/rails";
import { cn } from "@/lib/utils/cn";

type Tab = "credentials" | "status" | "payouts";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "credentials", label: "Credentials" },
  { key: "status", label: "Status" },
  { key: "payouts", label: "Payouts" },
];

function statusChip(s: RailStatus): "success" | "warning" | "neutral" {
  if (s === "active") return "success";
  if (s === "degraded") return "warning";
  return "neutral";
}

export function RailDetailWorkspace() {
  const params = useParams<{ railId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = useAdminSectionCanEdit("paymentRails");
  const r = usePaymentRail(params.railId);
  const [toast, setToast] = React.useState<string | null>(null);

  const tab = (searchParams.get("tab") as Tab | null) ?? "credentials";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "credentials";

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "credentials") nextParams.delete("tab");
      else nextParams.set("tab", next);
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/payment-rails/${params.railId}?${qs}` : `/admin/payment-rails/${params.railId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.railId],
  );

  if (!r) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link href="/admin/payment-rails" className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Payment rails
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Rail not found.</p>
      </div>
    );
  }

  const railId = r.id;
  const isDegraded = r.status === "degraded";

  function handleRotateKey() {
    if (!canEdit) return;
    rotateRailKey(railId);
    setToast("API key rotated.");
  }

  function handleTestRail() {
    if (!canEdit) return;
    setToast("Test payout succeeded in sandbox.");
  }

  function handlePause() {
    if (!canEdit) return;
    setRailStatus(railId, "paused");
    setToast("New payouts paused on this rail.");
  }

  function handleReEnable() {
    if (!canEdit) return;
    setRailStatus(railId, "active");
    setToast("Rail re-enabled.");
  }

  function handleHoldPolicy(policy: MockPaymentRail["holdPolicy"]) {
    if (!canEdit) return;
    setRailHoldPolicy(railId, policy);
    setToast("Hold policy updated.");
  }

  function handleDrain() {
    if (!canEdit) return;
    const result = drainRailToFallback(railId);
    if (!result) {
      setToast("No pending payouts to drain.");
      return;
    }
    if (result.target) {
      router.push("/admin/payment-rails?drained=1");
    } else {
      setToast("Pending payouts cleared — no fallback rail available.");
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div role="status" className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text">
          {toast}
        </div>
      )}

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-body text-[12px] text-text-tertiary">
        <Link href="/admin/payment-rails" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Payment rails</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">{r.provider} ({r.method})</span>
      </nav>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Payments
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {r.provider} ({r.method})
          </h1>
          <StatusChip status={statusChip(r.status)} size="sm" showDot={isDegraded}>
            {r.status}
          </StatusChip>
        </div>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
          {r.country} · {r.currency} · {r.errorRate1hPct.toFixed(1)}% error rate (1h)
        </p>
      </header>

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Rail configuration requires Platform Admin or Payments Operator.
          </p>
        </div>
      )}

      {isDegraded && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text">Rail degraded</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Elevated 5xx errors — review hold policy and consider draining pending payouts.
          </p>
        </div>
      )}

      <DashboardSection title="Rail snapshot" description="Operational metrics">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Error rate" value={`${r.errorRate1hPct.toFixed(1)}%`} alert={r.errorRate1hPct > 1} />
          <SummaryStat label="Pending" value={String(r.pendingPayoutsCount)} highlight={r.pendingPayoutsCount > 0} />
          <SummaryStat label="Total queued" value={r.pendingPayoutsTotal} />
          <SummaryStat label="Oldest" value={r.pendingPayoutsOldest} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav aria-label="Rail sections" className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {active && (
                  <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 bg-brand rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 space-y-5">
          {activeTab === "credentials" && (
            <Panel title="API credentials" description="Masked keys and webhook configuration">
              <dl className="space-y-3">
                <DetailRow label="Key ID" value={r.keyMask} mono />
                <DetailRow
                  label="Secret"
                  value={`******** (rotated ${new Date(r.secretRotatedAt).toLocaleDateString()})`}
                />
                <DetailRow label="Webhook URL" value={r.webhookUrl} mono />
              </dl>
              {canEdit && (
                <button type="button" onClick={handleRotateKey} className={cn(actionBtnCls, "mt-4")}>
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Rotate key
                </button>
              )}
            </Panel>
          )}

          {activeTab === "status" && (
            <>
              <Panel title="Operational status" description="Health and control actions">
                <p className="font-body text-[13px] text-foreground mb-4">
                  Current status:{" "}
                  <StatusChip status={statusChip(r.status)} size="sm">{r.status}</StatusChip>
                  {isDegraded && <span className="text-text-tertiary ml-2">· since 1h ago · 5xx primarily</span>}
                </p>
                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handleTestRail} className={actionBtnCls}>
                      <FlaskConical className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Test rail
                    </button>
                    {r.status !== "paused" && (
                      <button type="button" onClick={handlePause} className={actionBtnCls}>
                        <PauseCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Pause new payouts
                      </button>
                    )}
                    {r.status === "paused" && (
                      <button type="button" onClick={handleReEnable} className={primaryBtnCls}>
                        <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Re-enable
                      </button>
                    )}
                  </div>
                )}
              </Panel>

              <Panel title="Hold policy" description="Behavior when rail is degraded">
                <fieldset className="space-y-2 font-body text-[12.5px] text-foreground" disabled={!canEdit}>
                  <Radio
                    name="hold"
                    checked={r.holdPolicy === "hold_when_degraded"}
                    onChange={() => handleHoldPolicy("hold_when_degraded")}
                  >
                    Hold new payouts until error rate &lt; 1% for 10 min
                  </Radio>
                  <Radio
                    name="hold"
                    checked={r.holdPolicy === "continue_routing"}
                    onChange={() => handleHoldPolicy("continue_routing")}
                  >
                    Continue routing despite errors{" "}
                    <span className="text-text-tertiary">(not recommended)</span>
                  </Radio>
                </fieldset>
              </Panel>
            </>
          )}

          {activeTab === "payouts" && (
            <Panel title="Pending payouts" description="Queue on this rail">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-body text-[24px] font-semibold tabular-nums text-foreground">
                    {r.pendingPayoutsCount}
                  </p>
                  <p className="font-body text-[13px] text-text-secondary mt-1">
                    {r.pendingPayoutsTotal} total · oldest {r.pendingPayoutsOldest}
                  </p>
                </div>
                {canEdit && r.pendingPayoutsCount > 0 && (
                  <button type="button" onClick={handleDrain} className={actionBtnCls}>
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Drain to fallback rail
                  </button>
                )}
              </div>
            </Panel>
          )}
        </div>
      </section>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/20 overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <h2 className="font-body text-[13px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{description}</p>
        )}
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="sm:w-28 shrink-0 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className={cn("font-body text-[13px] text-foreground break-all", mono && "font-mono text-[12px]")}>
        {value}
      </dd>
    </div>
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
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight truncate",
          alert ? "text-warning-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 border-stroke text-brand focus:ring-brand"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);
