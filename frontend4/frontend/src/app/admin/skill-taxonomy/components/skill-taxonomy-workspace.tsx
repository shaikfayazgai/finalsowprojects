"use client";

/**
 * Skill taxonomy registry — aligned with mentors list + tenant registry UX.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, GitMerge, Plus, Search, X } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill, SkillStatus } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";

type StatusFilter = "all" | SkillStatus;

const STATUS_LABEL: Record<SkillStatus, string> = {
  active: "Active",
  deprecated: "Deprecated",
  pending: "Pending review",
};

const STATUS_CHIP: Record<
  SkillStatus,
  "success" | "warning" | "neutral" | "pending"
> = {
  active: "success",
  deprecated: "neutral",
  pending: "pending",
};

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "deprecated", label: "Deprecated" },
];

const GROUP_ORDER: SkillStatus[] = ["pending", "active", "deprecated"];
const PREVIEW_PER_GROUP = 5;
const ROWS_PER_PAGE = 12;

function sortSkills(items: MockSkill[]): MockSkill[] {
  return [...items].sort((a, b) => {
    const rank = (s: SkillStatus) => {
      if (s === "pending") return 0;
      if (s === "deprecated") return 2;
      return 1;
    };
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return a.name.localeCompare(b.name);
  });
}

function groupSkills(items: MockSkill[]) {
  const buckets = new Map<SkillStatus, MockSkill[]>();
  for (const s of GROUP_ORDER) buckets.set(s, []);
  for (const skill of sortSkills(items)) buckets.get(skill.status)?.push(skill);
  return GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    rows: buckets.get(status) ?? [],
  })).filter((g) => g.rows.length > 0);
}

export function SkillTaxonomyWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skills = useAdminSkillsList();

  const statusFilter: StatusFilter =
    (searchParams.get("status") as StatusFilter | null) ?? "all";
  const categoryFilter = searchParams.get("category") ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const categories = React.useMemo(
    () => Array.from(new Set(skills.map((s) => s.category))).sort(),
    [skills],
  );

  const counts = React.useMemo(
    () => ({
      all: skills.length,
      active: skills.filter((s) => s.status === "active").length,
      pending: skills.filter((s) => s.status === "pending").length,
      deprecated: skills.filter((s) => s.status === "deprecated").length,
      holders: skills.reduce((n, s) => n + s.holders, 0),
    }),
    [skills],
  );

  const pendingHero = React.useMemo(
    () => skills.find((s) => s.status === "pending"),
    [skills],
  );

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "" || v === "all") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/skill-taxonomy?${qs}` : "/admin/skill-taxonomy", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return skills.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (needle) {
        const hay = [s.name, s.id, s.category, ...s.aliases].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [skills, statusFilter, categoryFilter, search]);

  const sorted = React.useMemo(() => sortSkills(filtered), [filtered]);
  const showGrouped =
    statusFilter === "all" && categoryFilter === "all" && !search.trim();
  const groups = showGrouped ? groupSkills(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = showGrouped
    ? sorted
    : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const listTitle =
    statusFilter === "all" ? "Skill registry" : STATUS_LABEL[statusFilter];
  const listDescription =
    sorted.length === 0
      ? "No skills match"
      : showGrouped
        ? `${sorted.length} skill${sorted.length === 1 ? "" : "s"} · grouped by status`
        : `${sorted.length} skill${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Governance
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Skill taxonomy
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Canonical skills for competency matching, mentor routing, and contributor profiles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href="/admin/skill-taxonomy/merge" className={secondaryBtnCls}>
            <GitMerge className="h-4 w-4" strokeWidth={2} aria-hidden />
            Merge
          </Link>
          <Link href="/admin/skill-taxonomy/new" className={primaryBtnCls}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            New skill
          </Link>
        </div>
      </header>

      {pendingHero && statusFilter !== "pending" && counts.pending > 0 && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {counts.pending} skill{counts.pending === 1 ? "" : "s"} pending review
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            <span className="font-medium text-foreground">{pendingHero.name}</span>
            {pendingHero.createdBy && ` · ${pendingHero.createdBy}`}
            .{" "}
            <Link
              href={`/admin/skill-taxonomy/${pendingHero.id}`}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Review
            </Link>
            {counts.pending > 1 && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => setParam({ status: "pending" })}
                  className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
                >
                  View all pending
                </button>
              </>
            )}
          </p>
        </div>
      )}

      <DashboardSection title="Taxonomy summary" description="Skills across the platform">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="All skills" value={String(counts.all)} />
          <SummaryStat label="Active" value={String(counts.active)} highlight={counts.active > 0} />
          <SummaryStat
            label="Pending review"
            value={String(counts.pending)}
            alert={counts.pending > 0}
          />
          <SummaryStat label="Total holders" value={String(counts.holders)} />
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
                placeholder="Search name, alias, id…"
                className={searchCls}
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

          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px pb-2">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.key;
              const count =
                tab.key === "all" ? counts.all : counts[tab.key as SkillStatus];
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
                      tab.key === "pending" && count > 0 && !active && "text-warning-text font-semibold",
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

          {categories.length > 0 && (
            <div
              aria-label="Filter by category"
              className="flex flex-wrap items-center gap-1.5 pb-3 border-t border-stroke-subtle pt-3"
            >
              <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mr-1">
                Category
              </span>
              <CategoryChip
                label="All"
                count={counts.all}
                active={categoryFilter === "all"}
                onClick={() => setParam({ category: null })}
              />
              {categories.map((cat) => {
                const count = skills.filter((s) => s.category === cat).length;
                return (
                  <CategoryChip
                    key={cat}
                    label={cat}
                    count={count}
                    active={categoryFilter === cat}
                    onClick={() => setParam({ category: cat })}
                  />
                );
              })}
            </div>
          )}
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel
            hasQuery={
              Boolean(search.trim()) ||
              statusFilter !== "all" ||
              categoryFilter !== "all"
            }
            onClear={() => setParam({ status: null, category: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <SkillGroup
                key={group.status}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/admin/skill-taxonomy?status=${group.status}`}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((s) => (
                <li key={s.id}>
                  <SkillRow skill={s} />
                </li>
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

function SkillGroup({
  label,
  rows,
  previewLimit,
  filterHref,
}: {
  label: string;
  rows: MockSkill[];
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
        <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
          View all
        </Link>
      </div>
      <ul role="list">
        {preview.map((s) => (
          <li key={s.id} className="border-t border-stroke-subtle">
            <SkillRow skill={s} compact />
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

function SkillRow({ skill: s, compact }: { skill: MockSkill; compact?: boolean }) {
  const isPending = s.status === "pending";
  return (
    <Link
      href={`/admin/skill-taxonomy/${s.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        compact ? "py-2.5 min-h-[44px]" : "py-3 min-h-[52px]",
        isPending && "bg-brand-subtle/10 hover:bg-brand-subtle/20",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-body text-[13px] font-medium text-foreground truncate">
            {s.name}
          </span>
          <CategoryBadge category={s.category} />
        </span>
        {s.aliases.length > 0 && (
          <span className="font-mono text-[10.5px] text-text-tertiary block mt-0.5 truncate">
            aka {s.aliases.join(", ")}
          </span>
        )}
        <span className="font-body text-[11.5px] text-text-tertiary block mt-0.5 truncate">
          {s.holders} holder{s.holders === 1 ? "" : "s"}
          {s.createdBy && ` · ${s.createdBy}`}
        </span>
      </span>
      <StatusChip status={STATUS_CHIP[s.status]} size="sm" showDot>
        {STATUS_LABEL[s.status]}
      </StatusChip>
    </Link>
  );
}

function CategoryBadge({ category }: { category: MockSkill["category"] }) {
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold bg-bg-subtle text-text-secondary border border-stroke-subtle">
      {category}
    </span>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border font-body text-[12px] transition-colors duration-fast",
        active
          ? "bg-foreground text-surface border-foreground"
          : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle",
      )}
    >
      {label}
      <span
        className={cn(
          "font-mono text-[10px] tabular-nums",
          active ? "text-surface/70" : "text-text-tertiary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
  alert = false,
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
          alert ? "text-warning-text" : highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyPanel({ hasQuery, onClear }: { hasQuery: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-body text-[13.5px] font-semibold text-foreground">No skills found</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        {hasQuery
          ? "Try clearing filters or adjusting your search."
          : "Add skills to the taxonomy or approve contributor suggestions."}
      </p>
      {hasQuery ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 font-body text-[12px] font-semibold text-text-link"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/admin/skill-taxonomy/new"
          className="mt-3 inline-block font-body text-[12px] font-semibold text-text-link"
        >
          New skill →
        </Link>
      )}
    </div>
  );
}

const searchCls = cn(
  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const secondaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
  "hover:bg-brand-hover transition-colors duration-fast",
);
