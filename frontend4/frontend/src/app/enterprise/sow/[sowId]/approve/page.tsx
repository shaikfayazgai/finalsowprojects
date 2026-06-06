"use client";

/**
 * SOW approval — decision-first workspace aligned with SOW detail UX.
 *
 *   Back link → header (title, stage meta)
 *   Primary panel: submit (draft) · decide (in approval) · wait (commercial) · terminal
 *   Pipeline progress (compact stepper)
 *   Decision history
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import {
  useSow,
  useSubmitSow,
  useApproveSow,
  useSendBackSow,
  useRejectSow,
} from "@/lib/hooks/use-sow-v2";
import {
  APPROVAL_STAGE_ORDER,
  type SowApprovalSummary,
  type SowStage,
  type SowStatus,
} from "@/lib/sow/types";
import {
  approverDisplayName,
  parseIntakePayload,
  type IntakeSubmissionPayload,
} from "@/lib/sow/intake-payload";
import { Skeleton } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { cn } from "@/lib/utils/cn";

type Decision = "approve" | "send_back" | "reject";

const STAGE_LABEL: Record<SowStage, string> = {
  business: "Finance",
  commercial: "Commercial",
  legal: "Legal",
  security: "Security",
  final: "Final sign-off",
};

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: "Draft",
  approval: "In approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

function statusPillCls(s: SowStatus): string {
  switch (s) {
    case "draft":
      return "bg-bg-subtle text-text-secondary";
    case "approval":
      return "bg-brand-subtle text-brand-subtle-text";
    case "approved":
      return "bg-success-subtle text-success-text";
    case "rejected":
      return "bg-error-subtle text-error-text";
    default:
      return "bg-bg-subtle text-text-tertiary";
  }
}

function approveStageDescription(stage: SowStage): string {
  if (stage === "final") {
    return "Sign off Final and mark the SOW approved.";
  }
  const next = APPROVAL_STAGE_ORDER[APPROVAL_STAGE_ORDER.indexOf(stage) + 1];
  return `Advance to ${next ? STAGE_LABEL[next] : "the next stage"}.`;
}

const STAGE_CHECKLIST: Record<SowStage, string[]> = {
  business: [
    "Aligned with quarterly OKRs",
    "Budget pre-committed",
    "Sponsor sign-off captured",
  ],
  commercial: [
    "Rate cards apply to the in-scope skill set",
    "Effort estimates within ±15% of historical",
    "Payment terms align with master agreement",
  ],
  legal: [
    "Confidentiality / NDA in place",
    "IP ownership clause acceptable",
    "Jurisdiction matches master agreement",
  ],
  security: [
    "Data classification documented",
    "Access scope minimized to need-to-know",
    "Security reviewer concerns addressed",
  ],
  final: [
    "All upstream stages signed off",
    "Provisioning plan attached",
    "Kick-off window scheduled",
  ],
};

const SUBMIT_CHECKLIST = [
  "Scope and deliverables reviewed on the SOW record",
  "Approvers assigned during intake",
  "Budget, timeline, and sponsor details confirmed",
];

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ownerLabel(ownerId: string): string {
  if (ownerId.includes("@")) return ownerId.split("@")[0];
  if (ownerId.length <= 14) return ownerId;
  return `${ownerId.slice(0, 12)}…`;
}

export default function SowApprovePage() {
  const params = useParams<{ sowId: string }>();
  const router = useRouter();
  const sowId = params?.sowId ?? "";

  const { data: sow, isLoading } = useSow(sowId);
  const submit = useSubmitSow(sowId);
  const approve = useApproveSow(sowId);
  const sendBack = useSendBackSow(sowId);
  const reject = useRejectSow(sowId);

  const [decision, setDecision] = React.useState<Decision>("approve");
  const [comment, setComment] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);

  if (isLoading && !sow) return <ApproveSkeleton />;
  if (!sow) {
    return (
      <div className="rounded-xl border border-stroke bg-surface px-4 py-10 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">SOW not found</p>
      </div>
    );
  }

  const rawPayload = sow.activeVersionDetail?.payload ?? ({} as Record<string, unknown>);
  const intake = parseIntakePayload(rawPayload);
  const submission = intake.submission;

  const currentStage = sow.stage;
  const currentStageIdx = currentStage ? APPROVAL_STAGE_ORDER.indexOf(currentStage) : -1;
  const isDraft = sow.status === "draft";
  const inApproval = sow.status === "approval" && !!currentStage;
  const commercialWait = inApproval && currentStage === "commercial";
  const canDecide = inApproval && currentStage && currentStage !== "commercial";
  const terminal =
    sow.status === "approved" ||
    sow.status === "rejected" ||
    sow.status === "withdrawn" ||
    sow.status === "archived";

  const lastRejection = sow.approvals
    .filter((a) => a.decision === "rejected" && a.comment)
    .sort((a, b) => new Date(b.decidedAt ?? b.createdAt).getTime() - new Date(a.decidedAt ?? a.createdAt).getTime())[0];

  const onSubmitDraft = async () => {
    setActionError(null);
    try {
      await submit.mutateAsync();
      router.push(`/enterprise/sow/${sow.id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to submit for approval");
    }
  };

  const onSubmitDecision = async () => {
    setActionError(null);
    if (!currentStage) {
      setActionError("No active approval stage.");
      return;
    }
    const trimmedComment = comment.trim();
    if ((decision === "send_back" || decision === "reject") && !trimmedComment) {
      setActionError("A comment is required when sending back or rejecting.");
      return;
    }
    try {
      if (decision === "approve") {
        await approve.mutateAsync({
          stage: currentStage,
          comment: trimmedComment || undefined,
        });
      } else if (decision === "send_back") {
        const prevIdx = Math.max(0, currentStageIdx - 1);
        const toStage = APPROVAL_STAGE_ORDER[prevIdx];
        await sendBack.mutateAsync({
          fromStage: currentStage,
          toStage,
          comment: trimmedComment,
        });
      } else {
        await reject.mutateAsync({
          stage: currentStage,
          comment: trimmedComment,
        });
      }
      router.push(`/enterprise/sow/${sow.id}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to submit decision");
    }
  };

  const isPending =
    submit.isPending || approve.isPending || sendBack.isPending || reject.isPending;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link
        href={`/enterprise/sow/${sow.id}`}
        className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-tertiary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to SOW
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Approval · Version {sow.activeVersion}
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {sow.title}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
          <span
            className={cn(
              "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold",
              statusPillCls(sow.status),
            )}
          >
            {STATUS_LABEL[sow.status]}
          </span>
          {currentStage && inApproval && (
            <>
              <span aria-hidden>·</span>
              <span>
                Your turn ·{" "}
                <span className="font-medium text-text-secondary">{STAGE_LABEL[currentStage]}</span>
              </span>
            </>
          )}
          {commercialWait && (
            <>
              <span aria-hidden>·</span>
              <span className="font-medium text-brand">Glimmora Commercial</span>
            </>
          )}
        </div>
      </header>

      {/* Primary workspace — decision or submit first */}
      {isDraft && (
        <DashboardSection
          title="Submit for approval"
          description="Starts the five-stage pipeline: Finance → Commercial → Legal → Security → Final sign-off."
        >
          <SubmitPanel
            onSubmit={onSubmitDraft}
            isPending={submit.isPending}
            error={actionError}
          />
        </DashboardSection>
      )}

      {canDecide && currentStage && (
        <DashboardSection
          eyebrow={`Stage ${currentStageIdx + 1} of 5`}
          title={STAGE_LABEL[currentStage]}
          description={approveStageDescription(currentStage)}
        >
          <DecisionPanel
            stage={currentStage}
            decision={decision}
            onDecisionChange={setDecision}
            comment={comment}
            onCommentChange={setComment}
            onSubmit={onSubmitDecision}
            isPending={isPending}
            error={actionError}
            sowId={sow.id}
          />
        </DashboardSection>
      )}

      {commercialWait && (
        <WaitBanner
          title="Awaiting Glimmora Commercial"
          body="Business approval is complete. Glimmora Commercial confirms staffing, rates, and scope viability — you’ll be notified when Legal can continue on the enterprise side."
        />
      )}

      {sow.status === "rejected" && (
        <DashboardSection
          title="Pipeline ended"
          description="This SOW was rejected and cannot be resubmitted from here."
        >
          <div className="space-y-3">
            {lastRejection?.comment && (
              <blockquote className="border-l-2 border-error-border pl-3 font-body text-[13px] text-text-secondary leading-relaxed">
                {lastRejection.comment}
              </blockquote>
            )}
            <Link
              href={`/enterprise/sow/${sow.id}`}
              className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
            >
              Review SOW record
            </Link>
          </div>
        </DashboardSection>
      )}

      {terminal && sow.status !== "rejected" && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 font-body text-[13px]",
            sow.status === "approved"
              ? "border-success-border bg-success-subtle text-success-text"
              : "border-stroke-subtle bg-surface text-text-secondary",
          )}
        >
          This SOW is <strong className="font-semibold">{STATUS_LABEL[sow.status]}</strong> and is
          no longer in the approval pipeline.
          {sow.status === "approved" && (
            <>
              {" "}
              <Link
                href="/enterprise/decomposition"
                className="font-semibold underline underline-offset-2 hover:opacity-80"
              >
                Decompose SOW
              </Link>
            </>
          )}
        </div>
      )}

      <DashboardSection
        title="Pipeline progress"
        description="Finance → Commercial → Legal → Security → Final sign-off"
      >
        <ApprovalStepper
          approvals={sow.approvals}
          currentStage={sow.stage}
          status={sow.status}
          submission={submission}
        />
      </DashboardSection>

      <DashboardSection title="Decision history">
        <ApprovalsLog approvals={sow.approvals} submission={submission} />
      </DashboardSection>
    </div>
  );
}

function SubmitPanel({
  onSubmit,
  isPending,
  error,
}: {
  onSubmit: () => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {SUBMIT_CHECKLIST.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 font-body text-[13px] text-text-secondary"
          >
            <Check className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      {error && <p className="font-body text-[12px] text-error-text">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
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
          ) : (
            <>
              <Send className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              Submit for approval
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DecisionPanel({
  stage,
  decision,
  onDecisionChange,
  comment,
  onCommentChange,
  onSubmit,
  isPending,
  error,
  sowId,
}: {
  stage: SowStage;
  decision: Decision;
  onDecisionChange: (d: Decision) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string | null;
  sowId: string;
}) {
  const needsComment = decision === "send_back" || decision === "reject";

  return (
    <div className="space-y-4">
      <ul className="space-y-1.5">
        {STAGE_CHECKLIST[stage].map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 font-body text-[12.5px] text-text-secondary"
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

      {needsComment && (
        <div>
          <label
            htmlFor="approval-comment"
            className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
          >
            Comment (required)
          </label>
          <textarea
            id="approval-comment"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
            placeholder="Explain why you're sending back or rejecting…"
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

      {decision === "approve" && (
        <div>
          <label
            htmlFor="approval-comment-optional"
            className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
          >
            Comment (optional)
          </label>
          <textarea
            id="approval-comment-optional"
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
          href={`/enterprise/sow/${sowId}`}
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
            "bg-foreground text-background font-body text-[13px] font-semibold",
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
              Approve stage
            </>
          ) : decision === "send_back" ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Send back
            </>
          ) : (
            <>
              <Ban className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Reject SOW
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const DECISION_OPTIONS: Array<{
  value: Decision;
  label: string;
  short: string;
}> = [
  { value: "approve", label: "Approve", short: "Advance pipeline" },
  { value: "send_back", label: "Send back", short: "Return with feedback" },
  { value: "reject", label: "Reject", short: "End pipeline" },
];

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
    <div
      role="radiogroup"
      aria-label="Approval decision"
      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
    >
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
            <span className="block font-body text-[13px] font-semibold text-foreground">
              {opt.label}
            </span>
            <span className="block font-body text-[11px] text-text-tertiary mt-0.5">{opt.short}</span>
          </button>
        );
      })}
    </div>
  );
}

function WaitBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-brand/25 bg-brand-subtle/15 px-4 py-3 flex items-start gap-2.5">
      <Clock className="h-4 w-4 text-brand shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <div className="min-w-0">
        <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 font-body text-[12.5px] text-text-secondary leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ─── Pipeline stepper (matches detail page) ─── */

type StageState = "approved" | "current" | "waiting" | "rejected" | "sent_back";

function resolveStageState(
  stage: SowStage,
  currentStage: SowStage | null,
  status: SowStatus,
  decision: SowApprovalSummary | undefined,
): StageState {
  if (decision?.decision === "approved") return "approved";
  if (decision?.decision === "rejected") return "rejected";
  if (decision?.decision === "send_back") return "sent_back";
  if (status === "approval" && currentStage === stage) return "current";
  return "waiting";
}

function ApprovalStepper({
  approvals,
  currentStage,
  status,
  submission,
}: {
  approvals: SowApprovalSummary[];
  currentStage: SowStage | null;
  status: SowStatus;
  submission: IntakeSubmissionPayload | null;
}) {
  const decisionByStage = new Map<SowStage, SowApprovalSummary>();
  for (const a of approvals) {
    const existing = decisionByStage.get(a.stage);
    if (!existing || new Date(a.createdAt) > new Date(existing.createdAt)) {
      decisionByStage.set(a.stage, a);
    }
  }

  if (status === "draft") {
    return (
      <p className="font-body text-[13px] text-text-tertiary">
        Submit this draft to start the five-stage approval pipeline.
      </p>
    );
  }

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
      {APPROVAL_STAGE_ORDER.map((stage, i) => {
        const decision = decisionByStage.get(stage);
        const state = resolveStageState(stage, currentStage, status, decision);
        const assignedName =
          approverDisplayName(decision?.approverId, submission, stage) ??
          submission?.approvers[stage]?.name ??
          null;

        return (
          <li key={stage} className="relative min-w-0">
            {i < APPROVAL_STAGE_ORDER.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:block absolute top-3 left-[calc(50%+12px)] right-0 h-px bg-stroke-subtle"
              />
            )}
            <StageNode
              label={STAGE_LABEL[stage]}
              state={state}
              decision={decision}
              assignedName={assignedName}
            />
          </li>
        );
      })}
    </ol>
  );
}

function StageNode({
  label,
  state,
  decision,
  assignedName,
}: {
  label: string;
  state: StageState;
  decision: SowApprovalSummary | undefined;
  assignedName: string | null;
}) {
  const Icon =
    state === "approved"
      ? CheckCircle2
      : state === "current"
        ? Clock
        : state === "rejected"
          ? XCircle
          : state === "sent_back"
            ? AlertTriangle
            : Circle;

  const iconCls =
    state === "approved"
      ? "text-success-text"
      : state === "current"
        ? "text-brand"
        : state === "rejected"
          ? "text-error-text"
          : state === "sent_back"
            ? "text-warning-text"
            : "text-text-disabled";

  const caption =
    state === "approved" && decision?.decidedAt
      ? `Approved · ${timeAgo(decision.decidedAt)}`
      : state === "current"
        ? assignedName ? `Waiting · ${assignedName}` : "In progress"
        : state === "rejected"
          ? "Rejected"
          : state === "sent_back"
            ? "Sent back"
            : assignedName
              ? assignedName
              : "Pending";

  return (
    <div className="flex sm:flex-col sm:items-center gap-2 sm:gap-1.5 sm:text-center">
      <span
        className={cn(
          "grid place-items-center h-6 w-6 rounded-full border shrink-0",
          state === "current" && "border-brand bg-brand-subtle",
          state === "approved" && "border-success-border bg-success-subtle",
          state === "waiting" && "border-stroke-subtle bg-surface",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconCls)} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="font-body text-[12px] font-semibold text-foreground">{label}</p>
        <p
          className={cn(
            "font-body text-[10.5px] truncate",
            state === "current" ? "text-brand font-medium" : "text-text-tertiary",
          )}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}

function ApprovalsLog({
  approvals,
  submission,
}: {
  approvals: SowApprovalSummary[];
  submission: IntakeSubmissionPayload | null;
}) {
  if (approvals.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary py-2">
        No approval decisions yet. Submit the draft to start the pipeline.
      </p>
    );
  }

  const sorted = [...approvals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ul className="divide-y divide-stroke-subtle -mx-5">
      {sorted.map((a) => {
        const meta = [
          a.decision.replace(/_/g, " "),
          a.decidedAt ? timeAgo(a.decidedAt) : "pending",
          a.approverId
            ? approverDisplayName(a.approverId, submission, a.stage) ?? ownerLabel(a.approverId)
            : submission?.approvers[a.stage]?.name,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li key={a.id} className="px-5 py-2.5">
            <div className="flex items-center justify-between gap-4 min-h-[44px]">
              <span className="font-body text-[13px] font-medium text-foreground">
                {STAGE_LABEL[a.stage]}
                <span className="ml-2 font-mono text-[10px] text-text-tertiary">v{a.sowVersion}</span>
              </span>
              <span
                className={cn(
                  "font-body text-[11px] text-right truncate max-w-[50%]",
                  a.decision === "rejected" || a.decision === "send_back"
                    ? "text-warning-text font-medium"
                    : "text-text-tertiary",
                )}
              >
                {meta}
              </span>
            </div>
            {a.comment && (
              <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
                {a.comment}
              </p>
            )}
            {a.slaDeadline && a.decision === "pending" && (
              <p className="mt-1 font-body text-[11px] text-warning-text">
                SLA · decide by {formatDate(a.slaDeadline)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ApproveSkeleton() {
  return (
    <div className="space-y-5 pb-12">
      <Skeleton className="h-4 w-24 rounded" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-7 w-80 max-w-full rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
