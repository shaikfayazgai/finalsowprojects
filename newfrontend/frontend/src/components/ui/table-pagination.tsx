"use client";

/**
 * V2 Table pagination — matches Profile / Settings / Attention queue tokens.
 *
 * Defaults: pageSize 12, options 12 / 25 / 50. Hides when totalItems is 0.
 * Active page/page-size buttons use the brand fill style consistent with
 * other filter pills in the portal.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  /** Hide the page-size selector for compact contexts. */
  hidePageSize?: boolean;
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 25, 50],
  hidePageSize,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Build sparse page list: first · last · current ± 1, with "…" gaps
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
    )
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40">
      {/* Rows per page */}
      {!hidePageSize ? (
        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] text-text-tertiary">
            Rows per page
          </span>
          <div className="flex items-center gap-1">
            {pageSizeOptions.map((n) => {
              const isActive = pageSize === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    onPageSizeChange(n);
                    onPageChange(1);
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-md",
                    "font-body text-[11.5px] font-semibold tabular-nums",
                    "transition-colors duration-fast ease-standard",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                    isActive
                      ? "bg-[var(--color-brand)] text-text-inverse"
                      : "bg-surface ring-1 ring-stroke-subtle text-text-secondary hover:bg-[var(--state-hover)] hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* Page info + controls */}
      <div className="flex items-center gap-3">
        <span className="font-body text-[11px] text-text-tertiary tabular-nums">
          {from}–{to} of {totalItems}
        </span>

        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className={cn(
              "inline-flex items-center justify-center h-7 w-7 rounded-md",
              "bg-surface ring-1 ring-stroke-subtle text-text-secondary",
              "hover:bg-[var(--state-hover)] hover:text-foreground",
              "transition-colors duration-fast ease-standard",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface disabled:hover:text-text-secondary",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </button>

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`el-${i}`}
                aria-hidden
                className="inline-flex items-center justify-center h-7 w-7 font-body text-[11px] text-text-tertiary tabular-nums"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                aria-current={currentPage === p ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  "inline-flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded-md",
                  "font-body text-[11.5px] font-semibold tabular-nums",
                  "transition-colors duration-fast ease-standard",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                  currentPage === p
                    ? "bg-[var(--color-brand)] text-text-inverse"
                    : "bg-surface ring-1 ring-stroke-subtle text-text-secondary hover:bg-[var(--state-hover)] hover:text-foreground",
                )}
              >
                {p}
              </button>
            ),
          )}

          {/* Next */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className={cn(
              "inline-flex items-center justify-center h-7 w-7 rounded-md",
              "bg-surface ring-1 ring-stroke-subtle text-text-secondary",
              "hover:bg-[var(--state-hover)] hover:text-foreground",
              "transition-colors duration-fast ease-standard",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface disabled:hover:text-text-secondary",
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Hook helper ─────────────────────── */

/**
 * Convenience hook for client-side pagination. Returns the sliced rows
 * and the props to pass to <TablePagination>. Resets to page 1 whenever
 * the row count drops below the current offset (e.g. after filtering).
 */
export function usePagination<T>(
  rows: T[],
  initialPageSize = 12,
): {
  page: number;
  pageSize: number;
  pagedRows: T[];
  paginationProps: Omit<TablePaginationProps, "onPageChange" | "onPageSizeChange"> & {
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
  };
} {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  // Clamp page when rows shrink (e.g. filter)
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRows = React.useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  return {
    page,
    pageSize,
    pagedRows,
    paginationProps: {
      currentPage: page,
      totalPages,
      pageSize,
      totalItems: rows.length,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    },
  };
}
