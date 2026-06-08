"use client";

/**
 * Rubric template library — aligned with skill taxonomy + mentors list UX.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, Plus, Search, X } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { getRubricFeedback } from "@/lib/admin/mocks/rubrics-service";
import { useAdminRubricsList } from "@/lib/hooks/use-admin-rubrics";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockRubricTemplate } from "@/mocks/admin/rubrics";
import { cn } from "@/lib/utils/cn";

type AppliesFilter = "all" | MockRubricTemplate["appliesTo"];

const APPLIES_ORDER: MockRubricTemplate["appliesTo"][] = [
  "Code",
  "Design",
  "Data",
  "Marketing",
  "Documentation",
];

const APPLIES_TABS: Array<{ key: AppliesFilter; label: string }> = [
  { key: "all", label: "All" },
  ...APPLIES_ORDER.map((key) => ({ key, label: key })),
];

const APPLIES_LABEL: Record<MockRubricTemplate["appliesTo"], string> = {
  Code: "Code / engineering",
  Design: "Design",
  Data: "Data",
  Marketing: "Marketing",
  Documentation: "Documentation",
};

const PREVIEW_PER_GROUP = 3;
const ROWS_PER_PAGE = 10;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortTemplates(items: MockRubricTemplate[]): MockRubricTemplate[] {
  return [...items].sort((a, b) => {
    const rank = APPLIES_ORDER.indexOf(a.appliesTo) - APPLIES_ORDER.indexOf(b.appliesTo);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });
}

function groupByApplies(items: MockRubricTemplate[]) {
  return APPLIES_ORDER.map((appliesTo) => ({
    appliesTo,
    label: APPLIES_LABEL[appliesTo],
    rows: sortTemplates(items.filter((t) => t.appliesTo === appliesTo)),
  })).filter((g) => g.rows.length > 0);
}

export function RubricTemplatesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templates = useAdminRubricsList();
  const canEdit = useAdminSectionCanEdit("rubricTemplates");

  const appliesFilter: AppliesFilter =
    (searchParams.get("applies") as AppliesFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const counts = React.useMemo(() => {
    const byApplies = Object.fromEntries(
      APPLIES_ORDER.map((key) => [
        key,
        templates.filter((t) => t.appliesTo === key).length,
      ]),
    ) as Record<MockRubricTemplate["appliesTo"], number>;

    return {
      all: templates.length,
      ...byApplies,
      criteria: templates.reduce((n, t) => n + t.criteria.length, 0),
      tenants: templates.reduce((n, t) => n + t.usedByTenants, 0),
      feedback: templates.reduce((n, t) => n + getRubricFeedback(t.id).length, 0),
    };
  }, [templates]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "" || v === "all") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/rubric-templates?${qs}` : "/admin/rubric-templates", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (appliesFilter !== "all" && t.appliesTo !== appliesFilter) return false;
      if (needle) {
        const hay = [t.name, t.id, t.appliesTo].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [templates, appliesFilter, search]);

  const sorted = React.useMemo(() => sortTemplates(filtered), [filtered]);
  const showGrouped = appliesFilter === "all" && !search.trim();
  const groups = showGrouped ? groupByApplies(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = showGrouped
    ? sorted
    : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const listTitle =
    appliesFilter === "all" ? "Template library" : APPLIES_LABEL[appliesFilter];
  const listDescription =
    sorted.length === 0
      ? "No templates match"
      : showGrouped
        ? `${sorted.length} template${sorted.length === 1 ? "" : "s"} · grouped by task type`
        : `${sorted.length} template${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Review
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Rubric templates
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Platform defaults for mentor review. Enterprises copy and customize for their
            deliverable types.
          </p>
        </div>
        {canEdit && (
          <Link href="/admin/rubric-templates/new" className={primaryBtnCls}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            New template
          </Link>
        )}
      </header>

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
            View-only access
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            Rubric edits require Platform Admin or Mentor Program Manager.
          </p>
        </div>
      )}

      <DashboardSection title="Library summary" description="Templates across task types">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Templates" value={String(counts.all)} highlight={counts.all > 0} />
          <SummaryStat label="Criteria total" value={String(counts.criteria)} />
          <SummaryStat label="Tenant adoption" value={String(counts.tenants)} />
          <SummaryStat label="Feedback snippets" value={String(counts.feedback)} />
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
                placeholder="Search name, id…"
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

          <nav aria-label="Filter by task type" className="flex flex-wrap gap-x-1 -mb-px pb-2">
            {APPLIES_TABS.map((tab) => {
              const active = appliesFilter === tab.key;
              const count =
                tab.key === "all" ? counts.all : counts[tab.key as MockRubricTemplate["appliesTo"]];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ applies: tab.key === "all" ? null : tab.key })}
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
            hasQuery={Boolean(search.trim()) || appliesFilter !== "all"}
            canEdit={canEdit}
            onClear={() => setParam({ applies: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <TemplateGroup
                key={group.appliesTo}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/admin/rubric-templates?applies=${group.appliesTo}`}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((t) => (
                <li key={t.id}>
                  <TemplateRow template={t} />
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

function TemplateGroup({
  label,
  rows,
  previewLimit,
  filterHref,
}: {
  label: string;
  rows: MockRubricTemplate[];
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
        {preview.map((t) => (
          <li key={t.id} className="border-t border-stroke-subtle">
            <TemplateRow template={t} compact />
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

function TemplateRow({
  template: t,
  compact,
}: {
  template: MockRubricTemplate;
  compact?: boolean;
}) {
  const feedbackCount = getRubricFeedback(t.id).length;
  const totalWeight = t.criteria.reduce((n, c) => n + c.weight, 0);

  return (
    <Link
      href={`/admin/rubric-templates/${t.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        compact ? "py-2.5 min-h-[44px]" : "py-3 min-h-[52px]",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-body text-[13px] font-medium text-foreground truncate">
            {t.name}
          </span>
          <AppliesBadge appliesTo={t.appliesTo} />
        </span>
        <span className="font-body text-[11.5px] text-text-tertiary block mt-0.5 truncate">
          v{t.version} · updated {fmtDate(t.updatedAt)}
          <span aria-hidden className="opacity-50 mx-1.5">·</span>
          {t.criteria.length} criteria · {totalWeight}% weight
          {feedbackCount > 0 && (
            <>
              <span aria-hidden className="opacity-50 mx-1.5">·</span>
              {feedbackCount} feedback snippet{feedbackCount === 1 ? "" : "s"}
            </>
          )}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="font-display text-[18px] font-semibold tabular-nums text-foreground leading-none">
          {t.usedByTenants}
        </span>
        <span className="block font-body text-[10.5px] text-text-tertiary mt-0.5">
          tenant{t.usedByTenants === 1 ? "" : "s"}
        </span>
      </span>
    </Link>
  );
}

function AppliesBadge({ appliesTo }: { appliesTo: MockRubricTemplate["appliesTo"] }) {
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold bg-bg-subtle text-text-secondary border border-stroke-subtle">
      {appliesTo}
    </span>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyPanel({
  hasQuery,
  canEdit,
  onClear,
}: {
  hasQuery: boolean;
  canEdit: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-body text-[13.5px] font-semibold text-foreground">No templates found</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        {hasQuery
          ? "Try clearing filters or adjusting your search."
          : "Create a platform default rubric for a deliverable type."}
      </p>
      {hasQuery ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 font-body text-[12px] font-semibold text-text-link"
        >
          Clear filters
        </button>
      ) : canEdit ? (
        <Link
          href="/admin/rubric-templates/new"
          className="mt-3 inline-block font-body text-[12px] font-semibold text-text-link"
        >
          New template →
        </Link>
      ) : null}
    </div>
  );
}

const searchCls = cn(
  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
  "hover:bg-brand-hover transition-colors duration-fast",
);
