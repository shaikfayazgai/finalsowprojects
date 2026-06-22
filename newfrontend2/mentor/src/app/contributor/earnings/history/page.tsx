"use client";

/**
 * Earnings history — spec doc 01 §5.L.2.
 * Paginated table backed by /api/mock/contributor/payouts.
 */

import * as React from "react";
import { AlertCircle } from "lucide-react";
import {
  fetchPayouts,
  ContributorApiError,
  type PayoutListResponse,
} from "@/lib/api/contributor-mock";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 25;

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusTone(s: string): string {
  switch (s) {
    case "paid": return "bg-success-subtle text-success-text";
    case "pending":
    case "eligible": return "bg-warning-subtle text-warning-text";
    case "failed":
    case "reversed": return "bg-error-subtle text-error-text";
    default: return "bg-bg-subtle text-text-secondary";
  }
}

export default function ContributorEarningsHistoryPage() {
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<PayoutListResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    setError(null);
    fetchPayouts({ page, limit: ROWS_PER_PAGE }, c.signal)
      .then(setData)
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof ContributorApiError ? err.message : "Could not load history.");
      });
    return () => c.abort();
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / ROWS_PER_PAGE)) : 1;
  const pageIdx = Math.min(page, totalPages);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Earnings history
        </h1>
      </header>

      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
        </div>
      ) : !data ? (
        <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 bg-bg-subtle border-b border-stroke-subtle">
            <div className="h-3 w-32 rounded bg-stroke animate-pulse" />
          </div>
          <ul>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="border-t border-stroke-subtle px-4 py-3 flex gap-4">
                <div className="h-3 w-40 rounded bg-bg-subtle animate-pulse" />
                <div className="h-3 w-24 rounded bg-bg-subtle animate-pulse ml-auto" />
                <div className="h-4 w-16 rounded-full bg-bg-subtle animate-pulse" />
              </li>
            ))}
          </ul>
        </section>
      ) : data.items.length === 0 ? (
        <div className="rounded-lg border border-stroke bg-surface shadow-xs px-4 py-10 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">No history yet</p>
        </div>
      ) : (
        <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Earnings history">
              <thead className="bg-bg-subtle">
                <tr>
                  <Th>Task</Th>
                  <Th>Project</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Reference</Th>
                  <Th align="right">Date</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="border-t border-stroke-subtle hover:bg-bg-subtle transition-colors duration-fast">
                    <td className="px-4 py-2.5 font-body text-[13px] text-foreground truncate max-w-[280px]">{r.taskTitle}</td>
                    <td className="px-4 py-2.5 font-body text-[12px] text-text-secondary truncate max-w-[160px]">{r.project}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono text-[12px] text-foreground tabular-nums">{fmtINR(r.amountMinor)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full font-body text-[10.5px] font-semibold capitalize", statusTone(r.status))}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-text-tertiary tabular-nums">{r.externalRef ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono text-[11px] text-text-tertiary tabular-nums">{fmtDate(r.paidAt ?? r.eligibleAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-stroke-subtle bg-bg-subtle">
            <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
              {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, data.total)} of {data.total}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageIdx === 1} className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-bg-subtle disabled:text-text-disabled">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageIdx >= totalPages} className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-bg-subtle disabled:text-text-disabled">Next</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      scope="col"
      className={cn(
        "font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary px-4 py-2.5",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}
