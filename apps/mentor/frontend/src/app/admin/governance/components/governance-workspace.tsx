"use client";

/**
 * Governance cases workspace — T&S triage queue for complaints, disputes,
 * safety reports, and mentor escalations.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Flag, Search, X } from "lucide-react";
import { Select, StatusChip } from "@/components/meridian";
import {
  type GovCaseStatus,
  type GovCaseType,
  type GovSeverity,
  type GovSource,
  type MockGovCase,
} from "@/mocks/admin/governance";
import { useAdminGovCasesList, useGovSummary } from "@/lib/hooks/use-admin-governance";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { DashboardSection } from "@/components/meridian/dashboard";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 10;

type QueueFilter = "my_open" | "unassigned" | "all_open" | "closed";
type TypeFilter = "all" | GovCaseType;
type SeverityFilter = "all" | GovSeverity;
type SourceFilter = "all" | GovSource;

const QUEUE_TABS: Array<{ key: QueueFilter; label: string }> = [
  { key: "my_open", label: "My open" },
  { key: "unassigned", label: "Unassigned" },
  { key: "all_open", label: "All open" },
  { key: "closed", label: "Closed" },
];

const TYPE_TABS: Array<{ key: TypeFilter; label: string }> = [
  { key: "all", label: "All types" },
  { key: "safety_report", label: "Safety" },
  { key: "dispute", label: "Disputes" },
  { key: "grievance", label: "Grievances" },
  { key: "mentor_escalation", label: "Escalations" },
];

const TYPE_LABEL: Record<GovCaseType, string> = {
  safety_report: "Safety report",
  dispute: "Dispute",
  mentor_escalation: "Mentor escalation",
  grievance: "Grievance",
};

const STATUS_LABEL: Record<GovCaseStatus, string> = {
  open: "Open",
  in_review: "In review",
  pending_legal: "Pending legal",
  resolved_action: "Resolved (action)",
  resolved_no_action: "Resolved",
  escalated: "Escalated",
};

const SOURCE_LABEL: Record<GovSource, string> = {
  contributor: "Contributor",
  mentor: "Mentor portal",
  enterprise: "Enterprise",
  internal: "Internal",
};

const OPEN_STATUSES: GovCaseStatus[] = ["open", "in_review", "pending_legal"];
const CLOSED_STATUSES: GovCaseStatus[] = ["resolved_action", "resolved_no_action", "escalated"];

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

function sortNewestFirst(items: MockGovCase[]): MockGovCase[] {
  return [...items].sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
  );
}

function severityChip(s: GovSeverity): "error" | "warning" | "info" {
  if (s === "high") return "error";
  if (s === "medium") return "warning";
  return "info";
}

function statusChip(s: GovCaseStatus): "success" | "warning" | "error" | "pending" | "neutral" | "info" {
  switch (s) {
    case "open":
      return "warning";
    case "in_review":
    case "pending_legal":
      return "pending";
    case "resolved_action":
      return "success";
    case "resolved_no_action":
      return "neutral";
    case "escalated":
      return "error";
  }
}

function filterByQueue(cases: MockGovCase[], queue: QueueFilter, operator: string): MockGovCase[] {
  switch (queue) {
    case "my_open":
      return cases.filter(
        (c) => c.assignedTo === operator && OPEN_STATUSES.includes(c.status),
      );
    case "unassigned":
      return cases.filter((c) => !c.assignedTo && OPEN_STATUSES.includes(c.status));
    case "all_open":
      return cases.filter((c) => OPEN_STATUSES.includes(c.status));
    case "closed":
      return cases.filter((c) => CLOSED_STATUSES.includes(c.status));
  }
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

export function GovernanceWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useActiveAdmin();
  const canEdit = useAdminSectionCanEdit("governance");
  const operator = profile.displayName;
  const allCases = useAdminGovCasesList();
  const summary = useGovSummary(operator);

  const queueFilter = (searchParams.get("queue") as QueueFilter | null) ?? "my_open";
  const typeFilter = (searchParams.get("type") as TypeFilter | null) ?? "all";
  const severityFilter = (searchParams.get("severity") as SeverityFilter | null) ?? "all";
  const sourceFilter = (searchParams.get("source") as SourceFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  const [filtersOpen, setFiltersOpen] = React.useState(
    severityFilter !== "all" || sourceFilter !== "all",
  );
  const [toast, setToast] = React.useState<string | null>(
    searchParams.get("closed") === "1" ? "Case closed." : null,
  );

  React.useEffect(() => setSearchDraft(search), [search]);

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/governance?${qs}` : "/admin/governance", { scroll: false });
    },
    [router, searchParams],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setParam({ q: value.trim() || null });
  }, 300);

  const baseCases = React.useMemo(
    () => sortNewestFirst(filterByQueue(allCases, queueFilter, operator)),
    [allCases, queueFilter, operator],
  );

  const typeCounts = React.useMemo(() => {
    const c: Record<TypeFilter, number> = {
      all: baseCases.length,
      safety_report: 0,
      dispute: 0,
      mentor_escalation: 0,
      grievance: 0,
    };
    for (const item of baseCases) c[item.type]++;
    return c;
  }, [baseCases]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return baseCases.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (severityFilter !== "all" && c.severity !== severityFilter) return false;
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      if (needle) {
        const hay = [
          c.id,
          c.type,
          c.report.category,
          c.report.description,
          c.assignedTo ?? "",
          c.context.mentorName ?? "",
          c.context.enterpriseName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [baseCases, typeFilter, severityFilter, sourceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const activeChips = React.useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (search.trim()) {
      chips.push({
        key: "q",
        label: `Search: ${search}`,
        clear: () => {
          setSearchDraft("");
          setParam({ q: null });
        },
      });
    }
    if (typeFilter !== "all") {
      chips.push({
        key: "type",
        label: `Type: ${TYPE_LABEL[typeFilter]}`,
        clear: () => setParam({ type: null }),
      });
    }
    if (severityFilter !== "all") {
      chips.push({
        key: "severity",
        label: `Severity: ${severityFilter}`,
        clear: () => setParam({ severity: null }),
      });
    }
    if (sourceFilter !== "all") {
      chips.push({
        key: "source",
        label: `Source: ${SOURCE_LABEL[sourceFilter]}`,
        clear: () => setParam({ source: null }),
      });
    }
    if (queueFilter !== "my_open") {
      const label = QUEUE_TABS.find((t) => t.key === queueFilter)?.label ?? queueFilter;
      chips.push({
        key: "queue",
        label: `Queue: ${label}`,
        clear: () => setParam({ queue: null }),
      });
    }
    return chips;
  }, [search, typeFilter, severityFilter, sourceFilter, queueFilter, setParam]);

  const hasFilters = activeChips.length > 0;

  const clearAllFilters = () => {
    setSearchDraft("");
    setParam({
      q: null,
      type: null,
      severity: null,
      source: null,
      queue: null,
      page: null,
    });
  };

  const listDescription =
    filtered.length === 0
      ? "No cases match"
      : `${filtered.length} case${filtered.length === 1 ? "" : "s"} · newest first`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text"
        >
          {toast}
        </div>
      )}
      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Case triage requires Platform Admin or Trust &amp; Safety.
          </p>
        </div>
      )}
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Trust &amp; Safety
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Cases
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Triage safety reports, disputes, grievances, and mentor escalations — assign, investigate, and resolve with audit trail.
        </p>
        <RecordLinks />
      </header>

      {summary.highSeverityOpen > 0 && queueFilter !== "closed" && (
        <ContextBanner title={`${summary.highSeverityOpen} high-severity case${summary.highSeverityOpen === 1 ? "" : "s"} open`}>
          <button
            type="button"
            onClick={() =>
              setParam({ queue: "all_open", severity: "high", type: null, source: null })
            }
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Show high severity only
          </button>
        </ContextBanner>
      )}

      {summary.unassigned > 0 && queueFilter !== "unassigned" && (
        <ContextBanner tone="info" title={`${summary.unassigned} unassigned case${summary.unassigned === 1 ? "" : "s"} awaiting triage`}>
          <button
            type="button"
            onClick={() => setParam({ queue: "unassigned" })}
            className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
          >
            View unassigned queue
          </button>
        </ContextBanner>
      )}

      <DashboardSection
        title="Queue summary"
        description={`Signed in as ${operator} · ${profile.title}`}
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="My open"
            value={String(summary.openAssignedToMe)}
            highlight={summary.openAssignedToMe > 0}
          />
          <SummaryStat
            label="Unassigned"
            value={String(summary.unassigned)}
            alert={summary.unassigned > 0}
          />
          <SummaryStat label="All open" value={String(summary.allOpen)} />
          <SummaryStat label="Closed (30d)" value={String(summary.closedLast30d)} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1 basis-[200px]">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Case queue
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
                placeholder="Search ID, category, assignee…"
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
                    setParam({ q: null });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter by queue" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {QUEUE_TABS.map((tab) => {
              const active = queueFilter === tab.key;
              const count =
                tab.key === "my_open"
                  ? summary.openAssignedToMe
                  : tab.key === "unassigned"
                    ? summary.unassigned
                    : tab.key === "all_open"
                      ? summary.allOpen
                      : summary.closedLast30d;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ queue: tab.key === "my_open" ? null : tab.key })}
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
                      active ? "bg-brand-subtle text-brand-subtle-text" : "text-text-tertiary",
                      tab.key === "unassigned" && count > 0 && !active && "text-warning-text font-semibold",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          <nav aria-label="Filter by type" className="flex flex-wrap gap-x-1 -mb-px pb-3 border-t border-stroke-subtle pt-3">
            {TYPE_TABS.map((tab) => {
              const active = typeFilter === tab.key;
              const count = typeCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ type: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2",
                    "font-body text-[12.5px] font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-text-secondary",
                  )}
                >
                  {tab.label}
                  {tab.key !== "all" && (
                    <span className="font-mono text-[10px] text-text-tertiary tabular-nums">{count}</span>
                  )}
                  {active && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-3 border-t border-stroke-subtle pt-3">
              <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Active
              </span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className={cn(
                    "inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full",
                    "bg-brand-subtle/60 border border-brand/20",
                    "font-body text-[11.5px] font-medium text-foreground",
                    "hover:bg-brand-subtle transition-colors duration-fast",
                  )}
                >
                  {chip.label}
                  <X className="h-3 w-3 text-text-tertiary" strokeWidth={2} aria-hidden />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-body text-[11.5px] font-semibold text-text-link"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="pb-3 border-t border-stroke-subtle pt-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className={cn(
                "inline-flex items-center gap-1.5 font-body text-[12px] font-semibold",
                filtersOpen || severityFilter !== "all" || sourceFilter !== "all"
                  ? "text-brand"
                  : "text-text-secondary hover:text-foreground",
              )}
            >
              Narrow by severity & source
            </button>

            {filtersOpen && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <FilterSelect
                  label="Severity"
                  value={severityFilter}
                  onChange={(v) => setParam({ severity: v === "all" ? null : v })}
                  options={[
                    { value: "all", label: "All severities" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ]}
                />
                <FilterSelect
                  label="Source"
                  value={sourceFilter}
                  onChange={(v) => setParam({ source: v === "all" ? null : v })}
                  options={[
                    { value: "all", label: "All sources" },
                    { value: "contributor", label: "Contributor" },
                    { value: "mentor", label: "Mentor portal" },
                    { value: "enterprise", label: "Enterprise" },
                    { value: "internal", label: "Internal" },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyPanel onClear={clearAllFilters} queue={queueFilter} />
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((c) => (
                <CaseRow key={c.id} item={c} />
              ))}
            </ul>
            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
              <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(pageIdx * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
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
          </>
        )}
      </section>
    </div>
  );
}

function CaseRow({ item }: { item: MockGovCase }) {
  const isHighOpen = item.severity === "high" && OPEN_STATUSES.includes(item.status);
  const meta = [
    SOURCE_LABEL[item.source],
    item.anonymous ? "Anonymous" : null,
    item.assignedTo ? `Assigned · ${item.assignedTo}` : "Unassigned",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link
        href={`/admin/governance/${item.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
          isHighOpen && "bg-error-subtle/15 hover:bg-error-subtle/25",
          !item.assignedTo && OPEN_STATUSES.includes(item.status) && "bg-warning-subtle/10",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[11.5px] font-semibold text-text-tertiary tabular-nums shrink-0">
              {item.id}
            </span>
            <StatusChip status={severityChip(item.severity)} size="sm" showDot>
              {item.severity}
            </StatusChip>
            <span className="font-body text-[13px] font-medium text-foreground truncate">
              {TYPE_LABEL[item.type]}
            </span>
          </span>
          <span className="font-body text-[12px] text-text-secondary truncate block mt-0.5">
            {item.report.category}
          </span>
          <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
            {meta}
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-1.5">
          <StatusChip status={statusChip(item.status)} size="sm">
            {STATUS_LABEL[item.status]}
          </StatusChip>
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
            {fmtRelative(item.openedAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/admin/audit"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Platform audit
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

function ContextBanner({
  tone = "warning",
  title,
  children,
}: {
  tone?: "warning" | "info";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "warning"
          ? "border-warning-border bg-warning-subtle/50"
          : "border-brand/25 bg-brand-subtle/20",
      )}
    >
      <p className="font-body text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function EmptyPanel({ onClear, queue }: { onClear: () => void; queue: QueueFilter }) {
  return (
    <div className="px-5 py-14 text-center">
      <Flag className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">No cases match</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {queue === "my_open"
          ? "Nothing assigned to you right now — check unassigned or all open queues."
          : "Try a different queue tab or remove filters to see more cases."}
      </p>
      <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-brand">
        Clear all filters
      </button>
    </div>
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
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      <Select variant="outline" size="sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
