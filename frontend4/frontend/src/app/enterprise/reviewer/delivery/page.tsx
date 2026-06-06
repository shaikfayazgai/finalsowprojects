"use client";

/**
 * Reviewer gate — enterprise reviewer's final acceptance, AFTER the mentor has
 * approved. Accept advances the milestone to payable; send-back returns the task
 * to the contributor for revision. Reads the delivery-task store.
 */

import * as React from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useDeliveryTaskStore, type DeliveryTask } from "@/lib/stores/delivery-task-store";
import { cn } from "@/lib/utils/cn";

export default function ReviewerDeliveryPage() {
  const { data: session } = useSession();
  const reviewerName = session?.user?.name ?? session?.user?.email ?? "Reviewer";

  const tasksById = useDeliveryTaskStore((s) => s.tasksById);
  const decide = useDeliveryTaskStore((s) => s.reviewerDecision);
  // localStorage-backed store → avoid SSR hydration mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const queue = React.useMemo(
    () => (mounted ? Object.values(tasksById).filter((t) => t.status === "mentor_approved") : []),
    [mounted, tasksById],
  );

  return (
    <div className="space-y-5 pb-12">
      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
          Reviewer · Acceptance gate
        </p>
        <h1 className="mt-1 font-display text-[22px] font-semibold text-foreground">Mentor-approved · awaiting acceptance</h1>
        <p className="mt-1 font-body text-[13px] text-text-secondary">
          The mentor has passed these. Accept for milestone payment, or send back for revision.
        </p>
      </header>

      {queue.length === 0 ? (
        <div className="rounded-xl border border-stroke bg-surface px-5 py-10 text-center">
          <p className="font-body text-[13px] text-text-secondary">
            Nothing awaiting acceptance. Tasks appear here once the mentor approves.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {queue.map((t) => (
            <AcceptCard key={t.taskId} task={t} reviewerName={reviewerName} onDecide={decide} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AcceptCard({
  task,
  reviewerName,
  onDecide,
}: {
  task: DeliveryTask;
  reviewerName: string;
  onDecide: (taskId: string, by: string, decision: "accept" | "changes", comment: string) => void;
}) {
  const [comment, setComment] = React.useState("");
  const latest = task.versions[task.versions.length - 1];
  const mentorApproval = [...task.decisions].reverse().find((d) => d.decision === "approve");

  return (
    <li className="rounded-xl border border-stroke bg-surface shadow-xs p-4 space-y-3">
      <div className="min-w-0">
        <h3 className="font-body text-[15px] font-semibold text-foreground">{task.title}</h3>
        <p className="font-body text-[11.5px] text-text-tertiary">
          {task.contributorName} · <span className="font-mono">{task.taskId}</span> · v{latest?.version}
        </p>
      </div>

      {latest && (
        <div className="rounded-md border border-stroke-subtle bg-bg-subtle/30 px-3 py-2 space-y-1">
          <p className="font-body text-[12.5px] text-text-secondary">{latest.note}</p>
          {latest.links.length > 0 && (
            <p className="font-body text-[12px] text-brand-emphasis break-all">{latest.links.join(", ")}</p>
          )}
        </div>
      )}

      {mentorApproval && (
        <p className="inline-flex items-center gap-1.5 font-body text-[12px] text-success-text">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Mentor ({mentorApproval.by}) approved: {mentorApproval.comment}
        </p>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Acceptance note (required to send back)…"
        className="w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDecide(task.taskId, reviewerName, "accept", comment.trim() || "Accepted")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Accept
        </button>
        <button
          type="button"
          onClick={() => comment.trim().length >= 5 && onDecide(task.taskId, reviewerName, "changes", comment.trim())}
          disabled={comment.trim().length < 5}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-4 rounded-md font-body text-[13px] font-semibold transition-colors duration-fast",
            "bg-surface border border-stroke text-foreground hover:bg-bg-subtle",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Send back
        </button>
      </div>
    </li>
  );
}
