"use client";

/**
 * SOW & task-status context for delivery reviewers (mentor + reviewer).
 *
 * Given a sowId, shows the SOW scope and the decomposition milestones/tasks with
 * their statuses — so a reviewer knows WHICH work, in WHICH plan, at WHAT stage
 * they're signing off. Strictly NON-financial: the backend omits budget/price,
 * and nothing money-related is rendered here.
 */

import * as React from "react";
import { Layers, ListChecks, FileText, Paperclip, Clock } from "lucide-react";
import { deliveryCell, type DeliveryRole } from "@/lib/delivery/status-matrix";

interface TaskAttachment { name: string; url: string; sizeBytes?: number | null }
interface ContextTask { id: string; title: string; description?: string | null; status: string; requiredSkills?: string[]; estimatedHours?: number | null; attachments?: TaskAttachment[] }
interface ContextMilestone { id: string | null; name: string; status: string; startDate?: string | null; endDate?: string | null; tasks: ContextTask[] }
interface SowFile { name: string; url?: string | null }
interface WorkContext {
  sow: {
    id: string; title: string; status?: string | null; clientOrganisation?: string | null;
    requiredSkills?: string[]; startDate?: string | null; endDate?: string | null;
    confidentiality?: string | null; description?: string | null;
    mentor?: string | null; reviewer?: string | null;
    files?: SowFile[]; lifecycleStage?: string | null;
  };
  plan: { id: string; version: number; status: string; milestones: ContextMilestone[]; taskCount: number; statusCounts: Record<string, number> } | null;
}

const LIFECYCLE: Record<string, { label: string; tone: string }> = {
  awaiting_approval: { label: "Waiting for approvals", tone: "bg-warning-subtle text-warning-text" },
  approved: { label: "Approved", tone: "bg-success-subtle text-success-text" },
  awaiting_decomposition: { label: "Awaiting decomposition", tone: "bg-info-subtle text-info-text" },
  decomposing: { label: "Decomposition in progress", tone: "bg-info-subtle text-info-text" },
  in_delivery: { label: "In delivery", tone: "bg-success-subtle text-success-text" },
  rejected: { label: "Rejected", tone: "bg-error-subtle text-error-text" },
  cancelled: { label: "Cancelled", tone: "bg-bg-subtle text-text-secondary" },
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-bg-subtle text-text-secondary",
  ready: "bg-info-subtle text-info-text",
  pending: "bg-bg-subtle text-text-secondary",
  assigned: "bg-warning-subtle text-warning-text",
  in_progress: "bg-warning-subtle text-warning-text",
  submitted: "bg-info-subtle text-info-text",
  in_review: "bg-info-subtle text-info-text",
  qa_review: "bg-info-subtle text-info-text",
  awaiting_acceptance: "bg-warning-subtle text-warning-text",
  completed: "bg-success-subtle text-success-text",
  done: "bg-success-subtle text-success-text",
};

// Delivery-lifecycle labels the mentor/reviewer/enterprise read at a glance.
const STATUS_LABEL: Record<string, string> = {
  submitted: "Requirement checking",
  in_review: "Requirement checking",
  qa_review: "Quality checking",
  revision: "Sent for rework",
  awaiting_acceptance: "Awaiting acceptance",
  completed: "Completed",
  accepted: "Completed",
};

// `role` chips render the delivery-matrix label for the viewing role; non-task
// chips (SOW lifecycle, plan/milestone status) keep the legacy generic labels.
function StatusChip({ status, role }: { status: string; role?: DeliveryRole }) {
  if (role) {
    const cell = deliveryCell(status, role);
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${cell.tone}`}>
        {cell.label ?? (status || "—").replace(/_/g, " ")}
      </span>
    );
  }
  const tone = STATUS_TONE[status] ?? "bg-bg-subtle text-text-secondary";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${tone}`}>
      {STATUS_LABEL[status] ?? (status || "—").replace(/_/g, " ")}
    </span>
  );
}

export function SowWorkContextPanel({ sowId, role = "enterprise" }: { sowId?: string | null; role?: DeliveryRole }) {
  const [ctx, setCtx] = React.useState<WorkContext | null>(null);
  const [state, setState] = React.useState<"idle" | "loading" | "error" | "done">("idle");

  React.useEffect(() => {
    if (!sowId) { setState("idle"); return; }
    const c = new AbortController();
    setState("loading");
    fetch(`/api/sow-context/${encodeURIComponent(sowId)}`, { cache: "no-store", signal: c.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<WorkContext>;
      })
      .then((d) => { setCtx(d); setState("done"); })
      .catch((e) => { if ((e as { name?: string }).name !== "AbortError") setState("error"); });
    return () => c.abort();
  }, [sowId]);

  if (!sowId) return null;

  return (
    <section className="rounded-2xl border border-stroke-subtle bg-surface p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
        <h2 className="font-body text-[14px] font-semibold text-foreground">SOW &amp; task context</h2>
        <span className="ml-auto text-[11px] text-text-tertiary">scope &amp; status · no commercials</span>
      </div>

      {state === "loading" && <div className="h-16 rounded-lg bg-bg-subtle animate-pulse" />}
      {state === "error" && (
        <p className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2 text-[12.5px] text-text-secondary">
          Couldn&apos;t load SOW context.
        </p>
      )}

      {state === "done" && ctx && (
        <>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-[13.5px] font-semibold text-foreground">{ctx.sow.title}</span>
              {ctx.sow.lifecycleStage && LIFECYCLE[ctx.sow.lifecycleStage] ? (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${LIFECYCLE[ctx.sow.lifecycleStage].tone}`}>
                  {LIFECYCLE[ctx.sow.lifecycleStage].label}
                </span>
              ) : ctx.sow.status ? <StatusChip status={ctx.sow.status} /> : null}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-text-secondary">
              {ctx.sow.clientOrganisation ? <span>Client: <span className="text-foreground">{ctx.sow.clientOrganisation}</span></span> : null}
              {ctx.sow.startDate ? <span>Start: {ctx.sow.startDate.slice(0, 10)}</span> : null}
              {ctx.sow.endDate ? <span>End: {ctx.sow.endDate.slice(0, 10)}</span> : null}
              {ctx.sow.mentor ? <span>Mentor: <span className="text-foreground">{ctx.sow.mentor}</span></span> : null}
              {ctx.sow.reviewer ? <span>Reviewer: <span className="text-foreground">{ctx.sow.reviewer}</span></span> : null}
            </div>
            {ctx.sow.requiredSkills && ctx.sow.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {ctx.sow.requiredSkills.map((s) => (
                  <span key={s} className="rounded bg-bg-subtle px-1.5 py-0.5 text-[10.5px] text-text-secondary">{s}</span>
                ))}
              </div>
            )}
            {typeof ctx.sow.description === "string" && ctx.sow.description ? (
              <p className="pt-1 text-[12.5px] text-text-secondary leading-relaxed">{ctx.sow.description}</p>
            ) : null}
            {ctx.sow.files && ctx.sow.files.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Paperclip className="h-3.5 w-3.5 text-text-tertiary" aria-hidden />
                {ctx.sow.files.map((f, i) =>
                  f.url ? (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                       className="rounded border border-stroke-subtle bg-bg-subtle/40 px-2 py-0.5 text-[11.5px] text-text-link hover:underline">
                      {f.name}
                    </a>
                  ) : (
                    <span key={i} className="rounded border border-stroke-subtle bg-bg-subtle/40 px-2 py-0.5 text-[11.5px] text-text-secondary">{f.name}</span>
                  ),
                )}
              </div>
            )}
          </div>

          {ctx.plan ? (
            <div className="space-y-3 border-t border-stroke-subtle pt-3">
              <div className="flex items-center gap-2 text-[11.5px] text-text-tertiary">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                <span>Decomposition v{ctx.plan.version} · {ctx.plan.taskCount} tasks</span>
                <StatusChip status={ctx.plan.status} />
              </div>
              {ctx.plan.milestones.map((m) => (
                <div key={m.id ?? m.name} className="rounded-lg border border-stroke-subtle bg-bg-subtle/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-3.5 w-3.5 text-text-tertiary" aria-hidden />
                    <span className="font-body text-[12.5px] font-semibold text-foreground">{m.name}</span>
                    {m.endDate ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-text-tertiary">
                        <Clock className="h-3 w-3" aria-hidden /> due {m.endDate.slice(0, 10)}
                      </span>
                    ) : null}
                    <span className="ml-auto"><StatusChip status={m.status} /></span>
                  </div>
                  {m.tasks.length === 0 ? (
                    <p className="pl-5 text-[11.5px] text-text-tertiary">No tasks</p>
                  ) : (
                    <ul className="pl-5 space-y-2">
                      {m.tasks.map((t) => (
                        <li key={t.id} className="text-[12px]">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{t.title}</span>
                            {t.estimatedHours ? <span className="text-text-tertiary">· {t.estimatedHours}h</span> : null}
                            <span className="ml-auto"><StatusChip status={t.status} role={role} /></span>
                          </div>
                          {typeof t.description === "string" && t.description ? (
                            <p className="mt-0.5 text-[11.5px] text-text-secondary leading-relaxed">{t.description}</p>
                          ) : null}
                          {t.attachments && t.attachments.length > 0 ? (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Paperclip className="h-3 w-3 text-text-tertiary" aria-hidden />
                              {t.attachments.map((a) => (
                                <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                                   className="rounded border border-stroke-subtle bg-surface px-1.5 py-0.5 text-[10.5px] text-text-link hover:underline max-w-[160px] truncate">
                                  {a.name}
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="border-t border-stroke-subtle pt-3 text-[12.5px] text-text-secondary">
              No decomposition plan for this SOW yet.
            </p>
          )}
        </>
      )}
    </section>
  );
}
