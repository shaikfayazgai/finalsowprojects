"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{ borderTop: "1px solid var(--border-hair)" }}
    >
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>Rows per page</span>
        <div className="flex items-center gap-1">
          {pageSizeOptions.map((n) => (
            <button
              key={n}
              onClick={() => { onPageSizeChange(n); onPageChange(1); }}
              className="w-8 h-7 rounded-md text-[11px] font-medium transition-colors"
              style={{
                background: pageSize === n ? "var(--color-brown-500)" : "transparent",
                color: pageSize === n ? "#fff" : "var(--ink-muted)",
                border: pageSize === n ? "none" : "1px solid var(--border-soft)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Page info + controls */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
          {from}–{to} of {totalItems}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}
          >
            <ChevronLeft size={13} />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`el-${i}`} className="w-7 text-center text-[11px]" style={{ color: "var(--ink-faint)" }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className="w-7 h-7 rounded-lg text-[11px] font-medium transition-colors"
                style={{
                  background: currentPage === p ? "var(--color-brown-500)" : "transparent",
                  color: currentPage === p ? "#fff" : "var(--ink-muted)",
                  border: currentPage === p ? "none" : "1px solid var(--border-soft)",
                }}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ border: "1px solid var(--border-soft)", color: "var(--ink-muted)" }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
