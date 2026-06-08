import type { ContributorTaskSummary } from "@/lib/api/contributor-tasks";
import {
  deriveContributorStatus,
  type ContributorStatusLabel,
} from "@/components/contributor/task-status-badge";

/** Tabs/filters within the Assigned lane only — not Submissions or Revisions nav. */
export type AssignedBucketKey = "all" | "ready" | "in_progress";

/** @deprecated Use AssignedBucketKey — kept for gradual migration */
export type BucketKey = AssignedBucketKey | "awaiting" | "revision";

export function contributorStatus(t: ContributorTaskSummary): ContributorStatusLabel {
  return deriveContributorStatus(t.status, t.latestSubmission?.status);
}

/** Submissions nav — handed off, waiting on reviewer. */
export function isSubmissionLaneTask(t: ContributorTaskSummary): boolean {
  const l = contributorStatus(t);
  return l === "submitted" || l === "under_review" || l === "resubmitted";
}

/** Revisions nav — mentor returned feedback. */
export function isRevisionLaneTask(t: ContributorTaskSummary): boolean {
  return contributorStatus(t) === "feedback_requested";
}

/** Assigned nav — contributor must act to advance (excludes review + revision queues). */
export function isAssignedLaneTask(t: ContributorTaskSummary): boolean {
  const l = contributorStatus(t);
  if (l === "accepted" || l === "rejected") return false;
  if (isSubmissionLaneTask(t) || isRevisionLaneTask(t)) return false;
  return true;
}

/** @deprecated Alias for isAssignedLaneTask */
export const isAssignedListTask = isAssignedLaneTask;

export function assignedBucketOf(
  t: ContributorTaskSummary,
): Exclude<AssignedBucketKey, "all"> {
  if (contributorStatus(t) === "assigned") return "ready";
  return "in_progress";
}

/** @deprecated Use assignedBucketOf for Assigned page */
export function bucketOf(t: ContributorTaskSummary): BucketKey {
  if (isRevisionLaneTask(t)) return "revision";
  if (isSubmissionLaneTask(t)) return "awaiting";
  return assignedBucketOf(t);
}

export function countWorkLanes(items: ContributorTaskSummary[]) {
  let assigned = 0;
  let ready = 0;
  let inProgress = 0;
  let submissions = 0;
  let revisions = 0;
  for (const t of items) {
    if (isRevisionLaneTask(t)) {
      revisions++;
    } else if (isSubmissionLaneTask(t)) {
      submissions++;
    } else if (isAssignedLaneTask(t)) {
      assigned++;
      if (assignedBucketOf(t) === "ready") ready++;
      else inProgress++;
    }
  }
  return { assigned, ready, inProgress, submissions, revisions };
}

export const ASSIGNED_BUCKET_LABEL: Record<Exclude<AssignedBucketKey, "all">, string> = {
  ready: "Ready to start",
  in_progress: "In progress",
};

export const ASSIGNED_BUCKET_ORDER: Array<Exclude<AssignedBucketKey, "all">> = [
  "ready",
  "in_progress",
];

/** @deprecated Use ASSIGNED_BUCKET_* */
export const BUCKET_LABEL: Record<Exclude<BucketKey, "all">, string> = {
  in_progress: "In progress",
  awaiting: "Awaiting review",
  ready: "Ready to start",
  revision: "Revisions",
};

/** @deprecated Use ASSIGNED_BUCKET_ORDER */
export const BUCKET_ORDER: Array<Exclude<BucketKey, "all">> = [
  "revision",
  "ready",
  "in_progress",
  "awaiting",
];

export function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function deadlineMs(t: ContributorTaskSummary): number | null {
  if (t.submitByAt) return new Date(t.submitByAt).getTime();
  if (!t.assignedAt || t.estimatedHours === null) return null;
  return new Date(t.assignedAt).getTime() + t.estimatedHours * 3_600_000;
}

/** Relative delivery deadline — when the contributor should submit by. */
export function fmtDeliveryDeadline(t: ContributorTaskSummary): {
  text: string;
  overdue: boolean;
} {
  const ms = deadlineMs(t);
  if (ms === null) return { text: "—", overdue: false };
  const diff = ms - Date.now();
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  let part: string;
  if (abs < 3_600_000) part = `${Math.max(1, Math.floor(abs / 60_000))}m`;
  else if (abs < 86_400_000) part = `${Math.floor(abs / 3_600_000)}h`;
  else part = `${Math.floor(abs / 86_400_000)}d`;
  return {
    text: overdue ? `Submit-by overdue ${part}` : `Submit in ${part}`,
    overdue,
  };
}

/** @deprecated Use fmtDeliveryDeadline */
export function fmtDue(t: ContributorTaskSummary): { text: string; overdue: boolean } {
  return fmtDeliveryDeadline(t);
}

export function readinessPct(t: ContributorTaskSummary): number {
  const l = contributorStatus(t);
  switch (l) {
    case "assigned":
      return 0;
    case "in_progress":
      return 25;
    case "draft":
      return 50;
    case "feedback_requested":
      return 60;
    case "resubmitted":
      return 90;
    case "submitted":
    case "under_review":
      return 100;
    case "accepted":
      return 100;
    case "rejected":
      return 0;
    default:
      return 0;
  }
}

export function fmtPayout(t: ContributorTaskSummary): string | null {
  if (!t.agreedRatePerHour || !t.agreedCurrency || t.estimatedHours === null) return null;
  const total = t.agreedRatePerHour * t.estimatedHours;
  const symbol =
    t.agreedCurrency === "INR" ? "₹" : t.agreedCurrency === "USD" ? "$" : `${t.agreedCurrency} `;
  return `${symbol}${Math.round(total).toLocaleString("en-IN")}`;
}

/** Full label for accept modal and workroom context. */
export function fmtEstimatedPayoutOnAcceptance(t: ContributorTaskSummary): string | null {
  const amount = fmtPayout(t);
  if (!amount) return null;
  return `Estimated payout on acceptance: ${amount}`;
}

/** Shown near accept / payout context — fixed scope, not a timesheet. */
export const CONTRIBUTOR_PAYMENT_NOTE =
  "Pay is based on the agreed estimate when your work is accepted — not hours logged in the portal.";

const MENTOR_REVIEW_SLA_HOURS = 48;

/** Mentor review window after submit (not contributor work time). */
export function fmtMentorReviewWindow(
  submittedAt: string | null,
  status: string,
): { text: string; warn: boolean; overdue: boolean } {
  const reviewStatuses = new Set(["under_review", "submitted", "resubmitted"]);
  if (!reviewStatuses.has(status) || !submittedAt) {
    return { text: "—", warn: false, overdue: false };
  }
  const deadline = new Date(submittedAt).getTime() + MENTOR_REVIEW_SLA_HOURS * 3_600_000;
  const diff = deadline - Date.now();
  if (diff < 0) {
    const abs = Math.abs(diff);
    const part =
      abs < 3_600_000
        ? `${Math.floor(abs / 60_000)}m`
        : abs < 86_400_000
          ? `${Math.floor(abs / 3_600_000)}h`
          : `${Math.floor(abs / 86_400_000)}d`;
    return { text: `Review window overdue ${part}`, warn: false, overdue: true };
  }
  const part =
    diff < 3_600_000
      ? `${Math.floor(diff / 60_000)}m`
      : diff < 86_400_000
        ? `${Math.floor(diff / 3_600_000)}h`
        : `${Math.floor(diff / 86_400_000)}d`;
  return {
    text: `Review window ${part}`,
    warn: diff < 4 * 3_600_000,
    overdue: false,
  };
}

export function nextActionLabel(t: ContributorTaskSummary): string {
  const l = contributorStatus(t);
  if (t.status === "matched" && !t.acceptedAt) return "Review assignment";
  if (t.status === "blocked") return "View blocker";
  if (t.status === "awaiting_clarification") return "View thread";
  switch (l) {
    case "draft":
    case "in_progress":
      return "Continue work";
    default:
      return "Open workroom";
  }
}

export function statusChipForLabel(
  label: ContributorStatusLabel,
): "success" | "warning" | "error" | "info" | "pending" | "neutral" {
  switch (label) {
    case "feedback_requested":
      return "warning";
    case "submitted":
    case "under_review":
    case "resubmitted":
      return "pending";
    case "accepted":
      return "success";
    case "rejected":
      return "error";
    case "draft":
    case "in_progress":
      return "info";
    case "assigned":
      return "neutral";
  }
}

export function rowMeta(t: ContributorTaskSummary): { text: string; overdue: boolean } {
  const due = fmtDeliveryDeadline(t);
  const tenant = t.sow?.tenantName;
  const parts = [tenant, due.text !== "—" ? due.text : null].filter(Boolean);
  return {
    text: parts.length > 0 ? parts.join(" · ") : fmtRelative(t.updatedAt),
    overdue: due.overdue,
  };
}

export type { ContributorStatusLabel };
