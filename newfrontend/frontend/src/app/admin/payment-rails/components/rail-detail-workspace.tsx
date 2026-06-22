"use client";

/**
 * Payment rail detail — Aurora Glass, tabbed (credentials · status · payouts).
 *
 *   · URL-synced tabs (?tab=credentials|status|payouts)
 *   · Stat strip for operational metrics, glass section panels, control actions
 */

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  PauseCircle,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
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
import {
  Banner,
  Chip,
  Crumbs,
  GlassCard,
  PageHeader,
  ProgressBar,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  type Tone,
  dangerBtnClass,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

type Tab = "credentials" | "status" | "payouts";

const TABS: Tab[] = ["credentials", "status", "payouts"];
const TAB_LABEL: Record<Tab, string> = {
  credentials: "Credentials",
  status: "Status",
  payouts: "Payouts",
};

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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function RailDetailWorkspace() {
  const params = useParams<{ railId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = useAdminSectionCanEdit("paymentRails");
  const r = usePaymentRail(params.railId);
  const [toast, setToast] = React.useState<string | null>(null);

  const tab = (searchParams.get("tab") as Tab | null) ?? "credentials";
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "credentials";

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
      <div className="space-y-5 animate-fade-in">
        <Crumbs items={[{ label: "Payment rails", href: "/admin/payment-rails" }, { label: "Not found" }]} />
        <p className="font-body text-[13px] text-text-secondary">Rail not found.</p>
      </div>
    );
  }

  const railId = r.id;
  const isDegraded = r.status === "degraded";
  const successPct = Math.max(0, Math.min(100, Math.round((100 - r.errorRate1hPct) * 10) / 10));

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

      <Crumbs items={[{ label: "Payment rails", href: "/admin/payment-rails" }, { label: `${r.provider} (${r.method})` }]} />

      <PageHeader
        eyebrow="Platform · Finance"
        title={`${r.provider} (${r.method})`}
        chips={<Chip tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Chip>}
        subtitle={
          <>
            {r.country}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {r.currency}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className="tabular-nums">{r.errorRate1hPct.toFixed(1)}%</span> error rate (1h)
          </>
        }
      />

      {!canEdit && (
        <Banner tone="neutral" icon={AlertTriangle} title="View-only access">
          Rail configuration requires Platform Admin or Payments Operator.
        </Banner>
      )}

      {isDegraded && (
        <Banner tone="warning" icon={AlertTriangle} title="Rail degraded">
          Elevated 5xx errors — review hold policy and consider draining pending payouts.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">
          Rail snapshot
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Error rate" value={`${r.errorRate1hPct.toFixed(1)}%`} tone={r.errorRate1hPct > 1 ? "warning" : "success"} size="lg" />
          <Stat label="Pending" value={r.pendingPayoutsCount} tone={r.pendingPayoutsCount > 0 ? "info" : "neutral"} size="lg" />
          <Stat label="Total queued" value={<span className="text-[18px]">{r.pendingPayoutsTotal}</span>} size="lg" />
          <Stat label="Oldest" value={<span className="text-[18px]">{r.pendingPayoutsOldest}</span>} size="lg" />
        </dl>
        <div className="mt-5 pt-4 border-t border-white/55">
          <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-2">
            Success rate (1h)
          </p>
          <ProgressBar pct={successPct} />
        </div>
      </GlassCard>

      <Tabs
        tabs={TABS.map((t) => ({
          key: t,
          label: TAB_LABEL[t],
          badge: t === "payouts" ? r.pendingPayoutsCount : null,
          badgeTone: "info",
        }))}
        active={activeTab}
        onChange={(k) => setTab(k as Tab)}
      />

      {activeTab === "credentials" && (
        <SectionCard title="API credentials" description="Masked keys and webhook configuration">
          <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <DetailRow label="Key ID" value={r.keyMask} mono />
            <DetailRow
              label="Secret"
              value={`******** (rotated ${fmtDate(r.secretRotatedAt)})`}
            />
            <DetailRow label="Webhook URL" value={r.webhookUrl} mono className="sm:col-span-2" />
          </dl>
          {canEdit && (
            <div className="px-5 sm:px-6 pb-5">
              <button type="button" onClick={handleRotateKey} className={ghostBtnClass}>
                <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
                Rotate key
              </button>
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "status" && (
        <div className="space-y-5">
          <SectionCard title="Operational status" description="Health and control actions">
            <div className="px-5 sm:px-6 py-5">
              <p className="font-body text-[13px] text-foreground mb-4 flex items-center flex-wrap gap-2">
                <span>Current status:</span>
                <Chip tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Chip>
                {isDegraded && <span className="text-text-tertiary">· since 1h ago · 5xx primarily</span>}
              </p>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handleTestRail} className={ghostBtnClass}>
                    <FlaskConical className="h-4 w-4" strokeWidth={2} aria-hidden /> Test rail
                  </button>
                  {r.status !== "paused" && (
                    <button type="button" onClick={handlePause} className={dangerBtnClass}>
                      <PauseCircle className="h-4 w-4" strokeWidth={2.4} aria-hidden /> Pause new payouts
                    </button>
                  )}
                  {r.status === "paused" && (
                    <button type="button" onClick={handleReEnable} className={primaryBtnClass} style={primaryStyle}>
                      <PlayCircle className="h-4 w-4" strokeWidth={2.4} aria-hidden /> Re-enable
                    </button>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Hold policy" description="Behavior when rail is degraded">
            <fieldset
              className="px-5 sm:px-6 py-5 space-y-2.5 font-body text-[12.5px] text-foreground"
              disabled={!canEdit}
            >
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
          </SectionCard>
        </div>
      )}

      {activeTab === "payouts" && (
        <SectionCard title="Pending payouts" description="Queue on this rail">
          <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-display text-[28px] font-semibold tabular-nums leading-none text-foreground">
                {r.pendingPayoutsCount}
              </p>
              <p className="mt-1.5 font-body text-[13px] text-text-secondary">
                <span className="tabular-nums">{r.pendingPayoutsTotal}</span> total · oldest {r.pendingPayoutsOldest}
              </p>
            </div>
            {canEdit && r.pendingPayoutsCount > 0 && (
              <button type="button" onClick={handleDrain} className={ghostBtnClass}>
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                Drain to fallback rail
              </button>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[13.5px] text-foreground break-all", mono && "font-mono text-[12.5px]")} suppressHydrationWarning>
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
        className="mt-0.5 h-4 w-4 accent-[var(--c-violet-500)]"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}
