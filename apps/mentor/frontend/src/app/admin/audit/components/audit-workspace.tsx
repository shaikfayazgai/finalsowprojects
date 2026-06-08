"use client";

/**
 * Cross-tenant audit log workspace — compliance and platform oversight.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, Flag, Search, ShieldAlert, X } from "lucide-react";
import { Select, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import {
  auditFiltersFromSearchParams,
  auditFiltersToSearchParams,
  DEFAULT_AUDIT_FILTERS,
  filterAuditEvents,
  filterAuditEventsForRole,
  listAuditActors,
  listAuditResources,
  type AuditFilterState,
  type AuditTimeWindow,
} from "@/lib/admin/mocks/audit-filters";
import { MOCK_ADMIN_AUDIT_EVENTS, type AdminAuditSeverity, type MockAdminAuditEvent } from "@/mocks/admin/audit";
import { MOCK_TENANTS } from "@/mocks/admin/tenants";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 12;
const AUDIT_FILTER_STORAGE_KEY = "glimmora.admin.auditFilters.v1";

const TIME_TABS: Array<{ key: AuditTimeWindow; label: string }> = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

const SEVERITY_TABS: Array<{ key: AuditFilterState["severity"]; label: string }> = [
  { key: "any", label: "All severities" },
  { key: "info", label: "Info" },
  { key: "warning", label: "Warning" },
  { key: "critical", label: "Critical" },
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

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function sortNewestFirst(items: MockAdminAuditEvent[]): MockAdminAuditEvent[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): T {
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs],
  ) as T;
}

function countBySeverity(events: MockAdminAuditEvent[]) {
  return {
    critical: events.filter((e) => e.severity === "critical").length,
    warning: events.filter((e) => e.severity === "warning").length,
    info: events.filter((e) => e.severity === "info").length,
  };
}

function uniqueTenants(events: MockAdminAuditEvent[]): number {
  return new Set(events.map((e) => e.tenant || "(internal)")).size;
}

export function AuditWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, profile } = useActiveAdmin();
  const canExport = useAdminSectionCanEdit("auditExport");
  const viewOnly = !canExport;

  const scopedEvents = React.useMemo(
    () => filterAuditEventsForRole(role, MOCK_ADMIN_AUDIT_EVENTS),
    [role],
  );

  const actors = React.useMemo(() => listAuditActors(scopedEvents), [scopedEvents]);
  const resources = React.useMemo(() => listAuditResources(scopedEvents), [scopedEvents]);
  const actions = React.useMemo(
    () => Array.from(new Set(scopedEvents.map((e) => e.action))).sort(),
    [scopedEvents],
  );

  const filters = React.useMemo(
    () => auditFiltersFromSearchParams(searchParams, actors),
    [searchParams, actors],
  );

  const page = Number(searchParams.get("page") ?? "1");
  const [searchDraft, setSearchDraft] = React.useState(filters.q);
  const [filtersOpen, setFiltersOpen] = React.useState(
    filters.tenant !== "All" ||
      filters.actor !== "Any" ||
      filters.resource !== "Any" ||
      filters.action !== "Any",
  );
  const [savedToast, setSavedToast] = React.useState(false);
  const restoredRef = React.useRef(false);

  React.useEffect(() => setSearchDraft(filters.q), [filters.q]);

  React.useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if ([...searchParams.keys()].length > 0) return;
    try {
      const raw = localStorage.getItem(AUDIT_FILTER_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as AuditFilterState;
      const qs = auditFiltersToSearchParams(saved).toString();
      if (qs) router.replace(`/admin/audit?${qs}`, { scroll: false });
    } catch {
      /* ignore */
    }
  }, [router, searchParams]);

  const setFilters = React.useCallback(
    (patch: Partial<AuditFilterState>) => {
      const next: AuditFilterState = { ...filters, ...patch };
      const params = auditFiltersToSearchParams(next);
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/admin/audit?${qs}` : "/admin/audit", { scroll: false });
    },
    [filters, router],
  );

  const setPage = React.useCallback(
    (pageNum: number) => {
      const params = auditFiltersToSearchParams(filters);
      if (pageNum > 1) params.set("page", String(pageNum));
      else params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/admin/audit?${qs}` : "/admin/audit", { scroll: false });
    },
    [filters, router],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setFilters({ q: value });
  }, 300);

  const rows = React.useMemo(
    () => sortNewestFirst(filterAuditEvents(filters, scopedEvents)),
    [filters, scopedEvents],
  );

  const severityCounts = React.useMemo(() => countBySeverity(rows), [rows]);
  const tenantCount = React.useMemo(() => uniqueTenants(rows), [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const pageIdx = Math.min(Math.max(1, page), totalPages);
  const pageRows = rows.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const hasAdvancedFilters =
    filters.tenant !== "All" ||
    filters.actor !== "Any" ||
    filters.resource !== "Any" ||
    filters.action !== "Any";

  const activeFilters = React.useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (filters.q.trim()) {
      chips.push({
        key: "q",
        label: `Search: ${filters.q}`,
        clear: () => {
          setSearchDraft("");
          setFilters({ q: "" });
        },
      });
    }
    if (filters.tenant !== "All") {
      chips.push({
        key: "tenant",
        label: `Tenant: ${filters.tenant === "(internal)" ? "Glimmora internal" : filters.tenant}`,
        clear: () => setFilters({ tenant: "All" }),
      });
    }
    if (filters.actor !== "Any") {
      chips.push({
        key: "actor",
        label: `Actor: ${filters.actor}`,
        clear: () => setFilters({ actor: "Any" }),
      });
    }
    if (filters.resource !== "Any") {
      chips.push({
        key: "resource",
        label: `Resource: ${filters.resource}`,
        clear: () => setFilters({ resource: "Any" }),
      });
    }
    if (filters.action !== "Any") {
      chips.push({
        key: "action",
        label: `Action: ${filters.action}`,
        clear: () => setFilters({ action: "Any" }),
      });
    }
    if (filters.severity !== "any") {
      chips.push({
        key: "severity",
        label: `Severity: ${filters.severity}`,
        clear: () => setFilters({ severity: "any" }),
      });
    }
    if (filters.time !== DEFAULT_AUDIT_FILTERS.time) {
      const label = TIME_TABS.find((t) => t.key === filters.time)?.label ?? filters.time;
      chips.push({
        key: "time",
        label: `Window: ${label}`,
        clear: () => setFilters({ time: DEFAULT_AUDIT_FILTERS.time }),
      });
    }
    return chips;
  }, [filters, setFilters]);

  function saveFilters() {
    try {
      localStorage.setItem(AUDIT_FILTER_STORAGE_KEY, JSON.stringify(filters));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch {
      /* ignore */
    }
  }

  function clearAllFilters() {
    setSearchDraft("");
    try {
      localStorage.removeItem(AUDIT_FILTER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    router.replace("/admin/audit", { scroll: false });
  }

  const listDescription =
    rows.length === 0
      ? "No events match"
      : `${rows.length} of ${scopedEvents.length} events · newest first`;

  const roleScoped = scopedEvents.length !== MOCK_ADMIN_AUDIT_EVENTS.length;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {savedToast && (
        <div
          role="status"
          className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text"
        >
          Filter preset saved for this browser.
        </div>
      )}

      {viewOnly && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
            View-only access
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Your role sees a domain-scoped slice of the audit log. Export requires Platform Admin or Compliance.
          </p>
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Compliance
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Audit log
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Cross-tenant activity trail for governance, provisioning, AI prompts, payouts, and platform operations.
            {roleScoped && (
              <span className="text-text-secondary"> Scoped to your role as {profile.title}.</span>
            )}
          </p>
          <RecordLinks />
        </div>
        {canExport && (
          <Link href="/admin/audit/export" className={actionBtnCls}>
            <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Export
          </Link>
        )}
      </header>

      {severityCounts.critical > 0 && filters.severity !== "critical" && (
        <ContextBanner title={`${severityCounts.critical} critical event${severityCounts.critical === 1 ? "" : "s"} in view`}>
          <button
            type="button"
            onClick={() => setFilters({ severity: "critical" })}
            className="font-semibold text-error-text underline underline-offset-2 hover:opacity-80"
          >
            Show critical only
          </button>
        </ContextBanner>
      )}

      <DashboardSection title="Activity snapshot" description="Counts for the current filter window">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Events" value={String(rows.length)} highlight={rows.length > 0} />
          <SummaryStat
            label="Critical"
            value={String(severityCounts.critical)}
            alert={severityCounts.critical > 0}
          />
          <SummaryStat
            label="Warnings"
            value={String(severityCounts.warning)}
            highlight={severityCounts.warning > 0}
          />
          <SummaryStat label="Tenants touched" value={String(tenantCount)} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1 basis-[200px]">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Event stream
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
            </div>

            <div className="relative w-full sm:w-56 order-last sm:order-none sm:ml-auto">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => {
                  setSearchDraft(e.target.value);
                  debouncedSetSearch(e.target.value);
                }}
                placeholder="Actor, action, resource…"
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                )}
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    setFilters({ q: "" });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Time window" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {TIME_TABS.map((tab) => {
              const active = filters.time === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilters({ time: tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-text-secondary",
                  )}
                >
                  {tab.label}
                  {active && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          <nav
            aria-label="Filter by severity"
            className="flex flex-wrap gap-x-1 -mb-px pb-3 border-t border-stroke-subtle pt-3"
          >
            {SEVERITY_TABS.map((tab) => {
              const active = filters.severity === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilters({ severity: tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2",
                    "font-body text-[12.5px] font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-text-secondary",
                  )}
                >
                  {tab.label}
                  {active && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-t border-stroke-subtle pt-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", filtersOpen && "rotate-180")}
                strokeWidth={2}
                aria-hidden
              />
              Advanced filters
              {hasAdvancedFilters && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-brand-subtle text-brand-subtle-text">
                  on
                </span>
              )}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={saveFilters} className={secondaryBtnCls}>
                Save preset
              </button>
              {(activeFilters.length > 0 || hasAdvancedFilters) && (
                <button type="button" onClick={clearAllFilters} className={secondaryBtnCls}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-4 border-t border-stroke-subtle pt-4">
              <FilterSelect
                label="Tenant"
                value={filters.tenant}
                onChange={(v) => setFilters({ tenant: v })}
                options={[
                  { value: "All", label: "All tenants" },
                  { value: "(internal)", label: "Glimmora internal" },
                  ...MOCK_TENANTS.map((t) => ({ value: t.name, label: t.name })),
                ]}
              />
              <FilterSelect
                label="Actor"
                value={filters.actor}
                onChange={(v) => setFilters({ actor: v })}
                options={[
                  { value: "Any", label: "Any actor" },
                  ...actors.map((a) => ({ value: a, label: a })),
                ]}
              />
              <FilterSelect
                label="Resource"
                value={filters.resource}
                onChange={(v) => setFilters({ resource: v })}
                options={[
                  { value: "Any", label: "Any resource" },
                  ...resources.map((r) => ({ value: r, label: r })),
                ]}
              />
              <FilterSelect
                label="Action"
                value={filters.action}
                onChange={(v) => setFilters({ action: v })}
                options={[
                  { value: "Any", label: "Any action" },
                  ...actions.map((a) => ({ value: a, label: a })),
                ]}
              />
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-3 border-t border-stroke-subtle pt-3">
              <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Active
              </span>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-stroke-subtle bg-bg-subtle/50 font-body text-[11.5px] text-text-secondary hover:bg-bg-subtle transition-colors"
                >
                  {f.label}
                  <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                </button>
              ))}
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyPanel onClear={clearAllFilters} />
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((e) => (
                <AuditRow key={e.id} item={e} />
              ))}
            </ul>
            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
              <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(pageIdx * ROWS_PER_PAGE, rows.length)} of {rows.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageIdx === 1}
                  onClick={() => setPage(pageIdx - 1)}
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
                  onClick={() => setPage(pageIdx + 1)}
                  className="font-body text-[12px] font-semibold text-text-link disabled:text-text-disabled"
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function AuditRow({ item: e }: { item: MockAdminAuditEvent }) {
  const isCritical = e.severity === "critical";
  const tenantLabel = e.tenant || "Glimmora internal";

  return (
    <li>
      <Link
        href={`/admin/audit/${e.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
          isCritical && "bg-error-subtle/10 hover:bg-error-subtle/20",
          e.severity === "warning" && !isCritical && "bg-warning-subtle/5",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[11.5px] font-semibold text-text-tertiary tabular-nums shrink-0">
              {e.id}
            </span>
            <StatusChip status={severityChip(e.severity)} size="sm" showDot={e.severity !== "info"}>
              {e.severity}
            </StatusChip>
            <code className="font-mono text-[11.5px] text-foreground truncate">{e.action}</code>
          </span>
          <span className="font-body text-[13px] font-medium text-foreground truncate block mt-0.5">
            {e.resourceLabel}
          </span>
          <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
            {e.actor} · {e.actorRole}
            <span aria-hidden className="opacity-50 mx-1">·</span>
            {tenantLabel}
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-1">
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
            {fmtTimestamp(e.timestamp)}
          </span>
          <span className="font-body text-[10.5px] text-text-disabled whitespace-nowrap">
            {fmtRelative(e.timestamp)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      <Select variant="outline" size="sm" value={value} onChange={(ev) => onChange(ev.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
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

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-error-border/40 bg-error-subtle/20 px-4 py-3">
      <p className="font-body text-[12px] font-semibold text-error-text flex items-center gap-1.5">
        <Flag className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">{children}</p>
    </div>
  );
}

function EmptyPanel({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-body text-[13px] text-text-secondary">No audit events match your filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 font-body text-[12.5px] font-semibold text-brand hover:opacity-80"
      >
        Clear filters
      </button>
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
        Cases
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/admin/kyc"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        KYC reviews
      </Link>
    </p>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const secondaryBtnCls = cn(
  "inline-flex items-center h-8 px-3 rounded-md",
  "bg-surface border border-stroke-subtle",
  "font-body text-[12.5px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);
