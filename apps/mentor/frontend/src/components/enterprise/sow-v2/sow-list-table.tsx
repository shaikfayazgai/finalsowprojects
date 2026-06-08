"use client";

import * as React from "react";
import Link from "next/link";
import type { SowSummary } from "@/lib/sow/types";
import { SowStageBadge, SowStatusBadge } from "./sow-status-badge";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SowListTable({ items }: { items: SowSummary[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle px-6 py-12 text-center">
        <p className="font-body text-[13.5px] font-semibold text-foreground">
          No SOWs in scope
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
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Stage</th>
            <th className="px-4 py-3 font-semibold">Version</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((sow) => (
            <tr
              key={sow.id}
              className="border-t border-stroke-subtle hover:bg-surface-muted/40 transition-colors"
            >
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/enterprise/sow/v2/${sow.id}`}
                  className="font-body text-[13px] font-semibold text-foreground hover:underline"
                >
                  {sow.title}
                </Link>
                <p className="mt-0.5 font-mono text-[11px] text-text-tertiary">
                  {sow.id}
                </p>
              </td>
              <td className="px-4 py-3 align-top">
                <SowStatusBadge status={sow.status} />
              </td>
              <td className="px-4 py-3 align-top">
                <SowStageBadge stage={sow.stage} />
              </td>
              <td className="px-4 py-3 align-top font-body text-[12.5px] text-foreground">
                v{sow.activeVersion}
              </td>
              <td className="px-4 py-3 align-top font-body text-[12px] text-text-tertiary">
                {formatDate(sow.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
