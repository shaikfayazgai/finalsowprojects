"use client";

/**
 * Mentor · Assigned SOWs — the SOWs this mentor is responsible for, visible as
 * soon as they're assigned. Shows the lifecycle status and expands into the SOW
 * files + decomposition task statuses. No commercial data.
 */

import * as React from "react";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { fetchAssignedSows, MentorApiError, type AssignedSow } from "@/lib/api/mentor-api";

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-bg-subtle text-text-secondary" },
  approval: { label: "Waiting for approvals", tone: "bg-warning-subtle text-warning-text" },
  pending: { label: "Waiting for approvals", tone: "bg-warning-subtle text-warning-text" },
  approved: { label: "Approved", tone: "bg-success-subtle text-success-text" },
  active: { label: "In delivery", tone: "bg-success-subtle text-success-text" },
  rejected: { label: "Rejected", tone: "bg-error-subtle text-error-text" },
};

function StatusChip({ status }: { status?: string | null }) {
  const meta = STATUS_LABEL[(status || "").toLowerCase()] ?? { label: status || "—", tone: "bg-bg-subtle text-text-secondary" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

export default function MentorAssignedSowsPage() {
  const [sows, setSows] = React.useState<AssignedSow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchAssignedSows(c.signal)
      .then((d) => setSows(d.sows))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof MentorApiError ? err.message : "Could not load assigned SOWs.");
      });
    return () => c.abort();
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="pb-1">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Mentor · SOWs</p>
        <h1 className="font-display text-[22px] font-bold text-foreground tracking-[-0.025em] leading-none">Assigned SOWs</h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
          SOWs you mentor — scope, files and decomposition status. No commercial details.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 text-sm text-error-text">{error}</p>
      )}

      {!sows && !error && <div className="h-24 rounded-xl bg-bg-subtle animate-pulse" />}

      {sows && sows.length === 0 && (
        <div className="rounded-xl border border-stroke bg-surface p-8 text-center">
          <FileText className="h-6 w-6 mx-auto mb-2 text-text-tertiary" aria-hidden />
          <p className="font-body text-[13px] text-text-secondary">No SOWs assigned to you yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {sows?.map((s) => (
          <Link
            key={s.sowId}
            href={`/mentor/sows/${encodeURIComponent(s.sowId)}`}
            className="flex items-center gap-3 rounded-xl border border-stroke bg-surface px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <FileText className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-body text-[13.5px] font-semibold text-foreground truncate">{s.title}</p>
              <p className="font-body text-[11.5px] text-text-tertiary truncate">{s.sowId}</p>
            </div>
            <StatusChip status={s.status} />
            <ChevronRight className="h-4 w-4 text-text-tertiary" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
