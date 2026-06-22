"use client";

/**
 * Projects workspace — registry table (platform pattern).
 *
 *   · "Needs attention" alert up top (at-risk / blocked) — the priority surface
 *   · Solid registry table: gradient-pill tabs + search + paginate
 *   · Columns: project · health · progress · due · PMO
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Briefcase, ChevronRight, Search, X } from "lucide-react";
import {
  listProjectsMock,
  listCompletedProjectsMock,
  type ProjectSummary,
  type ProjectHealth,
} from "@/lib/projects/projects-mock";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, primaryBtnClass, primaryStyle, type Tone } from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 12;

type FilterKey = "all" | "at_risk" | "mine" | "completed";

const HEALTH_LABEL: Record<ProjectHealth, string> = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  done: "Done",
};

const HEALTH_TONE: Record<ProjectHealth, Tone> = {
  on_track: "success",
  at_risk: "warning",
  blocked: "error",
  done: "neutral",
};

const HEALTH_BAR: Record<ProjectHealth, string> = {
  on_track: "var(--color-success-solid)",
  at_risk: "var(--color-warning-solid)",
  blocked: "var(--color-error-solid)",
  done: "var(--color-text-disabled)",
};

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All active" },
  { key: "at_risk", label: "At risk" },
  { key: "mine", label: "My projects" },
  { key: "completed", label: "Completed" },
];

const ATTENTION_HEALTH: ProjectHealth[] = ["at_risk", "blocked"];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function isOverdue(dueAt: string): boolean {
  return new Date(dueAt).getTime() < Date.now();
}

function isMine(project: ProjectSummary): boolean {
  return `${project.sponsor} ${project.pmo}`.toLowerCase().includes("sandeep");
}

function sortProjects(items: ProjectSummary[]): ProjectSummary[] {
  return [...items].sort((a, b) => {
    const aAttention = ATTENTION_HEALTH.includes(a.health) ? 1 : 0;
    const bAttention = ATTENTION_HEALTH.includes(b.health) ? 1 : 0;
    if (aAttention !== bAttention) return bAttention - aAttention;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export default function ProjectsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey = (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  // Project lists come from a client-side localStorage overlay, so they differ
  // server↔client. Gate on mount so SSR and the first client render agree.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const active = React.useMemo(() => (mounted ? listProjectsMock() : []), [mounted]);
  const completed = React.useMemo(() => (mounted ? listCompletedProjectsMock() : []), [mounted]);

  const counts = React.useMemo(() => {
    let atRisk = 0;
    let mine = 0;
    for (const p of active) {
      if (ATTENTION_HEALTH.includes(p.health)) atRisk++;
      if (isMine(p)) mine++;
    }
    return { all: active.length, at_risk: atRisk, mine, completed: completed.length };
  }, [active, completed]);

  const completedView = activeFilter === "completed";
  const source = completedView ? completed : active;

  const sorted = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = source.filter((p) => {
      if (activeFilter === "at_risk" && !ATTENTION_HEALTH.includes(p.health)) return false;
      if (activeFilter === "mine" && !isMine(p)) return false;
      if (needle && !`${p.name} ${p.pmo} ${p.sponsor}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortProjects(rows);
  }, [source, activeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/enterprise/projects?${qs}` : "/enterprise/projects", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-4">
      {/* Priority — projects that need attention */}
      {activeFilter !== "at_risk" && !completedView && counts.at_risk > 0 ? (
        <button
          type="button"
          onClick={() => setParam({ filter: "at_risk" })}
          className="w-full flex items-center gap-3 rounded-lg border border-warning-border bg-warning-subtle/50 px-4 py-3 text-left hover:bg-warning-subtle/70 transition-colors group"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-text" strokeWidth={2} aria-hidden />
          <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">
              {counts.at_risk} project{counts.at_risk === 1 ? "" : "s"} need attention
            </span>{" "}
            — at risk or blocked.
          </span>
          <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-foreground shrink-0" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter projects" className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              const count = counts[tab.key];
              const warn = tab.key === "at_risk" && count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ filter: tab.key === "all" ? null : tab.key })}
                  aria-current={isActive ? "page" : undefined}
                  style={isActive ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    isActive ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                      isActive ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                  {warn && !isActive ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-solid)] shrink-0" /> : null}
                </button>
              );
            })}
          </nav>

          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setParam({ q: e.target.value })}
              placeholder="Search name, PMO, sponsor…"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setParam({ q: null })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {!mounted ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState isEmptyTenant={source.length === 0} onClear={() => setParam({ filter: null, q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Project</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Health</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Progress</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">{completedView ? "Closed" : "Due"}</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">PMO</th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((project) => (
                    <ProjectRow key={project.id} project={project} completedView={completedView} onOpen={() => router.push(`/enterprise/projects/${project.id}`)} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] text-text-tertiary">{pageIdx}/{totalPages}</span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              </footer>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project, completedView, onOpen }: { project: ProjectSummary; completedView: boolean; onOpen: () => void }) {
  const pct = Math.round(project.progress * 100);
  const overdue = !completedView && isOverdue(project.dueAt) && project.health !== "done";
  const quiet = project.health === "done" || completedView;
  const dueLabel = completedView ? fmtDate(project.completedAt ?? project.dueAt) : overdue ? "Overdue" : fmtDate(project.dueAt);
  const href = `/enterprise/projects/${project.id}`;

  return (
    <tr
      onClick={onOpen}
      className={cn("group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors", quiet && "opacity-70")}
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[280px]"
          title={project.name}
        >
          {project.name}
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={HEALTH_TONE[project.health]}>{HEALTH_LABEL[project.health]}</Chip>
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-foreground/[0.08] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: HEALTH_BAR[project.health] }} aria-hidden />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-text-secondary">{pct}%</span>
        </div>
      </td>
      <td className={cn("px-3 py-3.5 font-mono text-[12px] tabular-nums whitespace-nowrap", overdue ? "text-warning-text font-semibold" : "text-text-tertiary")} suppressHydrationWarning>
        {dueLabel}
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary truncate max-w-[140px]">{project.pmo}</td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} aria-hidden />
      </td>
    </tr>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-56 max-w-[40%]" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-[22px] w-16 rounded-full" />
            <Skeleton className="h-2 w-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isEmptyTenant, onClear }: { isEmptyTenant: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <Briefcase className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      {isEmptyTenant ? (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No projects yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            Approve a decomposition plan to provision a delivery project.
          </p>
          <Link href="/enterprise/decomposition" className={cn(primaryBtnClass, "mt-4 px-5")} style={primaryStyle}>
            Go to decomposition
          </Link>
        </>
      ) : (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground">
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}
