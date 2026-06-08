"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection, MetricTile } from "@/components/meridian/dashboard";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { MOCK_ADMIN_DASHBOARD } from "@/mocks/admin/dashboard";
import type { AdminAttentionKind, MockAdminAttentionItem } from "@/mocks/admin/dashboard";
import { cn } from "@/lib/utils/cn";
import {
  ATTENTION_KIND_LABEL,
  filterAttentionForRole,
  pulseBandForRole,
  roleBrief,
  timeAgo,
  type LinkedPulseMetric,
} from "./dashboard-data";

function fmtDay(): string {
  // Pin the locale — `undefined` resolves to the runtime locale, which differs
  // between the Node server (en-US → "June 4") and a browser set to en-GB
  // ("4 June"), causing a React hydration mismatch on the dashboard header.
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function greeting(firstName: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${firstName}`;
  if (h < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

function envChip(env: "PROD" | "STAGING" | "DEV"): "error" | "warning" | "neutral" {
  if (env === "PROD") return "error";
  if (env === "STAGING") return "warning";
  return "neutral";
}

function attentionKindChip(kind: AdminAttentionKind): "error" | "warning" | "pending" | "info" {
  switch (kind) {
    case "governance":
      return "warning";
    case "kyc":
      return "pending";
    case "rail":
      return "error";
    case "system":
      return "info";
  }
}

function signalIcon(tone: "positive" | "neutral" | "warning") {
  if (tone === "warning") {
    return <AlertTriangle className="h-3.5 w-3.5 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />;
  }
  if (tone === "positive") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />;
  }
  return <Sparkles className="h-3.5 w-3.5 text-brand-subtle-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />;
}

export function AdminDashboardWorkspace() {
  const { role, profile } = useActiveAdmin();
  const d = MOCK_ADMIN_DASHBOARD;

  const attention = React.useMemo(
    () => filterAttentionForRole(d.attention, role),
    [d.attention, role],
  );
  const pulse = React.useMemo(() => pulseBandForRole(role, d), [role, d]);
  const brief = roleBrief(role);

  const hero = attention[0] ?? null;
  const rest = attention.slice(1);
  const urgentCount = attention.filter((a) => a.slaHours != null && a.slaHours <= 8).length;
  const firstName = profile.displayName.split(/\s+/)[0];

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Command center
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {greeting(firstName)}
            </h1>
            <StatusChip status={envChip(d.env)} size="sm">
              {d.env}
            </StatusChip>
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            {profile.title}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Today · {fmtDay()}
          </p>
          <RecordLinks />
        </div>
      </header>

      <DashboardSection
        title="Operator snapshot"
        description="Your queue and platform action load for today"
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="In queue" value={String(attention.length)} highlight={attention.length > 0} />
          <SummaryStat label="Within SLA" value={String(urgentCount)} alert={urgentCount > 0} />
          <SummaryStat label="Resolved (30d)" value={String(d.actionBreakdown.resolved30d)} />
          <SummaryStat
            label="Held payouts"
            value={String(d.actionBreakdown.onHold)}
            alert={d.actionBreakdown.onHold > 0}
          />
        </dl>
      </DashboardSection>

      {hero ? (
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary">
                Next action
              </p>
              <h2 className="mt-1 font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Highest priority in your queue
              </h2>
            </div>
            <StatusChip status={attentionKindChip(hero.kind)} size="sm">
              {ATTENTION_KIND_LABEL[hero.kind]}
            </StatusChip>
          </header>
          <div className="px-5 py-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <h3 className="font-body text-[18px] font-semibold text-foreground tracking-[-0.01em] leading-tight">
                  {hero.title}
                </h3>
                <p className="mt-1.5 font-body text-[12.5px] text-text-secondary">
                  {hero.entity}
                  {hero.slaHours != null && hero.slaHours <= 8 && (
                    <>
                      <span aria-hidden className="opacity-50 mx-1.5">·</span>
                      <span className="font-semibold text-warning-text">
                        SLA: {hero.slaHours}h window
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-3 font-body text-[12px] text-text-tertiary leading-relaxed">
                  Start here — this item ranks first for {profile.title.toLowerCase()} operators today.
                </p>
              </div>
              <Link href={hero.href} className={primaryBtnCls}>
                Open
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-stroke-subtle bg-surface px-5 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-success-text mx-auto mb-2" strokeWidth={1.75} aria-hidden />
          <p className="font-body text-[13.5px] font-semibold text-foreground">You&apos;re all caught up</p>
          <p className="mt-1 font-body text-[12.5px] text-text-tertiary max-w-md mx-auto">
            New governance, KYC, and rail alerts will appear here when they need your attention.
          </p>
        </section>
      )}

      {brief && role !== "plat.admin" && (
        <DashboardSection
          title="Your workspace"
          description="Role-specific focus for today"
          viewAllHref={brief.href}
          viewAllLabel="Open workspace"
        >
          <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/20 px-4 py-3.5">
            <p className="font-body text-[13px] font-semibold text-foreground">{brief.title}</p>
            <p className="mt-0.5 font-body text-[12.5px] text-text-secondary leading-relaxed">{brief.body}</p>
          </div>
        </DashboardSection>
      )}

      {rest.length > 0 && (
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Also pending
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {rest.length} more item{rest.length === 1 ? "" : "s"} in your operator queue
            </p>
          </header>
          <ul className="divide-y divide-stroke-subtle">
            {rest.map((item) => (
              <AttentionRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      <DashboardSection
        title="Platform glance"
        description="Key metrics for your role — tap through for detail"
      >
        <LinkedPulseBand metrics={pulse} />
      </DashboardSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardSection
          title="Recent activity"
          description="Latest platform events"
          viewAllHref="/admin/audit"
          viewAllLabel="Audit log"
        >
          <ul className="divide-y divide-stroke-subtle rounded-xl border border-stroke-subtle overflow-hidden">
            {d.recent.map((ev, i) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3 bg-bg-subtle/10">
                <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0 w-14 pt-0.5">
                  {timeAgo(ev.at)}
                </span>
                <p className="font-body text-[12.5px] text-foreground leading-snug flex-1 min-w-0">
                  {ev.text}
                </p>
              </li>
            ))}
          </ul>
        </DashboardSection>

        <DashboardSection
          title="Platform signals"
          description="AI-assisted insights and trend flags"
        >
          <ul className="divide-y divide-stroke-subtle rounded-xl border border-stroke-subtle overflow-hidden">
            {d.aiSignals.map((sig) => (
              <li key={sig.id}>
                <Link
                  href={sig.href}
                  className={cn(
                    "px-4 py-3 flex items-start gap-2.5",
                    "bg-bg-subtle/10 hover:bg-bg-subtle/30 transition-colors duration-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                  )}
                >
                  {signalIcon(sig.tone)}
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[12.5px] font-medium text-foreground">{sig.title}</p>
                    <p className="font-body text-[11.5px] text-text-tertiary mt-0.5 leading-relaxed">
                      {sig.description}
                    </p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </DashboardSection>
      </div>
    </div>
  );
}

function AttentionRow({ item }: { item: MockAdminAttentionItem }) {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-5 py-3 min-h-[52px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <StatusChip status={attentionKindChip(item.kind)} size="sm">
          {ATTENTION_KIND_LABEL[item.kind]}
        </StatusChip>
        <span className="font-body text-[13px] font-medium text-foreground truncate flex-1 min-w-0">
          {item.title}
        </span>
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0 hidden sm:block">
          {item.entity}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}

function LinkedPulseBand({ metrics }: { metrics: LinkedPulseMetric[] }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => (
        <Link
          key={m.id}
          href={m.href}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
        >
          <MetricTile
            label={m.label}
            value={m.value}
            tone={m.tone}
            hint={m.hint}
            icon={m.icon}
            spark={m.spark}
          />
        </Link>
      ))}
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
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
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
      <Link
        href="/admin/governance"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Governance
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/admin/kyc"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        KYC
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/admin/system-health"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        System health
      </Link>
    </p>
  );
}

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0 shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);
