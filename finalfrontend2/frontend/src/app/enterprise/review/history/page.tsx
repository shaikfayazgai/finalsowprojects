"use client";

/**
 * Enterprise acceptance history — past accept / rework decisions.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, ChevronRight } from "lucide-react";
import { useReviewHistory } from "@/lib/hooks/use-enterprise-review";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { Chip } from "@/app/admin/_shell/aurora-ui";

type Filter = "all" | "accept" | "rework";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

export default function EnterpriseReviewHistoryPage() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const { data, isLoading, error } = useReviewHistory({ limit: 100 });

  const items = data?.items ?? [];
  const rows = items.filter((d) => filter === "all" || d.decision === filter);
  const counts = {
    all: items.length,
    accept: items.filter((d) => d.decision === "accept").length,
    rework: items.filter((d) => d.decision === "rework").length,
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/review"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-white/50 transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>Acceptance</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">History</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Delivery · Acceptance
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Decision history
        </h1>
        <p className="mt-1 font-body text-[13px] text-text-secondary max-w-2xl">
          Past enterprise acceptance decisions. Accepted deliverables trigger billing eligibility.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof Error ? error.message : "Could not load history."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip selected={filter === "all"} onClick={() => setFilter("all")}>
          All {counts.all}
        </FilterChip>
        <FilterChip selected={filter === "accept"} onClick={() => setFilter("accept")}>
          Accepted {counts.accept}
        </FilterChip>
        <FilterChip selected={filter === "rework"} onClick={() => setFilter("rework")}>
          Rework {counts.rework}
        </FilterChip>
      </div>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        {isLoading ? (
          <ul className="divide-y divide-white/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-2/3 rounded mb-2" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center font-body text-[13px] text-text-tertiary">
            No decisions match this filter.
          </p>
        ) : (
          <ul className="divide-y divide-white/60">
            {rows.map((row) => (
              <li key={row.decisionId}>
                <Link
                  href={`/enterprise/review/${row.submissionId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-fast hover:bg-white/50 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-semibold text-foreground truncate group-hover:text-foreground">
                      {row.taskTitle}
                    </p>
                    <p className="font-body text-[11.5px] text-text-tertiary mt-0.5">
                      {row.contributorName}
                      <span aria-hidden className="opacity-50 mx-1">·</span>
                      {fmtDate(row.decidedAt)}
                    </p>
                  </div>
                  <Chip tone={row.decision === "accept" ? "success" : "warning"} dot={false} className="shrink-0">
                    {row.decision === "accept" ? "Accepted" : "Rework"}
                  </Chip>
                  <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selected ? { backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 18px -10px rgba(108,76,230,0.6)" } : undefined}
      className={cn(
        "h-8 px-3 rounded-xl font-body text-[12px] font-semibold transition-colors duration-fast",
        selected
          ? "text-white"
          : "border border-white/70 bg-white/55 backdrop-blur text-text-secondary hover:bg-white/75",
      )}
    >
      {children}
    </button>
  );
}
