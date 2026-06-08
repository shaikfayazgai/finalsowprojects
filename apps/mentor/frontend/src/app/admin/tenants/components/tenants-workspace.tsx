"use client";

/**
 * Tenant registry — aligned with governance cases + enterprise SOW list UX.
 *
 *   · Header + DashboardSection summary (no duplicate KPI band inside the list)
 *   · One panel: underline status tabs + search
 *   · Grouped preview on All; flat paginated list when filtered
 *   · Scannable rows: name + meta (domain · tier · users · setup %)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Building2, Plus, Search, X } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MOCK_PROVISIONING_STEPS,
  type MockTenant,
  type TenantStatus,
} from "@/mocks/admin/tenants";
import { mergeTenantLists, resolveProvisioningSteps } from "@/lib/admin/tenant-registry";
import { useAdminProvisioningHydrated } from "@/lib/hooks/use-admin-provisioning-hydrated";
import { useAdminProvisioningStore, type ProvisionedTenantRecord } from "@/lib/stores/admin-provisioning-store";
import { cn } from "@/lib/utils/cn";
import { TenantsSkeleton } from "./tenants-skeleton";

type Filter = "all" | "active" | "provisioning" | "paused";

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: "Active",
  provisioning: "Provisioning",
  paused: "Paused",
  draft: "Draft",
  closed: "Closed",
};

const FILTER_TABS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "provisioning", label: "Provisioning" },
  { key: "paused", label: "Paused" },
];

const GROUP_ORDER: TenantStatus[] = ["provisioning", "active", "paused", "draft", "closed"];
const PREVIEW_PER_GROUP = 5;
const ROWS_PER_PAGE = 10;

function provisioningPct(tenantId: string, dynamic: ProvisionedTenantRecord[]): number | null {
  const steps = resolveProvisioningSteps(tenantId, dynamic);
  if (steps.length === 0) {
    const mock = MOCK_PROVISIONING_STEPS[tenantId];
    if (!mock?.length) return null;
    const done = mock.filter((s) => s.state === "done").length;
    return Math.round((done / mock.length) * 100);
  }
  const done = steps.filter((s) => s.state === "done").length;
  return Math.round((done / steps.length) * 100);
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function sortTenants(items: MockTenant[]): MockTenant[] {
  return [...items].sort((a, b) => {
    const rank = (s: TenantStatus) => {
      if (s === "provisioning") return 0;
      if (s === "paused") return 1;
      if (s === "active") return 2;
      return 3;
    };
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return a.name.localeCompare(b.name);
  });
}

function groupTenants(items: MockTenant[]) {
  const buckets = new Map<TenantStatus, MockTenant[]>();
  for (const s of GROUP_ORDER) buckets.set(s, []);
  for (const t of sortTenants(items)) buckets.get(t.status)?.push(t);
  return GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    rows: buckets.get(status) ?? [],
  })).filter((g) => g.rows.length > 0);
}

function rowMeta(t: MockTenant, pct: number | null): string {
  const region = t.region.split(" · ")[0];
  if (t.status === "provisioning") {
    const parts = [t.domain, t.tier];
    if (pct != null) parts.push(`${pct}% setup`);
    parts.push(`Started ${daysSince(t.provisionedAt)}d ago`);
    return parts.join(" · ");
  }
  if (t.status === "paused") {
    return [t.domain, t.tier, `${t.users} users`, region].join(" · ");
  }
  return [t.domain, t.tier, `${t.users} users`, `${t.sows} SOWs`, region].join(" · ");
}

export function TenantsWorkspace() {
  const hydrated = useAdminProvisioningHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dynamicTenants = useAdminProvisioningStore((s) => s.tenants);
  const tenantOverrides = useAdminProvisioningStore((s) => s.tenantOverrides);

  const filter: Filter =
    (searchParams.get("status") as Filter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const allTenants = React.useMemo(
    () => mergeTenantLists(dynamicTenants, tenantOverrides),
    [dynamicTenants, tenantOverrides],
  );

  const counts = React.useMemo(
    () => ({
      all: allTenants.length,
      active: allTenants.filter((t) => t.status === "active").length,
      provisioning: allTenants.filter((t) => t.status === "provisioning").length,
      paused: allTenants.filter((t) => t.status === "paused").length,
    }),
    [allTenants],
  );

  const provisioningTenants = React.useMemo(
    () =>
      [...allTenants]
        .filter((t) => t.status === "provisioning")
        .sort((a, b) => new Date(a.provisionedAt).getTime() - new Date(b.provisionedAt).getTime()),
    [allTenants],
  );

  const hero = provisioningTenants[0] ?? null;

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allTenants.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (needle) {
        const hay = [t.name, t.domain, t.msaRef, t.id, t.tier, t.region].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [allTenants, filter, search]);

  const sorted = React.useMemo(() => sortTenants(filtered), [filtered]);
  const showGrouped = filter === "all" && !search.trim();
  const groups = showGrouped ? groupTenants(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = showGrouped
    ? sorted
    : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/tenants?${qs}` : "/admin/tenants", { scroll: false });
    },
    [router, searchParams],
  );

  const listTitle = filter === "all" ? "Tenant registry" : STATUS_LABEL[filter as TenantStatus] ?? filter;
  const listDescription =
    sorted.length === 0
      ? "No tenants match"
      : showGrouped
        ? `${sorted.length} tenant${sorted.length === 1 ? "" : "s"} · grouped by status`
        : `${sorted.length} tenant${sorted.length === 1 ? "" : "s"}`;

  const heroPct = hero ? provisioningPct(hero.id, dynamicTenants) : null;

  if (!hydrated) return <TenantsSkeleton />;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Tenants
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Tenant registry
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Provision enterprises, track onboarding progress, and manage lifecycle state across the platform.
          </p>
        </div>
        <Link
          href="/admin/tenants/new"
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
            "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
            "hover:bg-brand-hover transition-colors duration-fast",
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          New tenant
        </Link>
      </header>

      {hero && filter !== "paused" && (
        <ContextBanner
          title={`${counts.provisioning} tenant${counts.provisioning === 1 ? "" : "s"} provisioning`}
        >
          <span className="font-medium text-foreground">{hero.name}</span>
          {" · "}
          {heroPct != null ? `${heroPct}% complete · ` : ""}
          started {daysSince(hero.provisionedAt)}d ago.
          {" "}
          <Link
            href={`/admin/tenants/${hero.id}/provisioning`}
            className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
          >
            Continue setup
          </Link>
          {counts.provisioning > 1 && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => setParam({ status: "provisioning" })}
                className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
              >
                View all provisioning
              </button>
            </>
          )}
        </ContextBanner>
      )}

      <DashboardSection title="Registry summary" description="Lifecycle counts across the platform">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="All tenants" value={String(counts.all)} />
          <SummaryStat label="Active" value={String(counts.active)} highlight={counts.active > 0} />
          <SummaryStat
            label="Provisioning"
            value={String(counts.provisioning)}
            alert={counts.provisioning > 0}
          />
          <SummaryStat label="Paused" value={String(counts.paused)} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {listTitle}
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
            </div>
            <div className="relative w-full sm:w-56 shrink-0">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search name, domain, MSA…"
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                )}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setParam({ q: null })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ status: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                    active ? "text-foreground" : "text-text-secondary",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active
                        ? "bg-brand-subtle text-brand-subtle-text"
                        : "text-text-tertiary",
                      tab.key === "provisioning" && count > 0 && !active && "text-warning-text font-semibold",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel
            hasQuery={Boolean(search.trim())}
            onClear={() => setParam({ status: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <TenantGroup
                key={group.status}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/admin/tenants?status=${group.status}`}
                dynamicTenants={dynamicTenants}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((t) => (
                <TenantRow key={t.id} tenant={t} dynamicTenants={dynamicTenants} />
              ))}
            </ul>
            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[12px] font-semibold text-text-link disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {pageIdx}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12px] font-semibold text-text-link disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function TenantGroup({
  label,
  rows,
  previewLimit,
  filterHref,
  dynamicTenants,
}: {
  label: string;
  rows: MockTenant[];
  previewLimit: number;
  filterHref: string;
  dynamicTenants: ProvisionedTenantRecord[];
}) {
  const preview = rows.slice(0, previewLimit);
  const overflow = rows.length - preview.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-2.5">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          {label}
          <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
            {rows.length}
          </span>
        </p>
        <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
          View all
        </Link>
      </div>
      <ul role="list">
        {preview.map((t) => (
          <li key={t.id} className="border-t border-stroke-subtle">
            <TenantRow tenant={t} dynamicTenants={dynamicTenants} bare />
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <div className="px-5 py-2 border-t border-stroke-subtle">
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
            + {overflow} more
          </Link>
        </div>
      )}
    </div>
  );
}

function TenantRow({
  tenant: t,
  dynamicTenants,
  bare,
}: {
  tenant: MockTenant;
  dynamicTenants: ProvisionedTenantRecord[];
  bare?: boolean;
}) {
  const pct = t.status === "provisioning" ? provisioningPct(t.id, dynamicTenants) : null;
  const meta = rowMeta(t, pct);
  const isProvisioning = t.status === "provisioning";
  const isPaused = t.status === "paused";

  return (
    <Link
      href={`/admin/tenants/${t.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
        "hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        isProvisioning && "bg-brand-subtle/10 hover:bg-brand-subtle/20",
        isPaused && "opacity-80",
        bare && "min-h-[44px] py-2.5",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-body text-[13px] font-medium text-foreground truncate">{t.name}</span>
          <TierBadge tier={t.tier} />
        </span>
        <span className="font-mono text-[11px] text-text-tertiary block mt-0.5 truncate">{t.msaRef}</span>
        <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">{meta}</span>
        {pct != null && isProvisioning && (
          <div className="mt-2 max-w-xs">
            <ProvisioningBar pct={pct} compact />
          </div>
        )}
      </span>
      <span className="shrink-0 text-right flex flex-col items-end gap-1">
        <TenantStatusBadge status={t.status} />
        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
          {t.region.split(" · ")[0]}
        </span>
      </span>
    </Link>
  );
}

function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const map: Record<TenantStatus, "success" | "pending" | "warning" | "neutral"> = {
    active: "success",
    provisioning: "pending",
    paused: "warning",
    draft: "neutral",
    closed: "neutral",
  };
  return (
    <StatusChip status={map[status]} size="sm" showDot>
      {STATUS_LABEL[status]}
    </StatusChip>
  );
}

function TierBadge({ tier }: { tier: MockTenant["tier"] }) {
  const tone: Record<MockTenant["tier"], string> = {
    Enterprise: "bg-brand-subtle text-brand-emphasis",
    Growth: "bg-info-subtle text-info-text",
    Pilot: "bg-bg-subtle text-text-secondary",
    Trial: "bg-warning-subtle text-warning-text",
  };
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5 font-body text-[10px] font-semibold shrink-0",
        tone[tier],
      )}
    >
      {tier}
    </span>
  );
}

function ProvisioningBar({ pct, compact }: { pct: number; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", !compact && "mt-1")}>
      <div className="flex-1 h-1.5 rounded-full bg-bg-subtle overflow-hidden min-w-[80px]">
        <div
          className="h-full rounded-full bg-brand transition-all duration-fast"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">{pct}%</span>
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
          alert ? "text-error-text" : highlight ? "text-brand" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand/25 bg-brand-subtle/20 px-4 py-3">
      <p className="font-body text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function EmptyPanel({ hasQuery, onClear }: { hasQuery: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <Building2 className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">No tenants found</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {hasQuery
          ? "Try a different search term or remove filters."
          : "Create a tenant to provision a new enterprise on the platform."}
      </p>
      {hasQuery ? (
        <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-brand">
          Clear all filters
        </button>
      ) : (
        <Link
          href="/admin/tenants/new"
          className="mt-3 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          New tenant
        </Link>
      )}
    </div>
  );
}
