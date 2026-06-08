"use client";

/**
 * Contributor delivery — the assigned SOW-flow tasks with submit + version
 * history. Wired to the delivery-task store (real project taskIds), driving the
 * submit → Mentor gate → Reviewer gate chain. Every submission is stored as a
 * version.
 */

import * as React from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Clock, RotateCcw, Send } from "lucide-react";
import { useDeliveryTaskStore, type DeliveryTask } from "@/lib/stores/delivery-task-store";
import { cn } from "@/lib/utils/cn";

const STATUS_LABEL: Record<DeliveryTask["status"], { label: string; tone: string }> = {
  assigned: { label: "Assigned — submit your work", tone: "bg-brand-subtle text-brand-emphasis" },
  submitted: { label: "Submitted — awaiting mentor", tone: "bg-warning-subtle text-warning-text" },
  mentor_changes: { label: "Mentor requested changes", tone: "bg-error-subtle text-error-text" },
  mentor_approved: { label: "Mentor approved — awaiting reviewer", tone: "bg-warning-subtle text-warning-text" },
  reviewer_changes: { label: "Reviewer requested changes", tone: "bg-error-subtle text-error-text" },
  reviewer_accepted: { label: "Accepted ✓", tone: "bg-success-subtle text-success-text" },
};

export default function ContributorDeliveryPage() {
  const { data: session } = useSession();
  const user = session?.user as { id?: string; email?: string } | undefined;
  const contributorId = user?.id ?? user?.email ?? "me";

  const tasksById = useDeliveryTaskStore((s) => s.tasksById);
  const submitWork = useDeliveryTaskStore((s) => s.submitWork);
  // localStorage-backed store → avoid SSR hydration mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const tasks = React.useMemo(
    () =>
      mounted
        ? Object.values(tasksById).filter((t) => t.contributorId === contributorId)
        : [],
    [mounted, tasksById, contributorId],
  );

  return (
    <div className="space-y-5 pb-12">
      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
          Contributor · Delivery
        </p>
        <h1 className="mt-1 font-display text-[22px] font-semibold text-foreground">My assigned work</h1>
        <p className="mt-1 font-body text-[13px] text-text-secondary">
          Submit your work for each task. The mentor reviews first, then the enterprise reviewer accepts.
        </p>
      </header>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-stroke bg-surface px-5 py-10 text-center">
          <p className="font-body text-[13px] text-text-secondary">
            No assigned tasks yet. Express interest in Opportunities; the enterprise selects one contributor per task.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {tasks.map((t) => (
            <TaskCard key={t.taskId} task={t} onSubmit={submitWork} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onSubmit,
}: {
  task: DeliveryTask;
  onSubmit: (taskId: string, note: string, links: string[]) => void;
}) {
  const [note, setNote] = React.useState("");
  const [link, setLink] = React.useState("");
  const status = STATUS_LABEL[task.status];
  const canSubmit =
    task.status === "assigned" ||
    task.status === "mentor_changes" ||
    task.status === "reviewer_changes";
  const isResubmit = task.versions.length > 0;

  const submit = () => {
    if (note.trim().length < 5) return;
    onSubmit(task.taskId, note.trim(), link.trim() ? [link.trim()] : []);
    setNote("");
    setLink("");
  };

  // Latest decision comment to show on a sent-back task.
  const lastDecision = task.decisions[task.decisions.length - 1];

  return (
    <li className="rounded-xl border border-stroke bg-surface shadow-xs p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-body text-[15px] font-semibold text-foreground">{task.title}</h2>
          <p className="font-body text-[11.5px] text-text-tertiary font-mono">{task.taskId}</p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold", status.tone)}>
          {status.label}
        </span>
      </div>

      {(task.status === "mentor_changes" || task.status === "reviewer_changes") && lastDecision && (
        <div className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
          <RotateCcw className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12px] text-error-text">
            <span className="font-semibold">{lastDecision.by} requested changes:</span> {lastDecision.comment}
          </p>
        </div>
      )}

      {/* Version history — every submission stored */}
      {task.versions.length > 0 && (
        <div className="rounded-md border border-stroke-subtle bg-bg-subtle/30 px-3 py-2">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
            Version history ({task.versions.length})
          </p>
          <ul className="space-y-1.5">
            {task.versions.map((v) => (
              <li key={v.version} className="flex items-start gap-2 font-body text-[12px] text-text-secondary">
                <span className="inline-flex items-center justify-center h-4 min-w-[1.5rem] rounded bg-bg-subtle px-1 font-mono text-[10.5px] font-semibold text-text-secondary">
                  v{v.version}
                </span>
                <span className="flex-1">
                  {v.note}
                  {v.links.length > 0 && (
                    <span className="text-text-tertiary"> · {v.links.join(", ")}</span>
                  )}
                  <span className="text-text-tertiary"> · {new Date(v.submittedAt).toLocaleString()}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canSubmit ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What did you deliver? (summary of this version)"
            className="w-full px-3 py-2 rounded-md bg-surface border border-stroke font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25"
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Artifact link (PR, doc, demo) — optional"
            className="w-full h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25"
          />
          <button
            type="button"
            onClick={submit}
            disabled={note.trim().length < 5}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {isResubmit ? "Resubmit work" : "Submit work"}
          </button>
        </div>
      ) : task.status === "reviewer_accepted" ? (
        <p className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-success-text">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Accepted — milestone is payable.
        </p>
      ) : (
        <p className="inline-flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          In review — you&apos;ll be notified when there&apos;s an update.
        </p>
      )}
    </li>
  );
}
