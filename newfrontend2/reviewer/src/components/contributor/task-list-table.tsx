"use client";

import * as React from "react";
import Link from "next/link";
import {
  ContributorStatusBadge,
  deriveContributorStatus,
  statusPriority,
  type ContributorStatusLabel,
} from "./task-status-badge";
import type { ContributorTaskSummary } from "@/lib/api/contributor-tasks";

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function TaskListTable({ items }: { items: ContributorTaskSummary[] }) {
  // Spec §5.D.1 decision heuristic: sticky priority order
  const sorted = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const aLabel = deriveContributorStatus(a.status, a.latestSubmission?.status);
      const bLabel = deriveContributorStatus(b.status, b.latestSubmission?.status);
      const aPrio = statusPriority(aLabel);
      const bPrio = statusPriority(bLabel);
      if (aPrio !== bPrio) return aPrio - bPrio;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [items]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle px-6 py-12 text-center">
        <p className="font-body text-[13.5px] font-semibold text-foreground">
          No tasks in your queue
        </p>
        <p className="mt-1 font-body text-[12.5px] text-text-tertiary">
          New work will appear here when a project lead assigns it to you.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-stroke-subtle">
      <table className="w-full border-collapse">
        <thead className="bg-surface-muted/30">
          <tr className="text-left font-body text-[11px] uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 font-semibold">Task</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Project</th>
            <th className="px-4 py-3 font-semibold">Effort</th>
            <th className="px-4 py-3 font-semibold">Last update</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => (
            <tr
              key={t.id}
              className="border-t border-stroke-subtle hover:bg-surface-muted/40 transition-colors"
            >
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/contributor/tasks/${t.id}`}
                  className="font-body text-[13px] font-semibold text-foreground hover:underline"
                >
                  {t.externalKey ? `${t.externalKey} · ` : ""}
                  {t.title}
                </Link>
                {t.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.requiredSkills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="inline-block rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] text-teal-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <ContributorStatusBadge
                  taskStatus={t.status}
                  submissionStatus={t.latestSubmission?.status}
                />
              </td>
              <td className="px-4 py-3 align-top">
                <div className="font-body text-[12.5px] text-foreground">
                  {t.sow?.title ?? "—"}
                </div>
                <div className="font-body text-[11px] text-text-tertiary">
                  {t.sow?.tenantName ?? ""}
                </div>
              </td>
              <td className="px-4 py-3 align-top font-body text-[12.5px] text-foreground">
                {t.estimatedHours ? `${t.estimatedHours}h` : "—"}
                {t.agreedRatePerHour && t.agreedCurrency && (
                  <div className="font-body text-[11px] text-text-tertiary">
                    {t.agreedCurrency} {t.agreedRatePerHour}/hr
                  </div>
                )}
              </td>
              <td className="px-4 py-3 align-top font-body text-[12px] text-text-tertiary">
                {formatRelative(t.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { ContributorStatusLabel };
