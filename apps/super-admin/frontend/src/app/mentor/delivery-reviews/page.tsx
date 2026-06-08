"use client";

/**
 * Mentor gate — quality review of submitted SOW-flow tasks. The mentor (assigned
 * by Glimmora) approves to advance to the enterprise reviewer, or sends back for
 * a revision. Reads the delivery-task store (real project taskIds).
 */

import * as React from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useDeliveryTaskStore, type DeliveryTask } from "@/lib/stores/delivery-task-store";
import { cn } from "@/lib/utils/cn";

export default function MentorDeliveryReviewsPage() {
  const { data: session } = useSession();
  const mentorName = session?.user?.name ?? session?.user?.email ?? "Mentor";

  const tasksById = useDeliveryTaskStore((s) => s.tasksById);
  const decide = useDeliveryTaskStore((s) => s.mentorDecision);
  // localStorage-backed store → avoid SSR hydration mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Awaiting mentor: submitted. Also show recently-decided for context.
  const queue = React.useMemo(
    () => (mounted ? Object.values(tasksById).filter((t) => t.status === "submitted") : []),
    [mounted, tasksById],
  );
  const recent = React.useMemo(
    () =>
      mounted
        ? Object.values(tasksById).filter(
            (t) => t.status === "mentor_approved" || t.status === "mentor_changes" || t.status === "reviewer_accepted" || t.status === "reviewer_changes",
          )
        : [],
    [mounted, tasksById],
  );

  return (
    <div className="space-y-5 pb-12">
      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
          Mentor · Quality gate
        </p>
        <h1 className="mt-1 font-display text-[22px] font-semibold text-foreground">Submitted for review</h1>
        <p className="mt-1 font-body text-[13px] text-text-secondary">
          Review the latest submission. Approve to send to the enterprise reviewer, or request changes.
        </p>
      </header>

      {queue.length === 0 ? (
        <div className="rounded-xl border border-stroke bg-surface px-5 py-10 text-center">
          <p className="font-body text-[13px] text-text-secondary">Nothing awaiting your review right now.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {queue.map((t) => (
            <ReviewCard key={t.taskId} task={t} mentorName={mentorName} onDecide={decide} />
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <section className="pt-2">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground mb-2">Recently decided</h2>
          <ul className="space-y-1.5">
            {recent.map((t) => (
              <li key={t.taskId} className="flex items-center justify-between rounded-md border border-stroke-subtle px-3 py-2 font-body text-[12.5px]">
                <span className="text-foreground">{t.title}</span>
                <span className="text-text-tertiary">{t.status.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReviewCard({
  task,
  mentorName,
  onDecide,
}: {
  task: DeliveryTask;
  mentorName: string;
  onDecide: (taskId: string, by: string, decision: "approve" | "changes", comment: string) => void;
}) {
  const [comment, setComment] = React.useState("");
  const latest = task.versions[task.versions.length - 1];

  return (
    <li className="rounded-xl border border-stroke bg-surface shadow-xs p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-body text-[15px] font-semibold text-foreground">{task.title}</h3>
          <p className="font-body text-[11.5px] text-text-tertiary">
            {task.contributorName} · <span className="font-mono">{task.taskId}</span> · v{latest?.version}
          </p>
        </div>
      </div>

      {latest && (
        <div className="rounded-md border border-stroke-subtle bg-bg-subtle/30 px-3 py-2 space-y-1">
          <p className="font-body text-[12.5px] text-text-secondary">{latest.note}</p>
          {latest.links.length > 0 && (
            <p className="font-body text-[12px] text-brand-emphasis break-all">{latest.links.join(", ")}</p>
          )}
        </div>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Review comment (required to send back)…"
        className="w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDecide(task.taskId, mentorName, "approve", comment.trim() || "Approved")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={() => comment.trim().length >= 5 && onDecide(task.taskId, mentorName, "changes", comment.trim())}
          disabled={comment.trim().length < 5}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-4 rounded-md font-body text-[13px] font-semibold transition-colors duration-fast",
            "bg-surface border border-stroke text-foreground hover:bg-bg-subtle",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Request changes
        </button>
      </div>
    </li>
  );
}
