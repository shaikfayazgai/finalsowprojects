"use client";

/**
 * Decomposition approval — decision-first workspace aligned with plan detail UX.
 *
 *   Back link → header (title, meta)
 *   Decision panel (draft): checklist · approve / send back · comment
 *   Plan snapshot · milestone overview
 *   Terminal state when no longer draft
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { usePlan, useApprovePlan } from "@/lib/hooks/use-decomposition-v2";
import { useRequestRevision } from "@/lib/hooks/use-decomposition";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { Skeleton } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import type { MilestoneDetail, PlanDetail, PlanStatus } from "@/lib/decomposition/types";
import { cn } from "@/lib/utils/cn";

type Decision = "approve" | "send_back";

const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: "Ready",
  approved: "Approved",
  active: "In delivery",
  archived: "Archived",
};

function planStatusPillCls(status: PlanStatus): string {
  switch (status) {
    case "draft":
      return "bg-brand-subtle text-brand-subtle-text";
    case "approved":
      return "bg-success-subtle text-success-text";
    case "active":
      return "bg-brand-tertiary-subtle text-brand-tertiary-subtle-text";
    case "archived":
      return "bg-bg-subtle text-text-tertiary";
    default:
      return "bg-bg-subtle text-text-tertiary";
  }
}

const APPROVAL_CHECKLIST = [
  "Milestones cover the approved SOW scope",
  "Every task has skill tags for contributor routing",
  "Effort estimates and dependencies reviewed",
  "Critical path is acceptable for delivery timeline",
];

const DECISION_OPTIONS: Array<{ value: Decision; label: string; short: string }> = [
  { value: "approve", label: "Approve plan", short: "Provision delivery project" },
  { value: "send_back", label: "Send back", short: "Return for revision" },
];

export default function DecompositionApprovalPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const planId = params?.planId ?? "";

  const { data: plan, isLoading, error } = usePlan(planId);
  const { data: sowData } = useSowList({ limit: 200 });
  const approve = useApprovePlan(planId);
  const sendBack = useRequestRevision(planId);

  const [decision, setDecision] = React.useState<Decision>("approve");
  const [comment, setComment] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);

  const sow = React.useMemo(() => {
    if (!plan || !sowData) return undefined;
    return sowData.items.find((s) => s.id === plan.sowId);
  }, [plan, sowData]);

  if (isLoading && !plan) return <ApprovalSkeleton />;
  if (error || !plan) {
    return (
      <div className="rounded-xl border border-stroke bg-surface px-4 py-10 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">Plan not found</p>
        <Link
          href="/enterprise/decomposition"
          className="mt-3 inline-block font-body text-[12.5px] text-text-link hover:underline"
        >
          Back to decomposition
        </Link>
      </div>
    );
  }

  const title = sow?.title ?? `Plan ${plan.id.slice(0, 8)}`;
  const canDecide = plan.status === "draft";
  const terminal = !canDecide;
  const totalHours = plan.tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const unskilledTasks = plan.tasks.filter((t) => t.requiredSkills.length === 0);
  const orderedMilestones = [...plan.milestones].sort((a, b) => a.order - b.order);
  const isPending = approve.isPending || sendBack.isPending;

  const onSubmit = async () => {
    setActionError(null);
    const trimmed = comment.trim();
    if (decision === "send_back" && !trimmed) {
      setActionError("A comment is required when sending back for revision.");
      return;
    }
    try {
      if (decision === "approve") {
        await approve.mutateAsync();
      } else {
        await sendBack.mutateAsync({ comments: trimmed });
      }
      router.push(`/enterprise/decomposition/${plan.id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to submit decision");
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link
        href={`/enterprise/decomposition/${plan.id}`}
        className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-tertiary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to plan
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Sponsor approval · Version {plan.version}
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {title}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
          <span
            className={cn(
              "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold",
              planStatusPillCls(plan.status),
            )}
          >
            {PLAN_STATUS_LABEL[plan.status]}
          </span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {plan.milestones.length} milestones · {plan.tasks.length} tasks
          </span>
          {totalHours > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums font-medium text-text-secondary">{totalHours}h est.</span>
            </>
          )}
        </div>
      </header>

      {unskilledTasks.length > 0 && canDecide && (
        <ContextBanner tone="error" title={`${unskilledTasks.length} task${unskilledTasks.length === 1 ? "" : "s"} missing skill tags`}>
          Consider sending back — tasks without skills cannot be routed to contributors.
        </ContextBanner>
      )}

      {canDecide && (
        <DashboardSection
          title="Sponsor decision"
          description="Approve to provision a delivery project, or send back with feedback for the PMO."
        >
          <DecisionPanel
            decision={decision}
            onDecisionChange={setDecision}
            comment={comment}
            onCommentChange={setComment}
            onSubmit={onSubmit}
            isPending={isPending}
            error={actionError}
            planId={plan.id}
          />
        </DashboardSection>
      )}

      {terminal && (
        <DashboardSection
          title="Approval closed"
          description={`This plan is ${PLAN_STATUS_LABEL[plan.status].toLowerCase()} and no longer awaiting sponsor sign-off.`}
        >
          <Link
            href={`/enterprise/decomposition/${plan.id}`}
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            View plan record
          </Link>
        </DashboardSection>
      )}

      <DashboardSection title="Plan snapshot" description="Summary before you decide">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <Fact label="Plan ID" value={plan.id} mono />
          <Fact
            label="Source SOW"
            value={
              <Link
                href={`/enterprise/sow/${plan.sowId}`}
                className="font-medium hover:text-brand underline-offset-2 hover:underline"
              >
                {title}
              </Link>
            }
          />
          <Fact label="Milestones" value={String(plan.milestones.length)} mono />
          <Fact label="Tasks" value={String(plan.tasks.length)} mono />
          <Fact label="Estimated effort" value={totalHours > 0 ? `${totalHours} hours` : "—"} mono />
          <Fact
            label="Dependencies"
            value={plan.dependencies.length === 0 ? "None" : String(plan.dependencies.length)}
            mono
          />
          {plan.summary && <Fact label="Summary" value={plan.summary} className="sm:col-span-2" />}
        </dl>
      </DashboardSection>

      <DashboardSection
        title="Milestone overview"
        description={
          orderedMilestones.length === 0
            ? "No milestones on this plan"
            : orderedMilestones.map((m) => m.name).join(" → ")
        }
      >
        {orderedMilestones.length === 0 ? (
          <p className="font-body text-[13px] text-text-tertiary py-1">No milestones in this plan.</p>
        ) : (
          <ul className="divide-y divide-stroke-subtle -mx-5">
            {orderedMilestones.map((m) => (
              <MilestonePreviewRow key={m.id} milestone={m} plan={plan} />
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}

function DecisionPanel({
  decision,
  onDecisionChange,
  comment,
  onCommentChange,
  onSubmit,
  isPending,
  error,
  planId,
}: {
  decision: Decision;
  onDecisionChange: (d: Decision) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string | null;
  planId: string;
}) {
  const needsComment = decision === "send_back";

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {APPROVAL_CHECKLIST.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 font-body text-[13px] text-text-secondary"
          >
            <Check className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      <div>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
          Decision
        </p>
        <DecisionSegment value={decision} onChange={onDecisionChange} disabled={isPending} />
      </div>

      {needsComment ? (
        <div>
          <label
            htmlFor="plan-approval-comment"
            className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
          >
            Comment (required)
          </label>
          <textarea
            id="plan-approval-comment"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
            placeholder="Explain what the PMO should revise…"
            disabled={isPending}
            className={cn(
              "w-full px-3 py-2 rounded-md bg-surface border border-stroke",
              "font-body text-[13px] text-foreground placeholder:text-text-disabled",
              "focus-visible:outline-none focus-visible:border-stroke-focus focus-visible:ring-2 focus-visible:ring-stroke-focus/30",
              "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
            )}
          />
        </div>
      ) : (
        <div>
          <label
            htmlFor="plan-approval-comment-optional"
            className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
          >
            Comment (optional)
          </label>
          <textarea
            id="plan-approval-comment-optional"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={2}
            placeholder="Optional note for the audit trail…"
            disabled={isPending}
            className={cn(
              "w-full px-3 py-2 rounded-md bg-surface border border-stroke",
              "font-body text-[13px] text-foreground placeholder:text-text-disabled",
              "focus-visible:outline-none focus-visible:border-stroke-focus focus-visible:ring-2 focus-visible:ring-stroke-focus/30",
              "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
            )}
          />
        </div>
      )}

      {error && <p className="font-body text-[12px] text-error-text">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-stroke-subtle -mx-5 px-5 pt-4">
        <Link
          href={`/enterprise/decomposition/${planId}`}
          className="inline-flex items-center h-9 px-3.5 rounded-md font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
            "bg-brand text-on-brand font-body text-[13px] font-semibold",
            "hover:opacity-90 transition-opacity duration-fast",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          {isPending ? (
            "Submitting…"
          ) : decision === "approve" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Approve plan
            </>
          ) : (
            <>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Send back
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DecisionSegment({
  value,
  onChange,
  disabled,
}: {
  value: Decision;
  onChange: (v: Decision) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Plan approval decision" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {DECISION_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "text-left px-3 py-2.5 rounded-lg border transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected
                ? "border-brand bg-brand-subtle/40 shadow-xs"
                : "border-stroke-subtle bg-surface hover:border-stroke",
            )}
          >
            <span className="block font-body text-[13px] font-semibold text-foreground">{opt.label}</span>
            <span className="block font-body text-[11px] text-text-tertiary mt-0.5">{opt.short}</span>
          </button>
        );
      })}
    </div>
  );
}

function MilestonePreviewRow({ milestone, plan }: { milestone: MilestoneDetail; plan: PlanDetail }) {
  const tasks = plan.tasks.filter((t) => t.milestoneId === milestone.id);
  const hours = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const unskilled = tasks.filter((t) => t.requiredSkills.length === 0).length;

  const meta = [
    `${tasks.length} tasks`,
    hours > 0 ? `${hours}h` : null,
    unskilled > 0 ? `${unskilled} missing skills` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px]">
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        <span className="font-mono text-[10px] text-text-tertiary mr-2">M{milestone.order}</span>
        {milestone.name}
      </span>
      <span
        className={cn(
          "font-body text-[11px] shrink-0 text-right",
          unskilled > 0 ? "text-warning-text font-medium" : "text-text-tertiary",
        )}
      >
        {meta}
      </span>
    </li>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "brand";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 flex items-start gap-2.5",
        tone === "error"
          ? "border-error-border bg-error-subtle"
          : "border-brand/30 bg-brand-subtle/20",
      )}
    >
      {tone === "error" && (
        <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "font-body text-[13px] font-semibold",
            tone === "error" ? "text-error-text" : "text-foreground",
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && typeof value === "string" && "font-mono text-[12px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ApprovalSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-24 rounded" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-36 rounded" />
        <Skeleton className="h-7 w-80 max-w-full rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
