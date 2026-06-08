"use client";

/**
 * Projects workspace — aligned with SOW / decomposition list UX.
 *
 *   · One panel: underline tabs + search
 *   · Grouped preview on All (active); flat paginated list when filtered
 *   · Scannable rows: name + meta (health · progress · due · PMO)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Search } from "lucide-react";
import {
  listProjectsMock,
  listCompletedProjectsMock,
  type ProjectSummary,
  type ProjectHealth,
} from "@/lib/projects/projects-mock";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 10;
const PREVIEW_PER_GROUP = 5;

type FilterKey = "all" | "at_risk" | "mine" | "completed";

const HEALTH_LABEL: Record<ProjectHealth, string> = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  done: "Done",
};

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All active" },
  { key: "at_risk", label: "At risk" },
  { key: "mine", label: "My projects" },
  { key: "completed", label: "Completed" },
];

const ATTENTION_HEALTH: ProjectHealth[] = ["at_risk", "blocked"];
const ON_TRACK_HEALTH: ProjectHealth[] = ["on_track"];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dueAt: string): boolean {
  return new Date(dueAt).getTime() < Date.now();
}

function isMine(project: ProjectSummary): boolean {
  const hay = `${project.sponsor} ${project.pmo}`.toLowerCase();
  return hay.includes("sandeep");
}

function rowMeta(project: ProjectSummary, completedView: boolean): { text: string; overdue: boolean } {
  const pct = `${Math.round(project.progress * 100)}%`;
  const health = HEALTH_LABEL[project.health];
  const dueLabel = completedView
    ? `Closed ${fmtDate(project.completedAt ?? project.dueAt)}`
    : `Due ${fmtDate(project.dueAt)}`;
  const overdue = !completedView && isOverdue(project.dueAt) && project.health !== "done";

  if (overdue) {
    return {
      text: `${health} · ${pct} · Overdue · ${project.pmo}`,
      overdue: true,
    };
  }

  return {
    text: [health, pct, dueLabel, project.pmo].join(" · "),
    overdue: false,
  };
}

function sortProjects(items: ProjectSummary[]): ProjectSummary[] {
  return [...items].sort((a, b) => {
    const aAttention = ATTENTION_HEALTH.includes(a.health) ? 1 : 0;
    const bAttention = ATTENTION_HEALTH.includes(b.health) ? 1 : 0;
    if (aAttention !== bAttention) return bAttention - aAttention;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

function groupActiveProjects(items: ProjectSummary[]) {
  const sorted = sortProjects(items);
  const attention = sorted.filter((p) => ATTENTION_HEALTH.includes(p.health));
  const onTrack = sorted.filter((p) => ON_TRACK_HEALTH.includes(p.health));
  const other = sorted.filter(
    (p) => !ATTENTION_HEALTH.includes(p.health) && !ON_TRACK_HEALTH.includes(p.health),
  );

  const groups: Array<{ key: string; label: string; rows: ProjectSummary[] }> = [];
  if (attention.length) groups.push({ key: "attention", label: "Needs attention", rows: attention });
  if (onTrack.length) groups.push({ key: "on_track", label: "On track", rows: onTrack });
  if (other.length) groups.push({ key: "other", label: "Other", rows: other });
  return groups;
}

export default function ProjectsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const active = React.useMemo(() => listProjectsMock(), []);
  const completed = React.useMemo(() => listCompletedProjectsMock(), []);

  const counts = React.useMemo(() => {
    let atRisk = 0;
    let mine = 0;
    for (const p of active) {
      if (ATTENTION_HEALTH.includes(p.health)) atRisk++;
      if (isMine(p)) mine++;
    }
    return {
      all: active.length,
      at_risk: atRisk,
      mine,
      completed: completed.length,
    };
  }, [active, completed]);

  const source = activeFilter === "completed" ? completed : active;

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return source.filter((p) => {
      if (activeFilter === "at_risk" && !ATTENTION_HEALTH.includes(p.health)) return false;
      if (activeFilter === "mine" && !isMine(p)) return false;
      if (needle) {
        const hay = `${p.name} ${p.pmo} ${p.sponsor}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [source, activeFilter, search]);

  const sorted = React.useMemo(() => sortProjects(filtered), [filtered]);
  const showGrouped = activeFilter === "all" && !search.trim();
  const groups = showGrouped ? groupActiveProjects(sorted) : null;

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
      router.replace(`/enterprise/projects?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const listTitle =
    activeFilter === "all"
      ? "Active delivery"
      : activeFilter === "completed"
        ? "Completed"
        : TABS.find((t) => t.key === activeFilter)?.label ?? "Projects";

  const attentionCount = active.filter((p) => ATTENTION_HEALTH.includes(p.health)).length;

  const listDescription =
    sorted.length === 0
      ? "No matches"
      : showGrouped
        ? `${sorted.length} project${sorted.length === 1 ? "" : "s"} · grouped by health`
        : `${sorted.length} project${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {listTitle}
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {listDescription}
                {showGrouped && attentionCount > 0 && (
                  <span className="text-warning-text font-medium">
                    {" · "}
                    {attentionCount} need attention
                  </span>
                )}
              </p>
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
                placeholder="Search name, PMO, sponsor…"
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

          <nav aria-label="Filter projects" className="flex flex-wrap gap-x-1 -mb-px">
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
            isEmptyTenant={source.length === 0}
            onClear={() => setParam({ filter: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <ProjectGroup
                key={group.key}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/enterprise/projects?filter=${
                  group.key === "attention" ? "at_risk" : "all"
                }`}
                completedView={false}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  completedView={activeFilter === "completed"}
                />
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

function ProjectGroup({
  label,
  rows,
  previewLimit,
  filterHref,
  completedView,
}: {
  label: string;
  rows: ProjectSummary[];
  previewLimit: number;
  filterHref: string;
  completedView: boolean;
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
      <ul role="list" className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
        {preview.map((project) => (
          <li key={project.id}>
            <ProjectRow project={project} completedView={completedView} />
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

function ProjectRow({
  project,
  completedView,
}: {
  project: ProjectSummary;
  completedView: boolean;
}) {
  const meta = rowMeta(project, completedView);
  const quiet = project.health === "done" || completedView;

  return (
    <Link
      href={`/enterprise/projects/${project.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        quiet && "opacity-70",
      )}
    >
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        {project.name}
      </span>
      <span
        className={cn(
          "font-body text-[11px] shrink-0 text-right max-w-[55%] truncate",
          meta.overdue ? "text-warning-text font-medium" : "text-text-tertiary",
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
      <Briefcase className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      {isEmptyTenant ? (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No projects yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            Approve a decomposition plan to provision a delivery project.
          </p>
          <Link
            href="/enterprise/decomposition"
            className="mt-4 inline-flex h-9 items-center px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold"
          >
            Go to decomposition
          </Link>
        </>
      ) : (
        <>
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
