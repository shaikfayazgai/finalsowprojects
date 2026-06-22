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
  FileText,
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
  STAGE_LABEL,
  isEnterpriseStage,
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
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { canViewSowByConfidentiality } from "@/lib/sow/confidentiality-access";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  TONE,
  type Tone,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
  dangerBtnClass,
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

type Decision = "approve" | "send_back" | "reject";

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: "Draft",
  approval: "In approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

function statusTone(s: SowStatus): Tone {
  switch (s) {
    case "draft":
      return "neutral";
    case "approval":
      return "ai";
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "neutral";
  }
}

function approveStageDescription(stage: SowStage): string {
  switch (stage) {
    case "finance":
      return "Finance review — confirm budget, rates, and payment terms.";
    case "security":
      return "Security review — confirm data handling and access controls.";
    case "legal":
      return "Legal review — confirm contractual and compliance terms.";
    case "platform":
      return "Glimmora platform approval — final gate before delivery.";
    default:
      return "Advance to the next gate.";
  }
}

const STAGE_CHECKLIST: Record<SowStage, string[]> = {
  finance: [
    "Budget and rate cards reviewed",
    "Payment terms confirmed",
  ],
  security: [
    "Data handling and access controls reviewed",
    "Security obligations acceptable",
  ],
  legal: [
    "Contractual terms reviewed",
    "Compliance and confidentiality confirmed",
  ],
  platform: [
    "All enterprise internal gates (Finance, Security, Legal) passed",
    "Scope and deliverables match what was submitted",
    "Ready to assign mentor and provision delivery",
  ],
};

const SUBMIT_CHECKLIST = [
  "Scope and deliverables reviewed on the SOW record",
  "Budget, timeline, and sponsor details confirmed",
  "Enterprise gates run next (Finance → Security → Legal), then Glimmora platform approves",
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

  const { email, roles, meLoading, canActOnStage, isSowOwner } = useEnterpriseAccess();
  const { data: sow, isLoading } = useSow(sowId);
  const submit = useSubmitSow(sowId);
  const approve = useApproveSow(sowId, email);
  const sendBack = useSendBackSow(sowId);
  const reject = useRejectSow(sowId);

  const [decision, setDecision] = React.useState<Decision>("approve");
  const [comment, setComment] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);

  if (isLoading && !sow) return <ApproveSkeleton />;
  if (!sow) {
    return (
      <div className={cn(DASH_CARD, "px-4 py-10 text-center")}>
        <p className="font-body text-[13px] font-semibold text-foreground">SOW not found</p>
      </div>
    );
  }

  const rawPayload = sow.activeVersionDetail?.payload ?? ({} as Record<string, unknown>);
  const canView = canViewSowByConfidentiality({
    confidentiality: sow.confidentiality,
    roles,
    actorEmail: email,
    ownerId: sow.ownerId,
    payload: rawPayload,
  });
  if (meLoading) return <ApproveSkeleton />;
  if (!canView) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Back to SOWs
        </Link>
        <div
          className="rounded-lg border px-4 py-3"
          style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
        >
          <p className="font-body text-[13px] font-semibold text-foreground">Restricted SOW visibility</p>
          <p className="mt-1 font-body text-[12px] text-text-secondary">
            You do not have access to this SOW approval workspace.
          </p>
        </div>
      </div>
    );
  }
  const intake = parseIntakePayload(rawPayload);
  const submission = intake.submission;

  const currentStage = sow.stage;
  const currentStageIdx = currentStage ? APPROVAL_STAGE_ORDER.indexOf(currentStage) : -1;
  const isDraft = sow.status === "draft";
  const inApproval = sow.status === "approval" && !!currentStage;
  // Platform is Glimmora-owned — not actionable in the enterprise portal.
  const platformWait = inApproval && currentStage === "platform";
  const isEnterpriseGate =
    inApproval && currentStage != null && isEnterpriseStage(currentStage);
  const isOwner = isSowOwner(sow.ownerId);
  const canDecide =
    isEnterpriseGate && currentStage != null && canActOnStage(sow.ownerId, currentStage);
  const awaitingGate = isEnterpriseGate && !canDecide;
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
        className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-secondary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to SOW
      </Link>

      <header className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
          <FileText className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Approval · Version {sow.activeVersion}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
              {sow.title}
            </h1>
            <Chip tone={statusTone(sow.status)}>{STATUS_LABEL[sow.status]}</Chip>
          </div>
          {(currentStage && inApproval) || platformWait ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
              {currentStage && inApproval ? (
                <span>
                  Your turn · <span className="font-medium text-text-secondary">{STAGE_LABEL[currentStage]}</span>
                </span>
              ) : null}
              {platformWait ? (
                <span className="font-medium" style={{ color: TONE.ai.text }}>
                  Glimmora platform
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {/* Primary workspace — decision or submit first */}
      {isDraft && (
        <Section
          title="Submit for approval"
          description="Starts approval: Finance → Security → Legal, then Glimmora platform."
        >
          <div className="px-5 sm:px-6 py-5">
            <SubmitPanel
              onSubmit={onSubmitDraft}
              isPending={submit.isPending}
              error={actionError}
            />
          </div>
        </Section>
      )}

      {canDecide && currentStage && (
        <Section
          title={
            <>
              <span className="block font-body text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">
                {`Step ${currentStageIdx + 1} of ${APPROVAL_STAGE_ORDER.length}`}
              </span>
              {STAGE_LABEL[currentStage]}
            </>
          }
          description={approveStageDescription(currentStage)}
        >
          <div className="px-5 sm:px-6 py-5">
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
          </div>
        </Section>
      )}

      {awaitingGate && currentStage && (
        <WaitBanner
          title={`Awaiting ${STAGE_LABEL[currentStage]}`}
          body={
            isOwner
              ? "You submitted this SOW. Each enterprise internal gate is approved by its reviewer (Finance, Security, Legal) — you cannot approve your own submission."
              : `This SOW is waiting for the ${STAGE_LABEL[currentStage]} reviewer to record a decision.`
          }
        />
      )}

      {platformWait && (
        <WaitBanner
          title="Awaiting Glimmora platform"
          body={
            isOwner
              ? "Enterprise internal gates have passed. Glimmora platform is performing the final review before approval."
              : "This SOW is with Glimmora platform for the final approval gate."
          }
        />
      )}

      {sow.status === "rejected" && (
        <Section
          title="Pipeline ended"
          description="This SOW was rejected and cannot be resubmitted from here."
        >
          <div className="px-5 sm:px-6 py-5 space-y-3">
            {lastRejection?.comment && (
              <blockquote
                className="border-l-2 pl-3 font-body text-[13px] text-text-secondary leading-relaxed"
                style={{ borderColor: TONE.error.border }}
              >
                {lastRejection.comment}
              </blockquote>
            )}
            <Link
              href={`/enterprise/sow/${sow.id}`}
              className={secondaryBtnClass}
            >
              Review SOW record
            </Link>
          </div>
        </Section>
      )}

      {terminal && sow.status !== "rejected" && (
        <div
          className="rounded-lg border px-4 py-3 font-body text-[13px]"
          style={
            sow.status === "approved"
              ? { background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }
              : { background: TONE.neutral.soft, borderColor: TONE.neutral.border, color: "var(--color-text-secondary)" }
          }
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

      <Section
        title="Pipeline progress"
        description="Finance → Security → Legal → Glimmora platform"
      >
        <div className="px-5 sm:px-6 py-5">
          <ApprovalStepper
            approvals={sow.approvals}
            currentStage={sow.stage}
            status={sow.status}
            submission={submission}
          />
        </div>
      </Section>

      <Section title="Decision history">
        <ApprovalsLog approvals={sow.approvals} submission={submission} />
      </Section>
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
      {error && <p className="font-body text-[12px]" style={{ color: TONE.error.text }}>{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className={primaryBtnClass}
          style={primaryStyle}
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
              "w-full px-3 py-2 rounded-lg border border-stroke-subtle bg-surface",
              "font-body text-[13px] text-foreground placeholder:text-text-disabled transition-colors",
              "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
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
        <Link href={`/enterprise/sow/${sowId}`} className={secondaryBtnClass}>
          Cancel
        </Link>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className={decision === "reject" ? dangerBtnClass : primaryBtnClass}
          style={decision === "reject" ? undefined : primaryStyle}
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
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected
                ? "border-[var(--c-violet-400)] bg-[var(--color-ai-surface)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                : "border-stroke-subtle bg-surface hover:bg-bg-subtle",
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
    <div
      className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
      style={{ background: TONE.ai.soft, borderColor: TONE.ai.border }}
    >
      <Clock className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
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
        Submit this draft to start the approval flow.
      </p>
    );
  }

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
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
                className="hidden sm:block absolute top-3 left-[calc(50%+12px)] right-0 h-px bg-foreground/[0.10]"
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

  const iconStyle: React.CSSProperties | undefined =
    state === "approved"
      ? { color: TONE.success.text }
      : state === "current"
        ? { color: TONE.ai.text }
        : state === "rejected"
          ? { color: TONE.error.text }
          : state === "sent_back"
            ? { color: TONE.warning.text }
            : undefined;
  const iconCls = state === "waiting" ? "text-text-disabled" : "";

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
          state === "waiting" && "border-stroke-subtle bg-surface",
        )}
        style={
          state === "current"
            ? { borderColor: TONE.ai.border, background: TONE.ai.soft }
            : state === "approved"
              ? { borderColor: TONE.success.border, background: TONE.success.soft }
              : undefined
        }
      >
        <Icon className={cn("h-3.5 w-3.5", iconCls)} style={iconStyle} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="font-body text-[12px] font-semibold text-foreground">{label}</p>
        <p
          className={cn(
            "font-body text-[10.5px] truncate",
            state === "current" ? "font-medium" : "text-text-tertiary",
          )}
          style={state === "current" ? { color: TONE.ai.text } : undefined}
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
      <p className="px-5 sm:px-6 py-5 font-body text-[13px] text-text-tertiary">
        No approval decisions yet. Submit the draft to start the pipeline.
      </p>
    );
  }

  const sorted = [...approvals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ul className="divide-y divide-stroke-subtle">
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
          <li key={a.id} className="px-5 sm:px-6 py-2.5 transition-colors duration-fast hover:bg-bg-subtle">
            <div className="flex items-center justify-between gap-4 min-h-[44px]">
              <span className="font-body text-[13px] font-medium text-foreground">
                {STAGE_LABEL[a.stage]}
                <span className="ml-2 font-mono text-[10px] text-text-tertiary">v{a.sowVersion}</span>
              </span>
              <span
                className={cn(
                  "font-body text-[11px] text-right truncate max-w-[50%]",
                  a.decision === "rejected" || a.decision === "send_back"
                    ? "font-medium"
                    : "text-text-tertiary",
                )}
                style={
                  a.decision === "rejected" || a.decision === "send_back"
                    ? { color: TONE.warning.text }
                    : undefined
                }
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
              <p className="mt-1 font-body text-[11px]" style={{ color: TONE.warning.text }}>
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
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-24" />

      <div className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2.5">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-6 w-56 sm:w-72" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle space-y-1.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-2.5 w-56" />
        </div>
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <Skeleton className="h-3.5 w-full max-w-sm" />
          <Skeleton className="h-3.5 w-5/6 max-w-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <Skeleton className="h-3.5 w-36" />
        </div>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
