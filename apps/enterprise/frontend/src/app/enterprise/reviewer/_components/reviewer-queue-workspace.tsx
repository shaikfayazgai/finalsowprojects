"use client";

/**
 * Shared QA review queue workspace — underline tabs, search, scannable rows.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ClipboardCheck, FileText, Search } from "lucide-react";
import type { MockReviewerItem, SlaTier } from "@/mocks/reviewer";
import { fetchReviewerQueue, ReviewerApiError } from "@/lib/api/reviewer-mock";
import { listReviewerQueue } from "@/lib/api/reviewer";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 10;
const PREVIEW_PER_GROUP = 5;

interface AssignedSow {
  sowId: string;
  title: string;
  status?: string | null;
  stage?: string | null;
  ownerEmail?: string | null;
  assignmentStatus?: string | null;
  assignedAt?: string | null;
}

/**
 * Map a backend reviewer assignment (GET /api/v1/reviewer/dashboard →
 * `assignments[]`, sourced from reviewer_assignments) → the MockReviewerItem
 * shape the queue renders. Mirrors the mentor queue's backendRowToReview.
 */
function backendRowToReviewer(a: Record<string, unknown>): MockReviewerItem {
  const str = (k: string, d = "") => (typeof a[k] === "string" ? (a[k] as string) : d);
  const data = (a.data && typeof a.data === "object" ? a.data : {}) as Record<string, unknown>;
  const dstr = (k: string, d = "") => (typeof data[k] === "string" ? (data[k] as string) : d);
  const created = str("createdAt") || str("updatedAt") || new Date().toISOString();
  return {
    id: str("id"),
    taskTitle: str("title") || dstr("summary") || "Submission",
    taskSubtitle: dstr("summary") || "",
    project: str("projectName") || str("projectId") || dstr("taskId") || "—",
    tenant: dstr("tenant") || "—",
    contributorName: dstr("contributorName") || "Contributor",
    mentorName: dstr("mentorName") || "Mentor",
    round: typeof data.round === "number" ? (data.round as number) : 1,
    totalRounds: 3,
    submittedAt: created,
    mentorAcceptedAt: created,
    dueAt: dstr("dueAt") || created,
    slaTier: "healthy",
    state: "open",
    evidence: [],
    criteria: [],
    mentorOverall: 0,
    mentorNote: dstr("mentorNote") || "",
    contributorCoverNote: dstr("coverNote") || "",
    criteriaValidatedCount: 0,
  };
}

type FilterKey = "all" | "sla_risk" | "round_2";

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All pending" },
  { key: "sla_risk", label: "SLA risk" },
  { key: "round_2", label: "Round 2+" },
];

const SLA_ATTENTION: SlaTier[] = ["breached", "critical", "warning"];
const SLA_OVERDUE: SlaTier[] = ["breached", "critical"];

function fmtSlaDue(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Overdue";
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  return `${h}h left`;
}

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function isSlaRisk(item: MockReviewerItem): boolean {
  return SLA_ATTENTION.includes(item.slaTier);
}

function isRound2Plus(item: MockReviewerItem): boolean {
  return item.round >= 2;
}

function rowMeta(item: MockReviewerItem): { text: string; urgent: boolean } {
  const sla = fmtSlaDue(item.dueAt);
  const overdue = item.slaTier === "breached" || item.slaTier === "critical";
  const criteria = `${item.criteriaValidatedCount}/${item.criteria.length} criteria`;

  if (overdue) {
    return {
      text: `${item.contributorName} · ${item.project} · R${item.round} · ${sla} · ${criteria}`,
      urgent: true,
    };
  }

  return {
    text: [
      item.contributorName,
      item.project,
      `R${item.round}/${item.totalRounds}`,
      `Mentor ${fmtRelative(item.mentorAcceptedAt)}`,
      sla,
      criteria,
    ].join(" · "),
    urgent: item.slaTier === "warning",
  };
}

function sortQueue(items: MockReviewerItem[]): MockReviewerItem[] {
  return [...items].sort((a, b) => {
    const rank = (t: SlaTier) =>
      t === "breached" || t === "critical" ? 3 : t === "warning" ? 2 : t === "watch" ? 1 : 0;
    if (rank(a.slaTier) !== rank(b.slaTier)) return rank(b.slaTier) - rank(a.slaTier);
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

function groupQueue(items: MockReviewerItem[]) {
  const sorted = sortQueue(items);
  const overdue = sorted.filter((i) => SLA_OVERDUE.includes(i.slaTier));
  const atRisk = sorted.filter(
    (i) => i.slaTier === "warning" && !SLA_OVERDUE.includes(i.slaTier),
  );
  const onTrack = sorted.filter((i) => !SLA_ATTENTION.includes(i.slaTier));

  const groups: Array<{ key: string; label: string; rows: MockReviewerItem[] }> = [];
  if (overdue.length) groups.push({ key: "overdue", label: "Overdue", rows: overdue });
  if (atRisk.length) groups.push({ key: "at_risk", label: "SLA risk", rows: atRisk });
  if (onTrack.length) groups.push({ key: "on_track", label: "On track", rows: onTrack });
  return groups;
}

export function ReviewerQueueWorkspace({
  basePath = "/enterprise/reviewer",
  showGroupedPreview = true,
  listTitle = "Pending reviews",
}: {
  basePath?: string;
  showGroupedPreview?: boolean;
  listTitle?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [items, setItems] = React.useState<MockReviewerItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [assignedSows, setAssignedSows] = React.useState<AssignedSow[]>([]);

  // SOWs this reviewer was assigned to at intake — shown immediately, before any
  // delivery, so they can see what they're responsible for.
  React.useEffect(() => {
    const c = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/reviewer/assigned-sows", { signal: c.signal, cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { sows?: AssignedSow[] };
        if (!c.signal.aborted && Array.isArray(data.sows)) setAssignedSows(data.sows);
      } catch {
        // non-fatal — assigned SOWs are supplementary to the QA queue
      }
    })();
    return () => c.abort();
  }, []);

  React.useEffect(() => {
    const c = new AbortController();
    // Prefer the REAL backend queue (assignments routed from mentor accept
    // hand-off for SOWs assigned to this reviewer). Fall back to the mock roster
    // only if the backend is unavailable, so the demo UI still renders.
    void (async () => {
      try {
        const raw = (await listReviewerQueue(c.signal)) as
          | { assignments?: Record<string, unknown>[]; data?: { assignments?: Record<string, unknown>[] } }
          | undefined;
        const rows = raw?.assignments ?? raw?.data?.assignments ?? [];
        if (c.signal.aborted) return;
        if (Array.isArray(rows) && rows.length > 0) {
          setItems(rows.map(backendRowToReviewer));
          setError(null);
          return;
        }
        // Backend reachable but empty → show an empty real queue (not mock).
        setItems([]);
        setError(null);
      } catch {
        // Backend unavailable → fall back to mock so the page still works.
        fetchReviewerQueue(c.signal)
          .then((res) => setItems(res.items))
          .catch((err: unknown) => {
            if ((err as { name?: string }).name === "AbortError") return;
            setError(err instanceof ReviewerApiError ? err.message : "Could not load review queue.");
          });
      }
    })();
    return () => c.abort();
  }, []);

  const list = items ?? [];

  const counts = React.useMemo(() => {
    let slaRisk = 0;
    let round2 = 0;
    for (const item of list) {
      if (isSlaRisk(item)) slaRisk++;
      if (isRound2Plus(item)) round2++;
    }
    return { all: list.length, sla_risk: slaRisk, round_2: round2 };
  }, [list]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return list.filter((item) => {
      if (activeFilter === "sla_risk" && !isSlaRisk(item)) return false;
      if (activeFilter === "round_2" && !isRound2Plus(item)) return false;
      if (needle) {
        const hay = `${item.taskTitle} ${item.contributorName} ${item.project} ${item.mentorName}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [list, activeFilter, search]);

  const sorted = React.useMemo(() => sortQueue(filtered), [filtered]);
  const grouped =
    showGroupedPreview && activeFilter === "all" && !search.trim();
  const groups = grouped ? groupQueue(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = grouped
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
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [router, searchParams, basePath],
  );

  const slaRiskCount = list.filter(isSlaRisk).length;

  const listDescription =
    items === null && !error
      ? "Loading reviews…"
      : sorted.length === 0
        ? "No matches"
        : grouped
          ? `${sorted.length} review${sorted.length === 1 ? "" : "s"} · grouped by SLA`
          : `${sorted.length} review${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
        </div>
      )}

      {assignedSows.length > 0 && (
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Assigned SOWs
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {assignedSows.length} SOW{assignedSows.length === 1 ? "" : "s"} routed to you for second-stage QA. Delivered tasks appear in your queue below as contributors submit work.
            </p>
          </div>
          <ul className="divide-y divide-stroke-subtle">
            {assignedSows.map((s) => (
              <li key={s.sowId} className="px-5 py-3 flex items-center gap-3">
                <FileText className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[13px] font-medium text-foreground truncate">{s.title}</p>
                  <p className="font-body text-[11.5px] text-text-tertiary truncate">
                    {s.ownerEmail ? `From ${s.ownerEmail}` : s.sowId}
                    {s.stage ? ` · stage: ${s.stage}` : ""}
                  </p>
                </div>
                <span className="font-body text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-subtle text-brand-subtle-text shrink-0">
                  {s.assignmentStatus || "assigned"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {listTitle}
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {listDescription}
                {grouped && slaRiskCount > 0 && (
                  <span className="text-warning-text font-medium">
                    {" · "}
                    {slaRiskCount} SLA at risk
                  </span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[12px]">
                <Link
                  href="/enterprise/reviewer/history"
                  className="font-medium text-text-link hover:underline underline-offset-2"
                >
                  Decision history
                </Link>
                <Link
                  href="/enterprise/reviewer/metrics"
                  className="font-medium text-text-link hover:underline underline-offset-2"
                >
                  My metrics
                </Link>
              </div>
            </div>
            <div className="relative w-full sm:w-52 shrink-0">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search task, people…"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-body text-[10.5px] text-text-link"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter review queue" className="flex flex-wrap gap-x-1 -mb-px">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setParam({ filter: tab.key === "all" ? null : tab.key })
                  }
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
                      tab.key === "sla_risk" && count > 0 && !active && "text-warning-text",
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

        {items === null && !error ? (
          <QueueSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyPanel
            isEmptyTenant={list.length === 0 && !error}
            onClear={() => setParam({ filter: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <QueueGroup
                key={group.key}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`${basePath}?filter=${
                  group.key === "overdue" || group.key === "at_risk" ? "sla_risk" : "all"
                }`}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((item) => (
                <QueueRow key={item.id} item={item} />
              ))}
            </ul>
            {totalPages > 1 && (
              <footer className="flex items-center justify-between px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() =>
                      setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })
                    }
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

function QueueGroup({
  label,
  rows,
  previewLimit,
  filterHref,
}: {
  label: string;
  rows: MockReviewerItem[];
  previewLimit: number;
  filterHref: string;
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
        {rows.length > previewLimit && (
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
            View all
          </Link>
        )}
      </div>
      <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
        {preview.map((item) => (
          <li key={item.id}>
            <QueueRow item={item} />
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

function QueueRow({ item }: { item: MockReviewerItem }) {
  const meta = rowMeta(item);

  return (
    <Link
      href={`/enterprise/reviewer/queue/${item.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        {item.taskTitle}
      </span>
      <span
        className={cn(
          "font-body text-[11px] shrink-0 text-right max-w-[55%] truncate",
          meta.urgent ? "text-warning-text font-medium" : "text-text-tertiary",
        )}
      >
        {meta.text}
      </span>
    </Link>
  );
}

function EmptyPanel({
  isEmptyTenant,
  onClear,
}: {
  isEmptyTenant: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      {isEmptyTenant ? (
        <>
          <CheckCircle2 className="h-6 w-6 text-success-text mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">Queue clear</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            No submissions awaiting QA review.
          </p>
        </>
      ) : (
        <>
          <ClipboardCheck className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          <button
            type="button"
            onClick={onClear}
            className="mt-2 font-body text-[12.5px] font-semibold text-brand"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-3">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}
