"use client";

/**
 * Audit event detail — aligned with case/KYC detail patterns.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ScrollText } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { findAdminAuditEvent, type AdminAuditSeverity } from "@/mocks/admin/audit";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "details";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "details", label: "Details" },
];

function severityChip(s: AdminAuditSeverity): "success" | "warning" | "error" | "info" | "neutral" {
  switch (s) {
    case "info":
      return "neutral";
    case "warning":
      return "warning";
    case "critical":
      return "error";
  }
}

export function AuditDetailWorkspace() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const e = findAdminAuditEvent(params.eventId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const hasDetails = Boolean(e?.details && Object.keys(e.details).length > 0);
  const activeTab =
    tab === "details" && hasDetails ? "details" : tab === "details" && !hasDetails ? "overview" : tab;

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "overview") nextParams.delete("tab");
      else nextParams.set("tab", next);
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/audit/${params.eventId}?${qs}` : `/admin/audit/${params.eventId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.eventId],
  );

  if (!e) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/audit"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Audit log
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Event not found.</p>
      </div>
    );
  }

  const detailCount = e.details ? Object.keys(e.details).length : 0;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/audit"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Audit log</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary font-mono text-[11.5px]">{e.id}</span>
      </nav>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Compliance
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {e.action}
          </h1>
          <StatusChip status={severityChip(e.severity)} size="sm" showDot={e.severity !== "info"}>
            {e.severity}
          </StatusChip>
        </div>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
          <span className="font-mono text-[12px]">{e.id}</span>
          <span aria-hidden className="opacity-50 mx-1.5">·</span>
          {new Date(e.timestamp).toLocaleString()}
          <span aria-hidden className="opacity-50 mx-1.5">·</span>
          {e.tenant || "Glimmora internal"}
        </p>
      </header>

      <DashboardSection title="Event snapshot" description="Actor, resource, and network context">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Actor" value={e.actor} />
          <SummaryStat label="Resource" value={e.resourceType} highlight />
          <SummaryStat label="Role" value={e.actorRole} />
          <SummaryStat label="IP" value={e.ip ?? "—"} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Event sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            if (t.key === "details" && !hasDetails) return null;
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
                {t.key === "details" && detailCount > 0 && (
                  <span className="font-mono text-[10px] tabular-nums text-text-tertiary">
                    {detailCount}
                  </span>
                )}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px h-0.5 bg-brand rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 space-y-5">
          {activeTab === "overview" && <OverviewTab event={e} />}
          {activeTab === "details" && hasDetails && <DetailsTab event={e} />}
        </div>
      </section>
    </div>
  );
}

function OverviewTab({ event: e }: { event: NonNullable<ReturnType<typeof findAdminAuditEvent>> }) {
  return (
    <>
      <Panel title="Actor & tenant" description="Who performed this action and in which scope">
        <dl className="space-y-3">
          <DetailRow label="Tenant" value={e.tenant || "Glimmora internal"} />
          <DetailRow label="Actor" value={e.actor} />
          <DetailRow label="Role" value={e.actorRole} />
          <DetailRow label="IP address" value={e.ip ?? "—"} mono />
        </dl>
      </Panel>

      <Panel title="Resource" description="Target entity for this audit event">
        <dl className="space-y-3">
          <DetailRow label="Action" value={e.action} mono />
          <DetailRow label="Type" value={e.resourceType} />
          <DetailRow label="ID" value={e.resourceId} mono />
          <DetailRow label="Label" value={e.resourceLabel} />
        </dl>
      </Panel>
    </>
  );
}

function DetailsTab({ event: e }: { event: NonNullable<ReturnType<typeof findAdminAuditEvent>> }) {
  if (!e.details) return null;

  return (
    <Panel title="Extended payload" description="Additional key-value context logged with this event">
      <dl className="space-y-3">
        {Object.entries(e.details).map(([k, v]) => (
          <DetailRow key={k} label={k} value={v} mono />
        ))}
      </dl>
    </Panel>
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
      <header className="px-4 py-3 border-b border-stroke-subtle flex items-start gap-2">
        <ScrollText className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        <div>
          <h2 className="font-body text-[13px] font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{description}</p>
          )}
        </div>
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="sm:w-40 shrink-0 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "font-body text-[13px] text-foreground break-all",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[15px] font-semibold tracking-tight truncate",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
