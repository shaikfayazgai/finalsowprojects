import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";
import type { SubmissionStatus } from "@/lib/submissions/types";

type StatusChipVariant = NonNullable<StatusChipProps["status"]>;

export function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function fmtSubmittedAt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function submissionStatusLabel(s: SubmissionStatus): string {
  switch (s) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under review";
    case "resubmitted":
      return "Resubmitted";
    case "feedback_requested":
      return "Revision requested";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "draft":
      return "Draft";
    default:
      return (s as string).replace(/_/g, " ");
  }
}

export function submissionStatusChip(s: SubmissionStatus): StatusChipVariant {
  switch (s) {
    case "accepted":
      return "success";
    case "rejected":
      return "error";
    case "feedback_requested":
      return "warning";
    case "submitted":
    case "under_review":
    case "resubmitted":
      return "pending";
    default:
      return "neutral";
  }
}

export function isActiveReviewStatus(s: SubmissionStatus): boolean {
  return s === "submitted" || s === "under_review" || s === "resubmitted";
}

export function reviewerLabel(name: string | null | undefined, id: string | null): string {
  if (name) return name;
  if (id) return id.replace(/^mentor-/, "").replace(/-/g, " ");
  // No reviewer assigned yet = the submission is still waiting for a mentor to pick
  // it up. "Awaiting assignment" read as if the *task* wasn't assigned to anyone.
  return "Awaiting mentor";
}

export function fmtSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function splitCriteria(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/\r?\n|(?:^|\s)[•·▪►-]\s+/g)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}
