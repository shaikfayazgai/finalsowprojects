"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  SERVICE_DRILLDOWN,
  useAdminSystemHealth,
} from "@/lib/hooks/use-admin-system-health";
import type { MockAlertEntry, MockServiceHealth, ServiceStatus } from "@/mocks/admin/services";
import { cn } from "@/lib/utils/cn";
import {
  Banner,
  Chip,
  GlassCard,
  InlineLink,
  PageHeader,
  ProgressBar,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  type Tone,
} from "../../_shell/aurora-ui";

type StatusFilter = "all" | ServiceStatus;

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "healthy", label: "Healthy" },
  { key: "degraded", label: "Degraded" },
  { key: "down", label: "Down" },
];

const STATUS_LABEL: Record<ServiceStatus, string> = {
  healthy: "Operational",
  degraded: "Degraded",
  down: "Down",
};

const STATUS_TONE: Record<ServiceStatus, Tone> = {
  healthy: "success",
  degraded: "warning",
  down: "error",
};

const ALERT_HREF: Record<string, string> = {
  "al-1": "/admin/payment-rails/rail-rzp-upi",
  "al-3": "/admin/ai",
};

/**
 * Derived uptime proxy for the ProgressBar — the mock carries no uptime field,
 * so we estimate from status + recent error volume to keep the dashboard honest.
 */
function uptimePct(s: MockServiceHealth): number {
  if (s.status === "down") return 0;
  if (s.status === "degraded") return Math.max(90, 99 - s.errors10m);
  return Math.max(99, 100 - s.errors10m * 0.1);
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

  const statusFilter = (searchParams.get("svcStatus") as StatusFilter | null) ?? "all";
  const activeFilter = STATUS_TABS.some((t) => t.key === statusFilter) ? statusFilter : "all";

  const setFilter = React.useCallback(
    (key: StatusFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "all") params.delete("svcStatus");
      else params.set("svcStatus", key);
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
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        eyebrow="Platform · Infrastructure"
        title="System health"
        chips={<Chip tone="error">PROD</Chip>}
        subtitle="Read-only service status, latency, and recent alerts. Full SRE control plane ships in Phase 2."
        actions={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <InlineLink href="/admin/payment-rails">Payment rails</InlineLink>
            <InlineLink href="/admin/ai">AI agents</InlineLink>
          </div>
        }
      />

      {ongoingAlerts > 0 && (
        <Banner tone="warning" icon={AlertTriangle} title={`${ongoingAlerts} ongoing alert${ongoingAlerts === 1 ? "" : "s"}`}>
          Active incidents are listed in the recent alerts feed below.
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">
          Platform snapshot · {services.length} monitored services
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Operational" value={healthy} tone={healthy > 0 ? "success" : "neutral"} size="lg" />
          <Stat label="Degraded" value={degraded} tone={degraded > 0 ? "warning" : "neutral"} size="lg" />
          <Stat label="Down" value={down} tone={down > 0 ? "error" : "neutral"} size="lg" />
          <Stat label="Ongoing alerts" value={ongoingAlerts} tone={ongoingAlerts > 0 ? "warning" : "neutral"} size="lg" />
        </dl>
      </GlassCard>

      <SectionCard
        title="Services"
        description={`${filtered.length} of ${services.length} shown`}
        headerExtra={
          <Tabs
            tabs={STATUS_TABS.map((tab) => ({
              key: tab.key,
              label: tab.label,
              badge:
                tab.key === "all"
                  ? services.length
                  : services.filter((s) => s.status === tab.key).length,
              badgeTone:
                tab.key === "degraded" ? "warning" : tab.key === "down" ? "error" : tab.key === "healthy" ? "success" : "neutral",
            }))}
            active={activeFilter}
            onChange={(k) => setFilter(k as StatusFilter)}
          />
        }
      >
        <ul className="divide-y divide-white/40">
          {filtered.length === 0 && (
            <li className="px-5 sm:px-6 py-10 text-center font-body text-[12.5px] text-text-tertiary">
              No services in this state.
            </li>
          )}
          {filtered.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Recent alerts" description="Incident feed across monitored services">
        <ul className="divide-y divide-white/40">
          {alerts.length === 0 && (
            <li className="px-5 sm:px-6 py-10 text-center font-body text-[12.5px] text-text-tertiary">
              No recent alerts.
            </li>
          )}
          {alerts.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function ServiceRow({ service: s }: { service: MockServiceHealth }) {
  const drilldown = SERVICE_DRILLDOWN[s.name];
  const pct = Math.round(uptimePct(s) * 10) / 10;

  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <Chip tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Chip>
          <code className="font-mono text-[12px] text-foreground truncate">{s.name}</code>
        </span>
        {s.description && (
          <span className="font-body text-[11.5px] text-text-tertiary block mt-1 truncate">{s.description}</span>
        )}
        <span className="block mt-2 max-w-[280px]">
          <ProgressBar pct={pct} height="h-1.5" />
        </span>
      </span>
      <span className="shrink-0 text-right flex flex-col items-end gap-1">
        <span className="font-mono text-[11.5px] tabular-nums text-text-secondary">p95 {fmtLatency(s.p95LatencyMs)}</span>
        <span
          className={cn("font-mono text-[10.5px] tabular-nums", s.errors10m > 0 ? "text-warning-text" : "text-text-tertiary")}
        >
          {s.errors10m} err (10m)
        </span>
      </span>
      {drilldown && (
        <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
      )}
    </>
  );

  return (
    <li>
      {drilldown ? (
        <Link
          href={drilldown}
          className="group flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-white/40 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.4)]"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-4 px-5 sm:px-6 py-4">{inner}</div>
      )}
    </li>
  );
}

function AlertRow({ alert: a }: { alert: MockAlertEntry }) {
  const href = ALERT_HREF[a.id];
  const tone: Tone =
    a.severity === "critical" ? "error" : a.severity === "warning" || a.ongoing ? "warning" : "success";
  const Icon =
    a.severity === "critical" ? AlertCircle : a.severity === "warning" || a.ongoing ? AlertTriangle : CheckCircle2;

  const inner = (
    <>
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ background: TONE[tone].soft, color: TONE[tone].text }}
      >
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-body text-[13px] text-foreground">{a.text}</p>
        <p className="font-mono text-[10.5px] text-text-tertiary mt-0.5" suppressHydrationWarning>
          {fmtRel(a.at)}
          {a.ongoing && " · ongoing"}
        </p>
      </div>
      {href && (
        <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
      )}
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="group flex items-center gap-3 px-5 sm:px-6 py-4 hover:bg-white/40 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.4)]"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4">{inner}</div>
      )}
    </li>
  );
}
