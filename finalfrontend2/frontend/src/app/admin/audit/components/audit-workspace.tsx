"use client";

/**
 * Cross-tenant audit log — forensic event stream.
 *
 * Workflow:
 *   1. Filter by time window, severity, and optional advanced scope
 *   2. Scan the event list (newest first)
 *   3. Open event detail in modal · export slice via modal
 *
 * Data source: GET /api/audit/export?format=json (real backend via Prisma/MongoDB).
 * Mapped from AuditViewEvent → MockAdminAuditEvent via audit-mapper.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, Loader2, ScrollText, Search, X } from "lucide-react";
import { AuditEventDetailModal } from "@/app/admin/audit/components/audit-event-detail-modal";
import { AuditExportModal } from "@/app/admin/audit/components/audit-export-modal";
import { AuditEventsProvider } from "@/app/admin/audit/components/audit-events-context";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
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
import { fetchAuditEvents, AuditViewApiError } from "@/lib/api/audit-view";
import { mapAuditViewEventToMock } from "@/lib/api/audit-mapper";
import type { AdminAuditSeverity, MockAdminAuditEvent } from "@/mocks/admin/audit";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryStyle } from "../../_shell/aurora-ui";

const BTN_EXPORT = cn(
  "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg shrink-0",
  "font-body text-[13px] font-semibold text-on-brand hover:opacity-90 transition-opacity",
);

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
  { key: "any", label: "All" },
  { key: "info", label: "Info" },
  { key: "warning", label: "Warning" },
  { key: "critical", label: "Critical" },
];

type ActionTone = "success" | "info" | "warning" | "neutral" | "ai";

const ACTION_TEXT: Record<ActionTone, string> = {
  success: "var(--color-success-text)",
  info: "var(--color-info-text)",
  warning: "var(--color-warning-text)",
  neutral: "var(--color-text-secondary)",
  ai: "var(--color-ai-text)",
};

function severityChipClass(s: AdminAuditSeverity): string {
  switch (s) {
    case "warning":
      return "text-warning-text bg-warning-subtle";
    case "critical":
      return "text-error-text bg-error-subtle";
    default:
      return "text-text-secondary bg-bg-subtle";
  }
}

function actionTone(action: string): ActionTone {
  const a = action.toLowerCase();
  if (/(^|\.)(ai|prompt|auto)/.test(a)) return "ai";
  if (/(add|create|provision|invite|release|approve|accept|submit|grant)/.test(a)) return "success";
  if (/(update|edit|change|rollback|ratecard)/.test(a)) return "info";
  if (/(delete|remove|suspend|reject|revoke|disable|block)/.test(a)) return "warning";
  return "neutral";
}

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function sortNewestFirst(items: MockAdminAuditEvent[]): MockAdminAuditEvent[] {
  return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delayMs: number): T {
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

/** Derive unique tenant display values from fetched events for the dropdown. */
function listTenants(events: MockAdminAuditEvent[]): Array<{ value: string; label: string }> {
  const seen = new Map<string, string>();
  for (const e of events) {
    const key = e.tenant ?? "";
    if (!seen.has(key) && key !== "") {
      seen.set(key, e.tenant ?? key);
    }
  }
  return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
}

export function AuditWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, profile } = useActiveAdmin();
  const canExport = useAdminSectionCanEdit("auditExport");

  // ── Real data fetch ──────────────────────────────────────────────
  const [allEvents, setAllEvents] = React.useState<MockAdminAuditEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const doFetch = React.useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await fetchAuditEvents({ limit: 500 });
      const mapped = result.events.map(mapAuditViewEventToMock);
      setAllEvents(mapped);
    } catch (err) {
      const msg =
        err instanceof AuditViewApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load audit events";
      setFetchError(msg);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void doFetch();
  }, [doFetch]);

  // ── Role scoping (client-side, mirrors backend auth but narrows display) ──
  const scopedEvents = React.useMemo(
    () => filterAuditEventsForRole(role, allEvents),
    [role, allEvents],
  );

  const actors = React.useMemo(() => listAuditActors(scopedEvents), [scopedEvents]);
  const resources = React.useMemo(() => listAuditResources(scopedEvents), [scopedEvents]);
  const actions = React.useMemo(
    () => Array.from(new Set(scopedEvents.map((e) => e.action))).sort(),
    [scopedEvents],
  );
  const tenants = React.useMemo(() => listTenants(scopedEvents), [scopedEvents]);

  const filters = React.useMemo(
    () => auditFiltersFromSearchParams(searchParams, actors),
    [searchParams, actors],
  );

  const page = Number(searchParams.get("page") ?? "1");
  const eventId = searchParams.get("event");
  const exportOpen = searchParams.get("export") === "1";

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

  const setModalParam = React.useCallback(
    (key: "event" | "export", value: string | null) => {
      const params = auditFiltersToSearchParams(filters);
      if (page > 1) params.set("page", String(page));
      if (value) params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      router.replace(qs ? `/admin/audit?${qs}` : "/admin/audit", { scroll: false });
    },
    [filters, page, router],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setFilters({ q: value });
  }, 300);

  const rows = React.useMemo(
    () => sortNewestFirst(filterAuditEvents(filters, scopedEvents)),
    [filters, scopedEvents],
  );

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
      chips.push({ key: "actor", label: `Actor: ${filters.actor}`, clear: () => setFilters({ actor: "Any" }) });
    }
    if (filters.resource !== "Any") {
      chips.push({
        key: "resource",
        label: `Resource: ${filters.resource}`,
        clear: () => setFilters({ resource: "Any" }),
      });
    }
    if (filters.action !== "Any") {
      chips.push({ key: "action", label: `Action: ${filters.action}`, clear: () => setFilters({ action: "Any" }) });
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

  const roleScoped = scopedEvents.length !== allEvents.length;
  const criticalCount = rows.filter((e) => e.severity === "critical").length;

  return (
    <AuditEventsProvider
      events={allEvents}
      isLoading={isLoading}
      error={fetchError}
      refetch={doFetch}
    >
      <div className="space-y-5 pb-4 animate-fade-in">
        {savedToast ? (
          <div
            role="status"
            className="rounded-lg border border-success-border bg-success-subtle/60 px-4 py-2.5 font-body text-[13px] font-medium text-success-text"
          >
            Filter preset saved for this browser.
          </div>
        ) : null}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
              Audit log
            </h1>
            <p className="mt-1.5 font-body text-[14px] text-text-secondary">
              Cross-tenant activity trail for governance, provisioning, AI prompts, payouts, and platform operations.
              {roleScoped ? (
                <>
                  {" "}
                  <span className="font-medium text-foreground">Scoped to {profile.title}.</span>
                </>
              ) : null}
            </p>
            <RecordLinks />
          </div>
          {canExport ? (
            <button type="button" onClick={() => setModalParam("export", "1")} className={BTN_EXPORT} style={primaryStyle}>
              <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
              Export
            </button>
          ) : null}
        </header>

        {!canExport ? (
          <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3">
            <p className="font-body text-[13px] text-text-secondary">
              <span className="font-semibold text-foreground">View-only access.</span> Your role sees a domain-scoped
              slice. Export requires Platform Admin or Compliance.
            </p>
          </div>
        ) : null}

        {fetchError ? (
          <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3 flex items-center justify-between gap-3">
            <p className="font-body text-[13px] text-text-secondary">
              <span className="font-semibold text-foreground">Error loading events:</span> {fetchError}
            </p>
            <button
              type="button"
              onClick={doFetch}
              className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0"
            >
              Retry
            </button>
          </div>
        ) : null}

        {criticalCount > 0 && filters.severity !== "critical" ? (
          <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-body text-[13px] text-text-secondary">
              <span className="font-semibold text-foreground">{criticalCount} critical event{criticalCount === 1 ? "" : "s"}</span>{" "}
              in the current view.
            </p>
            <button
              type="button"
              onClick={() => setFilters({ severity: "critical" })}
              className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
            >
              Show critical only
            </button>
          </div>
        ) : null}

        <div className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
            <PillTabs
              ariaLabel="Time window"
              tabs={TIME_TABS}
              active={filters.time}
              onChange={(key) => setFilters({ time: key })}
            />
            <PillTabs
              ariaLabel="Filter by severity"
              tabs={SEVERITY_TABS}
              active={filters.severity}
              onChange={(key) => setFilters({ severity: key })}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors w-fit"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} strokeWidth={2} aria-hidden />
                Advanced filters
                {hasAdvancedFilters ? (
                  <span className="inline-flex h-5 items-center px-1.5 rounded-md bg-info-subtle font-mono text-[10px] font-semibold text-info-text">
                    on
                  </span>
                ) : null}
              </button>

              <div className="relative w-full sm:w-60 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(e) => {
                    setSearchDraft(e.target.value);
                    debouncedSetSearch(e.target.value);
                  }}
                  placeholder="Actor, action, resource…"
                  className={cn(
                    "w-full h-9 pl-9 pr-8 rounded-lg border border-stroke-subtle bg-surface",
                    "font-body text-[13px] text-foreground placeholder:text-text-disabled",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                  )}
                />
                {searchDraft ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDraft("");
                      setFilters({ q: "" });
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            </div>

            {filtersOpen ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <FilterSelect
                  label="Tenant"
                  value={filters.tenant}
                  onChange={(v) => setFilters({ tenant: v })}
                  options={[
                    { value: "All", label: "All tenants" },
                    { value: "(internal)", label: "Glimmora internal" },
                    ...tenants,
                  ]}
                />
                <FilterSelect
                  label="Actor"
                  value={filters.actor}
                  onChange={(v) => setFilters({ actor: v })}
                  options={[{ value: "Any", label: "Any actor" }, ...actors.map((a) => ({ value: a, label: a }))]}
                />
                <FilterSelect
                  label="Resource"
                  value={filters.resource}
                  onChange={(v) => setFilters({ resource: v })}
                  options={[{ value: "Any", label: "Any resource" }, ...resources.map((r) => ({ value: r, label: r }))]}
                />
                <FilterSelect
                  label="Action"
                  value={filters.action}
                  onChange={(v) => setFilters({ action: v })}
                  options={[{ value: "Any", label: "Any action" }, ...actions.map((a) => ({ value: a, label: a }))]}
                />
              </div>
            ) : null}

            {(activeFilters.length > 0 || hasAdvancedFilters) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Active</span>
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={f.clear}
                    className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-full border border-stroke-subtle bg-bg-subtle font-body text-[11.5px] font-medium text-text-secondary hover:bg-surface transition-colors"
                  >
                    {f.label}
                    <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                  </button>
                ))}
                <button type="button" onClick={saveFilters} className="font-body text-[12px] font-semibold text-text-link hover:underline underline-offset-2">
                  Save preset
                </button>
                <button type="button" onClick={clearAllFilters} className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" strokeWidth={2} aria-hidden />
              <span className="font-body text-[13px] text-text-secondary">Loading audit events…</span>
            </div>
          ) : rows.length > 0 ? (
            <div className="px-4 sm:px-5 py-3 bg-bg-subtle/50 border-b border-stroke-subtle">
              <p className="font-body text-[13px] text-text-secondary">
                <span className="font-semibold text-foreground">{rows.length}</span> event{rows.length === 1 ? "" : "s"}
                {rows.length !== scopedEvents.length ? ` of ${scopedEvents.length}` : ""} · newest first
              </p>
            </div>
          ) : null}

          {!isLoading && rows.length === 0 ? (
            <TenantEmptyState
              icon={ScrollText}
              title="No events found"
              description={fetchError ? "Could not load events. Check your connection and retry." : "No audit events match your filters."}
              action={
                fetchError ? (
                  <button type="button" onClick={doFetch} className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2">
                    Retry
                  </button>
                ) : (
                  <button type="button" onClick={clearAllFilters} className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2">
                    Clear filters
                  </button>
                )
              }
            />
          ) : !isLoading ? (
            <>
              <ul className="divide-y divide-stroke-subtle">
                {pageRows.map((e) => (
                  <AuditRow key={e.id} item={e} onOpen={() => setModalParam("event", e.id)} />
                ))}
              </ul>
              {totalPages > 1 ? (
                <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                  <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                    {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, rows.length)} of {rows.length}
                  </p>
                  <div className="flex items-center gap-3">
                    <button type="button" disabled={pageIdx === 1} onClick={() => setPage(pageIdx - 1)} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled">
                      Previous
                    </button>
                    <span className="font-mono text-[11px] text-text-tertiary">{pageIdx}/{totalPages}</span>
                    <button type="button" disabled={pageIdx >= totalPages} onClick={() => setPage(pageIdx + 1)} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled">
                      Next
                    </button>
                  </div>
                </footer>
              ) : null}
            </>
          ) : null}
        </div>

        <AuditEventDetailModal
          eventId={eventId}
          open={Boolean(eventId)}
          onClose={() => setModalParam("event", null)}
        />

        {canExport ? (
          <AuditExportModal open={exportOpen} onClose={() => setModalParam("export", null)} />
        ) : null}
      </div>
    </AuditEventsProvider>
  );
}

function PillTabs<K extends string>({
  ariaLabel,
  tabs,
  active,
  onChange,
}: {
  ariaLabel: string;
  tabs: Array<{ key: K; label: string }>;
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center h-8 px-3 rounded-lg font-body text-[13px] font-medium transition-colors",
              isActive ? "admin-tab-on" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function AuditRow({ item: e, onOpen }: { item: MockAdminAuditEvent; onOpen: () => void }) {
  const tenantLabel = e.tenant || "Glimmora internal";
  const aTone = actionTone(e.action);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 min-h-[56px] text-left hover:bg-bg-subtle/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[11px] font-medium text-text-tertiary tabular-nums shrink-0">{e.id}</span>
            <code className="font-mono text-[11.5px] font-semibold truncate" style={{ color: ACTION_TEXT[aTone] }}>
              {e.action}
            </code>
            {e.severity !== "info" ? (
              <span className={cn("inline-flex h-[20px] items-center px-2 rounded-full font-body text-[10px] font-medium capitalize", severityChipClass(e.severity))}>
                {e.severity}
              </span>
            ) : null}
          </span>
          <span className="font-body text-[13px] font-medium text-foreground truncate block mt-0.5">{e.resourceLabel}</span>
          <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
            {e.actor} · {e.actorRole}
            <span aria-hidden className="opacity-50 mx-1">·</span>
            {tenantLabel}
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-0.5">
          <span suppressHydrationWarning className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
            {fmtTimestamp(e.timestamp)}
          </span>
          <span suppressHydrationWarning className="font-body text-[10.5px] text-text-disabled whitespace-nowrap">
            {fmtRelative(e.timestamp)}
          </span>
        </span>
      </button>
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
      <span className="block font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          className={cn(
            "w-full h-9 pl-3 pr-10 rounded-lg border border-stroke-subtle bg-surface appearance-none cursor-pointer",
            "font-body text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
}

function RecordLinks() {
  return (
    <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link href="/admin/governance" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        Cases
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/admin/kyc" className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline">
        KYC reviews
      </Link>
    </span>
  );
}
