"use client";

/**
 * Skill taxonomy registry — Aurora Glass directory.
 *
 *   · Filter toolbar: status + category dropdowns + search
 *   · One sortable glass table (Skill · Category · Status · Holders)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, GitMerge, Plus, Search, Tag, X } from "lucide-react";
import { useAdminSkillsList } from "@/lib/hooks/use-admin-skills";
import type { MockSkill, SkillStatus } from "@/mocks/admin/skills";
import { cn } from "@/lib/utils/cn";
import {
  AuroraSelect,
  Chip,
  GLASS_FIELD_STYLE,
  GlassCard,
  PageHeader,
  TONE,
  type Tone,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

type StatusFilter = "all" | SkillStatus;
type SortKey = "name" | "category" | "status" | "holders";
type Dir = "asc" | "desc";

const STATUS_LABEL: Record<SkillStatus, string> = {
  active: "Active",
  deprecated: "Deprecated",
  pending: "Pending review",
};

const STATUS_TONE: Record<SkillStatus, Tone> = {
  active: "success",
  pending: "warning",
  deprecated: "neutral",
};

const STATUS_RANK: Record<SkillStatus, number> = { pending: 0, active: 1, deprecated: 2 };
const ROWS_PER_PAGE = 12;

export function SkillTaxonomyWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skills = useAdminSkillsList();

  const statusFilter: StatusFilter = (searchParams.get("status") as StatusFilter | null) ?? "all";
  const categoryFilter = searchParams.get("category") ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const sort = (searchParams.get("sort") as SortKey | null) ?? "name";
  const dir = (searchParams.get("dir") as Dir | null) ?? "asc";

  const categories = React.useMemo(() => Array.from(new Set(skills.map((s) => s.category))).sort(), [skills]);

  const counts = React.useMemo(
    () => ({
      all: skills.length,
      active: skills.filter((s) => s.status === "active").length,
      pending: skills.filter((s) => s.status === "pending").length,
      deprecated: skills.filter((s) => s.status === "deprecated").length,
    }),
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
      router.replace(qs ? `/admin/skill-taxonomy?${qs}` : "/admin/skill-taxonomy", { scroll: false });
    },
    [router, searchParams],
  );

  const onSort = React.useCallback(
    (key: SortKey) => {
      if (sort === key) setParam({ dir: dir === "asc" ? "desc" : "asc" });
      else setParam({ sort: key, dir: key === "holders" ? "desc" : "asc" });
    },
    [sort, dir, setParam],
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

  const sorted = React.useMemo(() => {
    const mult = dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let r = 0;
      switch (sort) {
        case "name":
          r = a.name.localeCompare(b.name);
          break;
        case "category":
          r = a.category.localeCompare(b.category);
          break;
        case "status":
          r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
          break;
        case "holders":
          r = a.holders - b.holders;
          break;
      }
      if (r === 0) r = a.name.localeCompare(b.name);
      return r * mult;
    });
  }, [filtered, sort, dir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const filtersActive = statusFilter !== "all" || categoryFilter !== "all" || Boolean(search.trim());

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Platform · Taxonomy"
        title="Skill taxonomy"
        subtitle="Canonical skills for competency matching, mentor routing, and contributor profiles."
        actions={
          <>
            <Link href="/admin/skill-taxonomy/merge" className={ghostBtnClass}>
              <GitMerge className="h-4 w-4" strokeWidth={2} aria-hidden />
              Merge
            </Link>
            <Link href="/admin/skill-taxonomy/new" className={primaryBtnClass} style={primaryStyle}>
              <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              New skill
            </Link>
          </>
        }
      />

      <GlassCard className="overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-white/55 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Filter</span>
            <div className="w-48">
              <AuroraSelect aria-label="Filter by status" size="sm" value={statusFilter} onChange={(e) => setParam({ status: e.target.value === "all" ? null : e.target.value })}>
                <option value="all">All statuses · {counts.all}</option>
                <option value="active">Active · {counts.active}</option>
                <option value="pending">Pending review · {counts.pending}</option>
                <option value="deprecated">Deprecated · {counts.deprecated}</option>
              </AuroraSelect>
            </div>
            <div className="w-44">
              <AuroraSelect aria-label="Filter by category" size="sm" value={categoryFilter} onChange={(e) => setParam({ category: e.target.value === "all" ? null : e.target.value })}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </AuroraSelect>
            </div>

            <div className="relative ml-auto w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search name, alias, ID…"
                style={GLASS_FIELD_STYLE}
                className="w-full h-9 pl-9 pr-8 rounded-lg backdrop-blur-md font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
              />
              {search && (
                <button type="button" onClick={() => setParam({ q: null })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground" aria-label="Clear search">
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <span className="font-body text-[12px] text-text-tertiary tabular-nums">
              {sorted.length} {sorted.length === 1 ? "skill" : "skills"}
              {filtersActive && (
                <button type="button" onClick={() => setParam({ status: null, category: null, q: null })} className="ml-2.5 font-semibold text-text-secondary hover:text-foreground">
                  Clear
                </button>
              )}
            </span>
          </div>
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel hasFilters={filtersActive} onClear={() => setParam({ status: null, category: null, q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-white/55">
                    <Th label="Skill" sortKey="name" sort={sort} dir={dir} onSort={onSort} className="pl-5 sm:pl-6" />
                    <Th label="Category" sortKey="category" sort={sort} dir={dir} onSort={onSort} />
                    <Th label="Status" sortKey="status" sort={sort} dir={dir} onSort={onSort} />
                    <Th label="Holders" sortKey="holders" sort={sort} dir={dir} onSort={onSort} align="right" className="pr-5 sm:pr-6" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((s) => (
                    <SkillTableRow key={s.id} skill={s} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-white/55">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button type="button" disabled={pageIdx === 1} onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors">
                    Previous
                  </button>
                  <span className="font-mono text-[10.5px] text-text-tertiary">{pageIdx}/{totalPages}</span>
                  <button type="button" disabled={pageIdx >= totalPages} onClick={() => setParam({ page: String(pageIdx + 1) })} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors">
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </GlassCard>
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
    <th className={cn("px-3 py-2.5 font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary", align === "right" ? "text-right" : "text-left", className)}>
      <button type="button" onClick={() => onSort(sortKey)} className={cn("inline-flex items-center gap-1 hover:text-foreground transition-colors", active && "text-foreground", align === "right" && "flex-row-reverse")}>
        {label}
        <Icon className={cn("h-3 w-3", active ? "text-[var(--c-violet-500)]" : "text-text-disabled")} strokeWidth={2.2} aria-hidden />
      </button>
    </th>
  );
}

function SkillTableRow({ skill: s }: { skill: MockSkill }) {
  const router = useRouter();
  const href = `/admin/skill-taxonomy/${s.id}`;
  const subline = s.aliases.length > 0 ? `aka ${s.aliases.join(", ")}` : s.createdBy ?? "";

  return (
    <tr onClick={() => router.push(href)} className="group border-b border-white/40 last:border-0 cursor-pointer hover:bg-white/55 transition-colors duration-fast">
      <td className="pl-5 sm:pl-6 pr-3 py-3.5">
        <Link href={href} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2.5 min-w-0">
          <span className="grid place-items-center h-8 w-8 rounded-lg shrink-0 text-text-tertiary border border-white/70 bg-white/55">
            <Tag className="h-4 w-4" strokeWidth={1.85} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[13.5px] font-semibold text-foreground truncate">{s.name}</span>
            {subline && <span className="block font-mono text-[10.5px] text-text-tertiary truncate">{subline}</span>}
          </span>
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone="neutral" dot={false}>{s.category}</Chip>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Chip>
      </td>
      <td className="pr-5 sm:pr-6 pl-3 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-[12.5px] tabular-nums text-foreground">{s.holders}</span>
          <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-secondary transition-colors shrink-0" strokeWidth={2} aria-hidden />
        </div>
      </td>
    </tr>
  );
}

function EmptyPanel({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-16 text-center">
      <span className="grid place-items-center h-12 w-12 mx-auto rounded-xl border border-white/70 bg-white/55 text-text-tertiary mb-3">
        <Tag className="h-6 w-6" strokeWidth={1.85} aria-hidden />
      </span>
      <p className="font-display text-[15px] font-semibold text-foreground">No skills found</p>
      <p className="mt-1 font-body text-[12.5px] text-text-tertiary max-w-sm mx-auto">
        {hasFilters ? "No skills match these filters." : "Add skills to the taxonomy or approve contributor suggestions."}
      </p>
      {hasFilters ? (
        <button type="button" onClick={onClear} className="mt-3 font-body text-[12.5px] font-semibold" style={{ color: "var(--color-ai-text)" }}>
          Clear filters
        </button>
      ) : (
        <Link href="/admin/skill-taxonomy/new" className={cn(primaryBtnClass, "mt-4 inline-flex")} style={primaryStyle}>
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          New skill
        </Link>
      )}
    </div>
  );
}
