"use client";

/**
 * Governance cases workspace — Aurora Glass T&S triage queue for complaints,
 * disputes, safety reports, and mentor escalations.
 *
 *   · PageHeader + actionable context Banners (high-severity / unassigned)
 *   · GlassCard queue-summary Stat strip
 *   · Queue + type kit Tabs, glass severity/source filters + search
 *   · One sortable glass case table (Case · Severity · Type · Status · Opened)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronsUpDown,
  Flag,
  Search,
  ShieldAlert,
  UserX,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils/cn";
import {
  AURORA_ACCENT,
  AuroraSelect,
  Banner,
  Chip,
  GLASS_FIELD_STYLE,
  GlassCard,
  PageHeader,
  SectionCard,
  Stat,
  Tabs,
  TONE,
  type Tone,
} from "../../_shell/aurora-ui";

const ROWS_PER_PAGE = 10;

type QueueFilter = "my_open" | "unassigned" | "all_open" | "closed";
type TypeFilter = "all" | GovCaseType;
type SeverityFilter = "all" | GovSeverity;
type SourceFilter = "all" | GovSource;
type SortKey = "opened" | "severity" | "type" | "status";
type Dir = "asc" | "desc";

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

const SEVERITY_RANK: Record<GovSeverity, number> = { high: 0, medium: 1, low: 2 };
const STATUS_RANK: Record<GovCaseStatus, number> = {
  open: 0,
  escalated: 1,
  pending_legal: 2,
  in_review: 3,
  resolved_action: 4,
  resolved_no_action: 5,
};

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

function severityTone(s: GovSeverity): Tone {
  if (s === "high") return "error";
  if (s === "medium") return "warning";
  return "info";
}

function statusTone(s: GovCaseStatus): Tone {
  switch (s) {
    case "open":
      return "warning";
    case "in_review":
    case "pending_legal":
      return "info";
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
  const sort = (searchParams.get("sort") as SortKey | null) ?? "opened";
  const dir = (searchParams.get("dir") as Dir | null) ?? "desc";

  const [searchDraft, setSearchDraft] = React.useState(search);
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

  const onSort = React.useCallback(
    (key: SortKey) => {
      if (sort === key) setParam({ dir: dir === "asc" ? "desc" : "asc" });
      else setParam({ sort: key, dir: key === "opened" ? "desc" : "asc" });
    },
    [sort, dir, setParam],
  );

  const baseCases = React.useMemo(
    () => filterByQueue(allCases, queueFilter, operator),
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

  const sorted = React.useMemo(() => {
    const mult = dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let r = 0;
      switch (sort) {
        case "opened":
          r = new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
          break;
        case "severity":
          r = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
          break;
        case "type":
          r = TYPE_LABEL[a.type].localeCompare(TYPE_LABEL[b.type]);
          break;
        case "status":
          r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
          break;
      }
      if (r === 0) r = new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
      return r * mult;
    });
  }, [filtered, sort, dir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

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
    sorted.length === 0
      ? "No cases match"
      : `${sorted.length} case${sorted.length === 1 ? "" : "s"}`;

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

      <PageHeader
        eyebrow="Platform · Governance"
        title="Cases"
        subtitle="Triage safety reports, disputes, grievances, and mentor escalations — assign, investigate, and resolve with audit trail."
        actions={<RecordLinks />}
      />

      {!canEdit && (
        <Banner tone="neutral" icon={ShieldAlert} title="View-only access">
          Case triage requires Platform Admin or Trust &amp; Safety.
        </Banner>
      )}

      {summary.highSeverityOpen > 0 && queueFilter !== "closed" && (
        <Banner
          tone="error"
          icon={AlertTriangle}
          title={`${summary.highSeverityOpen} high-severity case${summary.highSeverityOpen === 1 ? "" : "s"} open`}
        >
          <button
            type="button"
            onClick={() =>
              setParam({ queue: "all_open", severity: "high", type: null, source: null })
            }
            className="font-bold underline underline-offset-2 hover:opacity-80"
            style={{ color: TONE.error.text }}
          >
            Show high severity only
          </button>
        </Banner>
      )}

      {summary.unassigned > 0 && queueFilter !== "unassigned" && (
        <Banner
          tone="info"
          icon={UserX}
          title={`${summary.unassigned} unassigned case${summary.unassigned === 1 ? "" : "s"} awaiting triage`}
        >
          <button
            type="button"
            onClick={() => setParam({ queue: "unassigned" })}
            className="font-bold underline underline-offset-2 hover:opacity-80"
            style={{ color: TONE.info.text }}
          >
            View unassigned queue
          </button>
        </Banner>
      )}

      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-text-tertiary">Queue summary</p>
          <p className="font-body text-[11.5px] text-text-tertiary">
            Signed in as {operator} · {profile.title}
          </p>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="My open"
            value={summary.openAssignedToMe}
            tone={summary.openAssignedToMe > 0 ? "ai" : "neutral"}
            size="lg"
          />
          <Stat
            label="Unassigned"
            value={summary.unassigned}
            tone={summary.unassigned > 0 ? "warning" : "neutral"}
            size="lg"
          />
          <Stat label="All open" value={summary.allOpen} size="lg" />
          <Stat label="Closed (30d)" value={summary.closedLast30d} size="lg" />
        </dl>
      </GlassCard>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          tabs={QUEUE_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            badge:
              t.key === "my_open"
                ? summary.openAssignedToMe
                : t.key === "unassigned"
                  ? summary.unassigned
                  : t.key === "all_open"
                    ? summary.allOpen
                    : summary.closedLast30d,
            badgeTone: t.key === "unassigned" ? "warning" : "neutral",
          }))}
          active={queueFilter}
          onChange={(k) => setParam({ queue: k === "my_open" ? null : k })}
        />
      </div>

      <SectionCard
        title="Case queue"
        description={listDescription}
        headerExtra={
          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            <div className="w-40">
              <AuroraSelect
                aria-label="Filter by severity"
                size="sm"
                value={severityFilter}
                onChange={(e) => setParam({ severity: e.target.value === "all" ? null : e.target.value })}
              >
                <option value="all">All severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </AuroraSelect>
            </div>
            <div className="w-44">
              <AuroraSelect
                aria-label="Filter by source"
                size="sm"
                value={sourceFilter}
                onChange={(e) => setParam({ source: e.target.value === "all" ? null : e.target.value })}
              >
                <option value="all">All sources</option>
                <option value="contributor">Contributor</option>
                <option value="mentor">Mentor portal</option>
                <option value="enterprise">Enterprise</option>
                <option value="internal">Internal</option>
              </AuroraSelect>
            </div>
            <div className="relative w-full sm:w-56">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
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
                style={GLASS_FIELD_STYLE}
                className="w-full h-9 pl-9 pr-8 rounded-lg backdrop-blur-md font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    setParam({ q: null });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="px-5 sm:px-6 py-3 border-b border-white/55 flex flex-wrap items-center gap-2">
          <span className="font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Type</span>
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
                  "inline-flex items-center gap-1.5 h-7 px-3 rounded-full border font-body text-[12px] font-semibold whitespace-nowrap transition-colors duration-fast",
                  active
                    ? "border-transparent text-white"
                    : "border-white/70 bg-white/55 text-text-secondary hover:text-foreground hover:bg-white/75",
                )}
                style={active ? { backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 18px -10px rgba(108,76,230,0.6)" } : undefined}
              >
                {tab.label}
                {tab.key !== "all" && (
                  <span className="font-mono text-[10px] tabular-nums opacity-80">{count}</span>
                )}
              </button>
            );
          })}
          {hasFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto font-body text-[12px] font-semibold text-text-secondary hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel onClear={clearAllFilters} queue={queueFilter} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-white/55">
                    <th className="pl-5 sm:pl-6 pr-3 py-2.5 text-left font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
                      Case
                    </th>
                    <Th label="Severity" sortKey="severity" sort={sort} dir={dir} onSort={onSort} />
                    <Th label="Type" sortKey="type" sort={sort} dir={dir} onSort={onSort} />
                    <Th label="Status" sortKey="status" sort={sort} dir={dir} onSort={onSort} />
                    <Th label="Opened" sortKey="opened" sort={sort} dir={dir} onSort={onSort} align="right" className="pr-5 sm:pr-6" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <CaseRow key={c.id} item={c} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-white/55">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10.5px] text-text-tertiary">
                    {pageIdx}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors"
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}

function Th({
  label,
  sortKey,
  sort,
  dir,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortKey;
  dir: Dir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort === sortKey;
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn(
        "px-3 py-2.5 font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground transition-colors",
          active && "text-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("h-3 w-3", active ? "text-[var(--c-violet-500)]" : "text-text-disabled")} strokeWidth={2.2} aria-hidden />
      </button>
    </th>
  );
}

function CaseRow({ item }: { item: MockGovCase }) {
  const router = useRouter();
  const href = `/admin/governance/${item.id}`;
  const isHighOpen = item.severity === "high" && OPEN_STATUSES.includes(item.status);
  const unassignedOpen = !item.assignedTo && OPEN_STATUSES.includes(item.status);
  const meta = [
    SOURCE_LABEL[item.source],
    item.anonymous ? "Anonymous" : null,
    item.assignedTo ? `Assigned · ${item.assignedTo}` : "Unassigned",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr
      onClick={() => router.push(href)}
      className={cn(
        "group border-b border-white/40 last:border-0 cursor-pointer transition-colors duration-fast",
        isHighOpen
          ? "bg-[var(--color-error-subtle)]/30 hover:bg-[var(--color-error-subtle)]/50"
          : unassignedOpen
            ? "bg-[var(--color-warning-subtle)]/25 hover:bg-white/65"
            : "hover:bg-white/55",
      )}
    >
      <td className="pl-5 sm:pl-6 pr-3 py-3.5">
        <Link href={href} onClick={(e) => e.stopPropagation()} className="block min-w-0">
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[11.5px] font-semibold text-text-tertiary tabular-nums shrink-0">
              {item.id}
            </span>
            <span className="font-display text-[13.5px] font-semibold text-foreground truncate">
              {item.report.category}
            </span>
          </span>
          <span className="block mt-0.5 font-body text-[11px] text-text-tertiary truncate">{meta}</span>
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={severityTone(item.severity)}>{item.severity}</Chip>
      </td>
      <td className="px-3 py-3.5">
        <span className="font-body text-[12.5px] text-text-secondary whitespace-nowrap">{TYPE_LABEL[item.type]}</span>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={statusTone(item.status)}>{STATUS_LABEL[item.status]}</Chip>
      </td>
      <td className="pr-5 sm:pr-6 pl-3 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap" suppressHydrationWarning>
            {fmtRelative(item.openedAt)}
          </span>
          <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
        </div>
      </td>
    </tr>
  );
}

function RecordLinks() {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12.5px]">
      <Link
        href="/admin/audit"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Platform audit
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/admin/kyc"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        KYC reviews
      </Link>
    </p>
  );
}

function EmptyPanel({ onClear, queue }: { onClear: () => void; queue: QueueFilter }) {
  return (
    <div className="px-5 py-16 text-center">
      <span className="grid place-items-center h-12 w-12 mx-auto rounded-xl border border-white/70 bg-white/55 text-text-tertiary mb-3">
        <Flag className="h-6 w-6" strokeWidth={1.85} aria-hidden />
      </span>
      <p className="font-display text-[15px] font-semibold text-foreground">No cases match</p>
      <p className="mt-1 font-body text-[12.5px] text-text-tertiary max-w-sm mx-auto">
        {queue === "my_open"
          ? "Nothing assigned to you right now — check unassigned or all open queues."
          : "Try a different queue tab or remove filters to see more cases."}
      </p>
      <button type="button" onClick={onClear} className="mt-3 font-body text-[12.5px] font-semibold" style={{ color: "var(--color-ai-text)" }}>
        Clear all filters
      </button>
    </div>
  );
}
