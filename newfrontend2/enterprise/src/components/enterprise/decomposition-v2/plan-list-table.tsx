"use client";

import * as React from "react";
import Link from "next/link";
import type { PlanSummary } from "@/lib/decomposition/types";
import { PlanStatusBadge } from "./plan-status-badge";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PlanListTable({ items }: { items: PlanSummary[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle px-6 py-12 text-center">
        <p className="font-body text-[13.5px] font-semibold text-foreground">
          No plans in scope
        </p>
        <p className="mt-1 font-body text-[12.5px] text-text-tertiary">
          Filters returned no rows for this tenant.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-stroke-subtle">
      <table className="w-full border-collapse">
        <thead className="bg-surface-muted/30">
          <tr className="text-left font-body text-[11px] uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 font-semibold">SOW + Version</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Summary</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              className="border-t border-stroke-subtle hover:bg-surface-muted/40 transition-colors"
            >
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/enterprise/decomposition/v2/${p.id}`}
                  className="font-body text-[13px] font-semibold text-foreground hover:underline"
                >
                  Plan v{p.version}
                </Link>
                <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                  SOW {p.sowId}
                </p>
              </td>
              <td className="px-4 py-3 align-top">
                <PlanStatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 align-top font-body text-[12.5px] text-text-secondary max-w-md truncate">
                {p.summary ?? "—"}
              </td>
              <td className="px-4 py-3 align-top font-body text-[12px] text-text-tertiary">
                {formatDate(p.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
