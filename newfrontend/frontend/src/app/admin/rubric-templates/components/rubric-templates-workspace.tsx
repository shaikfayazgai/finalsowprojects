"use client";

/**
 * Rubric template library — platform defaults for mentor review.
 *
 * Workflow:
 *   1. Browse by deliverable type → open template
 *   2. Enterprise copies and customizes from these defaults
 *   3. Platform admin maintains criteria and feedback snippets
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, Plus, Search, X } from "lucide-react";
import { getRubricFeedback } from "@/lib/admin/mocks/rubrics-service";
import { useAdminRubricsList } from "@/lib/hooks/use-admin-rubrics";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { MockRubricTemplate } from "@/mocks/admin/rubrics";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryStyle } from "../../_shell/aurora-ui";
import { TenantEmptyState } from "../../tenants/components/tenant-empty-state";
import { NewRubricModal } from "./new-rubric-modal";

type AppliesFilter = "all" | MockRubricTemplate["appliesTo"];

const APPLIES_ORDER: MockRubricTemplate["appliesTo"][] = ["Code", "Design", "Data", "Marketing", "Documentation"];

const FILTER_TABS: Array<{ key: AppliesFilter; label: string }> = [
  { key: "all", label: "All" },
  ...APPLIES_ORDER.map((key) => ({ key, label: key })),
];

const ROWS_PER_PAGE = 12;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function RubricTemplatesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templates = useAdminRubricsList();
  const canEdit = useAdminSectionCanEdit("rubricTemplates");
  const [createOpen, setCreateOpen] = React.useState(false);

  const appliesFilter: AppliesFilter = (searchParams.get("applies") as AppliesFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const counts = React.useMemo(() => {
    const byApplies = Object.fromEntries(
      APPLIES_ORDER.map((key) => [key, templates.filter((t) => t.appliesTo === key).length]),
    ) as Record<MockRubricTemplate["appliesTo"], number>;
    return { all: templates.length, ...byApplies };
  }, [templates]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/rubric-templates?${qs}` : "/admin/rubric-templates", { scroll: false });
    },
    [router, searchParams],
  );

  React.useEffect(() => {
    if (searchParams.get("new") === "1" && canEdit) {
      setCreateOpen(true);
      setParam({ new: null });
    }
  }, [searchParams, canEdit, setParam]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return templates
      .filter((t) => appliesFilter === "all" || t.appliesTo === appliesFilter)
      .filter((t) => {
        if (!needle) return true;
        const hay = [t.name, t.id, t.appliesTo].join(" ").toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        const appliesDiff = APPLIES_ORDER.indexOf(a.appliesTo) - APPLIES_ORDER.indexOf(b.appliesTo);
        if (appliesDiff !== 0) return appliesDiff;
        return a.name.localeCompare(b.name);
      });
  }, [templates, appliesFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
            Rubric templates
          </h1>
          <p className="mt-1.5 font-body text-[14px] text-text-secondary">
            Platform defaults for mentor review — enterprises copy and customize per deliverable type.
          </p>
        </div>
        {canEdit ? <NewTemplateButton onClick={() => setCreateOpen(true)} /> : null}
      </header>

      {canEdit ? <NewRubricModal open={createOpen} onClose={() => setCreateOpen(false)} /> : null}

      {!canEdit ? (
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3">
          <p className="font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">View-only access.</span> Rubric edits require Platform
            Admin or Mentor Program Manager.
          </p>
        </div>
      ) : null}

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle lg:flex-row lg:items-center lg:justify-between">
          <AppliesTabs
            value={appliesFilter}
            counts={counts}
            onChange={(key) => setParam({ applies: key === "all" ? null : key })}
          />

          <div className="relative w-full sm:w-56 shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setParam({ q: e.target.value })}
              placeholder="Search name or ID…"
              className={cn(
                "w-full h-9 pl-9 pr-8 rounded-lg border border-stroke-subtle bg-surface",
                "font-body text-[13px] text-foreground placeholder:text-text-disabled",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setParam({ q: null })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            filter={appliesFilter}
            hasSearch={Boolean(search.trim())}
            canEdit={canEdit}
            onClear={() => setParam({ applies: null, q: null })}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      Template
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      Applies to
                    </th>
                    <th className="px-3 py-2.5 text-right font-body text-[11px] font-medium text-text-tertiary">
                      Criteria
                    </th>
                    <th className="px-3 py-2.5 text-right font-body text-[11px] font-medium text-text-tertiary">
                      Tenants
                    </th>
                    <th className="px-4 sm:px-5 py-2.5 text-right font-body text-[11px] font-medium text-text-tertiary">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <TemplateRow key={t.id} template={t} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, filtered.length)} of{" "}
                  {filtered.length}
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
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {pageIdx}/{totalPages}
                  </span>
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

function NewTemplateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg shrink-0",
        "font-body text-[13px] font-semibold text-on-brand hover:opacity-90 transition-opacity",
      )}
      style={primaryStyle}
    >
      <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      New template
    </button>
  );
}

function AppliesTabs({
  value,
  counts,
  onChange,
}: {
  value: AppliesFilter;
  counts: Record<AppliesFilter, number>;
  onChange: (key: AppliesFilter) => void;
}) {
  return (
    <div role="tablist" aria-label="Filter by deliverable type" className="flex flex-wrap gap-1">
      {FILTER_TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg font-body text-[13px] font-medium transition-colors",
              active
                ? "admin-tab-on"
                : "text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                active ? "text-text-tertiary" : "text-text-disabled",
              )}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TemplateRow({ template: t }: { template: MockRubricTemplate }) {
  const router = useRouter();
  const href = `/admin/rubric-templates/${t.id}`;
  const feedbackCount = getRubricFeedback(t.id).length;

  return (
    <tr
      onClick={() => router.push(href)}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="block min-w-0 max-w-[280px]"
        >
          <span className="block font-body text-[13.5px] font-semibold text-foreground truncate group-hover:text-text-link">
            {t.name}
          </span>
          <span className="block font-mono text-[11px] text-text-tertiary truncate">
            v{t.version}
            {feedbackCount > 0 ? ` · ${feedbackCount} feedback snippet${feedbackCount === 1 ? "" : "s"}` : ""}
          </span>
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <span className="inline-flex h-[22px] items-center px-2.5 rounded-full bg-bg-subtle font-body text-[11px] font-medium text-text-secondary">
          {t.appliesTo}
        </span>
      </td>
      <td className="px-3 py-3.5 text-right font-mono text-[13px] tabular-nums text-foreground">{t.criteria.length}</td>
      <td className="px-3 py-3.5 text-right font-mono text-[13px] tabular-nums text-text-secondary">{t.usedByTenants}</td>
      <td className="px-4 sm:px-5 py-3.5 text-right font-body text-[12px] text-text-secondary tabular-nums whitespace-nowrap" suppressHydrationWarning>
        {fmtDate(t.updatedAt)}
      </td>
    </tr>
  );
}

function EmptyState({
  filter,
  hasSearch,
  canEdit,
  onClear,
  onCreate,
}: {
  filter: AppliesFilter;
  hasSearch: boolean;
  canEdit: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <TenantEmptyState
      icon={ClipboardCheck}
      title="No templates found"
      description={
        hasSearch || filter !== "all"
          ? "Nothing matches. Clear filters or try a different search."
          : "Create a platform default rubric for a deliverable type."
      }
      action={
        hasSearch || filter !== "all" ? (
          <button
            type="button"
            onClick={onClear}
            className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
          >
            Clear filters
          </button>
        ) : canEdit ? (
          <NewTemplateButton onClick={onCreate} />
        ) : null
      }
    />
  );
}
