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
  Boxes,
  Check,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { usePlan, useApprovePlan } from "@/lib/hooks/use-decomposition-v2";
import { useRequestRevision } from "@/lib/hooks/use-decomposition";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { Skeleton } from "@/components/meridian";
import type { MilestoneDetail, PlanDetail, PlanStatus } from "@/lib/decomposition/types";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  TONE,
  type Tone,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";

function Section({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

type Decision = "approve" | "send_back";

const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: "Ready",
  approved: "Approved",
  active: "In delivery",
  archived: "Archived",
};

function planStatusTone(status: PlanStatus): Tone {
  switch (status) {
    case "draft":
      return "ai";
    case "approved":
      return "success";
    case "active":
      return "info";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

const APPROVAL_CHECKLIST = [
  "Milestones cover the approved SOW scope",
  "Every task has skill tags for contributor routing",
  "Effort estimates and dependencies reviewed",
  "Critical path is acceptable for delivery timeline",
];

const DECISION_OPTIONS: Array<{ value: Decision; label: string; short: string; icon: typeof CheckCircle2 }> = [
  { value: "approve", label: "Approve plan", short: "Provision the delivery project", icon: CheckCircle2 },
  { value: "send_back", label: "Send back", short: "Return to the PMO for revision", icon: RotateCcw },
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
      <div className={cn(DASH_CARD, "px-4 py-10 text-center")}>
        <p className="font-body text-[13px] font-semibold text-foreground">Plan not found</p>
        <Link
          href="/enterprise/decomposition"
          className="mt-3 inline-block font-body text-[12.5px] text-text-secondary hover:text-foreground transition-colors duration-fast"
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
        className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-secondary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to plan
      </Link>

      <header className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
          <Boxes className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Sponsor approval · Version {plan.version}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
              {title}
            </h1>
            <Chip tone={planStatusTone(plan.status)}>{PLAN_STATUS_LABEL[plan.status]}</Chip>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <span className="tabular-nums">
              {plan.milestones.length} milestones · {plan.tasks.length} tasks
            </span>
            {totalHours > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span className="tabular-nums font-medium text-text-secondary">{totalHours}h est.</span>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {unskilledTasks.length > 0 && canDecide && (
        <ContextBanner tone="error" title={`${unskilledTasks.length} task${unskilledTasks.length === 1 ? "" : "s"} missing skill tags`}>
          Consider sending back — tasks without skills cannot be routed to contributors.
        </ContextBanner>
      )}

      {canDecide && (
        <Section
          title="Sponsor decision"
          description="Approve to provision a delivery project, or send back with feedback for the PMO."
        >
          <div className="px-5 sm:px-6 py-5">
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
          </div>
        </Section>
      )}

      {terminal && (
        <Section
          title="Approval closed"
          description={`This plan is ${PLAN_STATUS_LABEL[plan.status].toLowerCase()} and no longer awaiting sponsor sign-off.`}
        >
          <div className="px-5 sm:px-6 py-5">
            <Link
              href={`/enterprise/decomposition/${plan.id}`}
              className={secondaryBtnClass}
            >
              View plan record
            </Link>
          </div>
        </Section>
      )}

      <Section title="Plan snapshot" description="Summary before you decide">
        <div className="px-5 sm:px-6 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <Fact label="Plan ID" value={plan.id} mono />
            <Fact
              label="Source SOW"
              value={
                <Link
                  href={`/enterprise/sow/${plan.sowId}`}
                  className="font-medium text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
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
        </div>
      </Section>

      <Section
        title="Milestone overview"
        description={
          orderedMilestones.length === 0
            ? "No milestones on this plan"
            : orderedMilestones.map((m) => m.name).join(" → ")
        }
      >
        {orderedMilestones.length === 0 ? (
          <p className="px-5 sm:px-6 py-5 font-body text-[13px] text-text-tertiary">No milestones in this plan.</p>
        ) : (
          <ul className="divide-y divide-stroke-subtle">
            {orderedMilestones.map((m) => (
              <MilestonePreviewRow key={m.id} milestone={m} plan={plan} />
            ))}
          </ul>
        )}
      </Section>
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
    <div className="space-y-5">
      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3.5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Confirm before approving
        </p>
        <ul className="mt-2.5 space-y-2">
          {APPROVAL_CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2.5 font-body text-[13px] text-text-secondary leading-snug">
              <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-px" strokeWidth={2} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
          Your decision
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
              "w-full px-3 py-2 rounded-lg border border-stroke-subtle bg-surface",
              "font-body text-[13px] text-foreground placeholder:text-text-disabled transition-colors",
              "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
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
              "w-full px-3 py-2 rounded-lg border border-stroke-subtle bg-surface",
              "font-body text-[13px] text-foreground placeholder:text-text-disabled transition-colors",
              "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
              "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
            )}
          />
        </div>
      )}

      {error && <p className="font-body text-[12px]" style={{ color: TONE.error.text }}>{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-stroke-subtle -mx-5 sm:-mx-6 px-5 sm:px-6 pt-4">
        <Link href={`/enterprise/decomposition/${planId}`} className={secondaryBtnClass}>
          Cancel
        </Link>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className={primaryBtnClass}
          style={primaryStyle}
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
    <div role="radiogroup" aria-label="Plan approval decision" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {DECISION_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "group relative flex items-start gap-3 text-left px-4 py-3.5 rounded-lg border transition-all duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected
                ? "border-[var(--c-violet-400)] bg-[var(--color-ai-surface)] ring-1 ring-[var(--c-violet-400)] shadow-[0_8px_20px_-12px_rgba(108,76,230,0.35)]"
                : "border-stroke-subtle bg-surface hover:border-stroke hover:bg-bg-subtle/50",
            )}
          >
            <span
              className={cn("grid place-items-center h-8 w-8 rounded-lg shrink-0 transition-colors", selected ? "text-white" : "bg-bg-subtle text-text-tertiary")}
              style={selected ? GLASS_GRADIENT : undefined}
              aria-hidden
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block font-body text-[13.5px] font-bold text-foreground">{opt.label}</span>
              <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5 leading-snug">{opt.short}</span>
            </span>
            <span
              aria-hidden
              className={cn(
                "absolute top-3 right-3 grid place-items-center h-4 w-4 rounded-full border shrink-0",
                selected ? "border-transparent text-white" : "border-stroke-strong",
              )}
              style={selected ? GLASS_GRADIENT : undefined}
            >
              {selected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
            </span>
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
    <li className="flex items-center justify-between gap-4 px-5 sm:px-6 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-bg-subtle">
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        <span className="font-mono text-[10px] text-text-tertiary mr-2">M{milestone.order}</span>
        {milestone.name}
      </span>
      <span
        className={cn(
          "font-body text-[11px] shrink-0 text-right",
          unskilled > 0 ? "font-medium" : "text-text-tertiary",
        )}
        style={unskilled > 0 ? { color: TONE.warning.text } : undefined}
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
  const bannerTone: Tone = tone === "error" ? "error" : "ai";
  return (
    <div
      className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
      style={{ background: TONE[bannerTone].soft, borderColor: TONE[bannerTone].border }}
    >
      {tone === "error" && (
        <AlertTriangle
          className="h-4 w-4 shrink-0 mt-0.5"
          strokeWidth={2}
          style={{ color: TONE.error.text }}
          aria-hidden
        />
      )}
      <div className="min-w-0">
        <p
          className="font-body text-[13px] font-semibold"
          style={{ color: tone === "error" ? TONE.error.text : "var(--color-foreground)" }}
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
      <Skeleton className="h-4 w-24" />

      <div className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2.5">
          <Skeleton className="h-2.5 w-36" />
          <Skeleton className="h-6 w-56 sm:w-72" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle space-y-1.5">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-2.5 w-56" />
        </div>
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <Skeleton className="h-3.5 w-full max-w-sm" />
          <Skeleton className="h-3.5 w-5/6 max-w-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
