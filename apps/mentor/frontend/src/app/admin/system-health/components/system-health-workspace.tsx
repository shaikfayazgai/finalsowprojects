"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  SERVICE_DRILLDOWN,
  useAdminSystemHealth,
} from "@/lib/hooks/use-admin-system-health";
import type { MockAlertEntry, MockServiceHealth, ServiceStatus } from "@/mocks/admin/services";
import { cn } from "@/lib/utils/cn";

type StatusFilter = "all" | ServiceStatus;

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "healthy", label: "Healthy" },
  { key: "degraded", label: "Degraded" },
  { key: "down", label: "Down" },
];

const ALERT_HREF: Record<string, string> = {
  "al-1": "/admin/payment-rails/rail-rzp-upi",
  "al-3": "/admin/ai",
};

function serviceChip(s: ServiceStatus): "success" | "warning" | "error" {
  if (s === "healthy") return "success";
  if (s === "degraded") return "warning";
  return "error";
}

function fmtLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function fmtRel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.round(ms / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export function SystemHealthWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { services, alerts } = useAdminSystemHealth();

  const statusFilter = (searchParams.get("status") as StatusFilter | null) ?? "all";
  const activeFilter = STATUS_TABS.some((t) => t.key === statusFilter) ? statusFilter : "all";

  const setFilter = React.useCallback(
    (key: StatusFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "all") params.delete("status");
      else params.set("status", key);
      const qs = params.toString();
      router.replace(qs ? `/admin/system-health?${qs}` : "/admin/system-health", { scroll: false });
    },
    [router, searchParams],
  );

  const filtered = React.useMemo(() => {
    if (activeFilter === "all") return services;
    return services.filter((s) => s.status === activeFilter);
  }, [services, activeFilter]);

  const healthy = services.filter((s) => s.status === "healthy").length;
  const degraded = services.filter((s) => s.status === "degraded").length;
  const down = services.filter((s) => s.status === "down").length;
  const ongoingAlerts = alerts.filter((a) => a.ongoing).length;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Reliability
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              System health
            </h1>
            <StatusChip status="error" size="sm">PROD</StatusChip>
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Read-only service status, latency, and recent alerts. Full SRE control plane ships in Phase 2.
          </p>
          <RecordLinks />
        </div>
      </header>

      {ongoingAlerts > 0 && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {ongoingAlerts} ongoing alert{ongoingAlerts === 1 ? "" : "s"}
          </p>
        </div>
      )}

      <DashboardSection title="Platform snapshot" description={`${services.length} monitored services`}>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Healthy" value={String(healthy)} highlight={healthy > 0} />
          <SummaryStat label="Degraded" value={String(degraded)} alert={degraded > 0} />
          <SummaryStat label="Down" value={String(down)} alert={down > 0} />
          <SummaryStat label="Ongoing alerts" value={String(ongoingAlerts)} alert={ongoingAlerts > 0} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <header className="pb-4">
            <h2 className="font-body text-[15.5px] font-semibold text-foreground">Services</h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {filtered.length} of {services.length} shown
            </p>
          </header>
          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {STATUS_TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count =
                tab.key === "all"
                  ? services.length
                  : services.filter((s) => s.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-text-secondary",
                  )}
                >
                  {tab.label}
                  <span className="font-mono text-[10px] tabular-nums text-text-tertiary">{count}</span>
                  {active && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <ul className="divide-y divide-stroke-subtle">
          {filtered.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground">Recent alerts</h2>
        </header>
        <ul className="divide-y divide-stroke-subtle">
          {alerts.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ServiceRow({ service: s }: { service: MockServiceHealth }) {
  const drilldown = SERVICE_DRILLDOWN[s.name];
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <StatusChip status={serviceChip(s.status)} size="sm" showDot={s.status !== "healthy"}>
            {s.status}
          </StatusChip>
          <code className="font-mono text-[12px] text-foreground truncate">{s.name}</code>
        </span>
        {s.description && (
          <span className="font-body text-[11px] text-text-tertiary block mt-0.5 truncate">{s.description}</span>
        )}
      </span>
      <span className="shrink-0 text-right flex flex-col items-end gap-1">
        <span className="font-mono text-[11.5px] tabular-nums text-text-secondary">
          p95 {fmtLatency(s.p95LatencyMs)}
        </span>
        <span
          className={cn(
            "font-mono text-[10.5px] tabular-nums",
            s.errors10m > 0 ? "text-warning-text" : "text-text-tertiary",
          )}
        >
          {s.errors10m} err (10m)
        </span>
      </span>
      {drilldown && (
        <ExternalLink className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      )}
    </>
  );

  return (
    <li>
      {drilldown ? (
        <Link
          href={drilldown}
          className="flex items-center gap-4 px-5 py-3 min-h-[52px] hover:bg-bg-subtle/60 transition-colors duration-fast"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-4 px-5 py-3 min-h-[52px]">{inner}</div>
      )}
    </li>
  );
}

function AlertRow({ alert: a }: { alert: MockAlertEntry }) {
  const href = ALERT_HREF[a.id];
  const Icon =
    a.severity === "critical"
      ? AlertCircle
      : a.severity === "warning" || a.ongoing
        ? AlertTriangle
        : CheckCircle2;
  const iconCls =
    a.severity === "critical"
      ? "text-error-text"
      : a.severity === "warning" || a.ongoing
        ? "text-warning-text"
        : "text-success-text";

  const inner = (
    <>
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", iconCls)} strokeWidth={2} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-body text-[13px] text-foreground">{a.text}</p>
        <p className="font-mono text-[10.5px] text-text-tertiary mt-0.5">
          {fmtRel(a.at)}
          {a.ongoing && " · ongoing"}
        </p>
      </div>
      {href && (
        <ExternalLink className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      )}
    </>
  );

  return (
    <li>
      {href ? (
        <Link href={href} className="flex items-start gap-3 px-5 py-3 hover:bg-bg-subtle/60 transition-colors duration-fast">
          {inner}
        </Link>
      ) : (
        <div className="flex items-start gap-3 px-5 py-3">{inner}</div>
      )}
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
      <Link href="/admin/payment-rails" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        Payment rails
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/admin/ai" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        AI agents
      </Link>
    </p>
  );
}
