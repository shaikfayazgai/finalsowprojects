"use client";

/**
 * Audit event detail — Aurora Glass forensic record.
 *
 *   · Crumbs (back to log) + PageHeader (action code + severity chip)
 *   · Event snapshot stat strip
 *   · URL-synced tabs (?tab=overview|details) — details hidden when empty
 *   · Actor/tenant + resource SectionCards; extended-payload metadata dl
 */

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { findAdminAuditEvent, type AdminAuditSeverity } from "@/mocks/admin/audit";
import { cn } from "@/lib/utils/cn";
import {
  Chip,
  Crumbs,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
  Tabs,
  type Tone,
} from "../../_shell/aurora-ui";

type Tab = "overview" | "details";

function severityTone(s: AdminAuditSeverity): Tone {
  switch (s) {
    case "info":
      return "neutral";
    case "warning":
      return "warning";
    case "critical":
      return "error";
  }
}

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditDetailWorkspace() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const e = findAdminAuditEvent(params.eventId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const hasDetails = Boolean(e?.details && Object.keys(e.details).length > 0);
  const activeTab: Tab =
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
        <Crumbs items={[{ label: "Audit log", href: "/admin/audit" }, { label: "Not found" }]} />
        <p className="font-body text-[13px] text-text-secondary">Event not found.</p>
      </div>
    );
  }

  const detailCount = e.details ? Object.keys(e.details).length : 0;
  const tenantLabel = e.tenant || "Glimmora internal";

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <Crumbs items={[{ label: "Audit log", href: "/admin/audit" }, { label: e.id }]} />

      <PageHeader
        eyebrow="Platform · Governance"
        title={<code className="font-mono">{e.action}</code>}
        chips={e.severity !== "info" ? <Chip tone={severityTone(e.severity)}>{e.severity}</Chip> : undefined}
        subtitle={
          <>
            <span className="font-mono text-[11px]">{e.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span suppressHydrationWarning>{fmtTimestamp(e.timestamp)}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {tenantLabel}
          </>
        }
      />

      <GlassCard className="p-5 sm:p-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-4">
          Event snapshot
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Actor" value={<span className="text-[15px]">{e.actor}</span>} size="lg" />
          <Stat label="Resource" value={<span className="text-[15px]">{e.resourceType}</span>} size="lg" />
          <Stat label="Role" value={<span className="text-[15px]">{e.actorRole}</span>} size="lg" />
          <Stat label="IP" value={<span className="text-[15px]">{e.ip ?? "—"}</span>} size="lg" />
        </dl>
      </GlassCard>

      <Tabs
        tabs={[
          { key: "overview", label: "Overview" },
          ...(hasDetails ? [{ key: "details", label: "Details", badge: detailCount }] : []),
        ]}
        active={activeTab}
        onChange={(k) => setTab(k as Tab)}
      />

      {activeTab === "overview" && (
        <div className="space-y-5">
          <SectionCard title="Actor & tenant" description="Who performed this action and in which scope">
            <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <DetailRow label="Tenant" value={tenantLabel} />
              <DetailRow label="Actor" value={e.actor} />
              <DetailRow label="Role" value={e.actorRole} />
              <DetailRow label="IP address" value={e.ip ?? "—"} mono />
            </dl>
          </SectionCard>

          <SectionCard title="Resource" description="Target entity for this audit event">
            <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <DetailRow label="Action" value={e.action} mono />
              <DetailRow label="Type" value={e.resourceType} />
              <DetailRow label="ID" value={e.resourceId} mono />
              <DetailRow label="Label" value={e.resourceLabel} />
            </dl>
          </SectionCard>
        </div>
      )}

      {activeTab === "details" && hasDetails && e.details && (
        <SectionCard title="Extended payload" description="Additional key-value context logged with this event">
          <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(e.details).map(([k, v]) => (
              <DetailRow key={k} label={k} value={v} mono />
            ))}
          </dl>
        </SectionCard>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[13.5px] text-foreground break-words", mono && "font-mono text-[12.5px]")}>
        {value}
      </dd>
    </div>
  );
}
