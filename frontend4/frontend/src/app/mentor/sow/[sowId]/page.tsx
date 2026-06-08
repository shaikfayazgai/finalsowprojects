"use client";

/**
 * Mentor · SOW detail — the decomposed tasks and their statuses for a SOW
 * assigned to this mentor. No payout/cost fields (mentors see work + state).
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, FileText } from "lucide-react";
import {
  getMentorSowTasks,
  fetchMentorAssignedSows,
  type MentorSowTask,
  type MentorAssignedSow,
} from "@/lib/api/mentor";
import {
  MentorPage,
  MentorPageHeader,
  MentorBanner,
} from "@/app/mentor/_components/mentor-ui";
import { cn } from "@/lib/utils/cn";

const STATUS_TONE: Record<string, string> = {
  completed: "bg-success-subtle text-success-text",
  accepted: "bg-success-subtle text-success-text",
  in_progress: "bg-info-subtle text-info-text",
  in_review: "bg-info-subtle text-info-text",
  assigned: "bg-brand-subtle text-brand-subtle-text",
  published: "bg-bg-subtle text-text-secondary",
  pending: "bg-warning-subtle text-warning-text",
};

export default function MentorSowDetailPage() {
  const params = useParams<{ sowId: string }>();
  const sowId = params.sowId;

  const [tasks, setTasks] = React.useState<MentorSowTask[] | null>(null);
  const [sow, setSow] = React.useState<MentorAssignedSow | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getMentorSowTasks(sowId)
      .then((t) => { if (!cancelled) setTasks(t); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load SOW tasks.");
      });
    // Resolve the SOW title/owner from the assigned-SOWs list.
    fetchMentorAssignedSows()
      .then((list) => { if (!cancelled) setSow(list.find((s) => s.sowId === sowId) ?? null); })
      .catch(() => { /* title is supplementary */ });
    return () => { cancelled = true; };
  }, [sowId]);

  const done = tasks?.filter((t) => t.status === "completed" || t.status === "accepted").length ?? 0;
  const total = tasks?.length ?? 0;

  return (
    <MentorPage className="space-y-5">
      <Link
        href="/mentor/queue"
        className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Back to queue
      </Link>

      <MentorPageHeader
        title={sow?.title || sowId}
        subtitle={
          sow?.ownerEmail
            ? `Assigned SOW · from ${sow.ownerEmail}${total ? ` · ${done}/${total} tasks done` : ""}`
            : "Assigned SOW"
        }
      />

      {error && (
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} />}>
          {error}
        </MentorBanner>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Tasks {total > 0 && <span className="text-text-tertiary">({total})</span>}
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Decomposed deliverables and their current status. Contributor work updates appear here as it progresses.
          </p>
        </div>

        {tasks === null && !error ? (
          <div className="p-5 font-body text-[12.5px] text-text-tertiary">Loading tasks…</div>
        ) : total === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={1.5} aria-hidden />
            <p className="font-body text-[13px] font-semibold text-foreground">Not decomposed yet</p>
            <p className="mt-1 font-body text-[12px] text-text-tertiary">
              The enterprise hasn&apos;t broken this SOW into tasks yet. They&apos;ll appear here once decomposition runs.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stroke-subtle">
            {tasks!.map((t) => (
              <li key={t.id} className="px-5 py-3 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[13px] font-medium text-foreground">{t.title}</p>
                  <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                    {t.assignee && t.assignee !== "Unassigned" ? `Assignee: ${t.assignee}` : "Unassigned"}
                    {t.milestone ? ` · ${t.milestone}` : ""}
                    {t.effortHours ? ` · ${t.effortHours}h` : ""}
                    {t.skills.length ? ` · ${t.skills.join(", ")}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-body text-[10.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
                    STATUS_TONE[t.status] ?? "bg-bg-subtle text-text-secondary",
                  )}
                >
                  {t.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MentorPage>
  );
}
