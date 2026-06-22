"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Maps TaskDefinition.status + the latest submission status into a
 * single contributor-facing label.
 *
 * The combined status reflects what the contributor needs to know now:
 *   - Their task can be in 'matched' (assigned, not accepted yet) etc.
 *   - Once accepted, the latest submission's status drives the label
 *     because that's what the contributor is actually doing.
 */
export type ContributorStatusLabel =
  | "assigned"
  | "in_progress"
  | "draft"
  | "submitted"
  | "under_review"
  | "feedback_requested"
  | "resubmitted"
  | "accepted"
  | "rejected";

const LABELS: Record<ContributorStatusLabel, string> = {
  assigned: "Opportunity",
  in_progress: "In progress",
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  feedback_requested: "Revision",
  resubmitted: "Resubmitted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const VARIANTS: Record<
  ContributorStatusLabel,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  assigned: "beige",
  in_progress: "blue",
  draft: "beige",
  submitted: "teal",
  under_review: "teal",
  feedback_requested: "gold",
  resubmitted: "teal",
  accepted: "forest",
  rejected: "danger",
};

export function deriveContributorStatus(
  taskStatus: string,
  submissionStatus: string | null | undefined,
): ContributorStatusLabel {
  // Once there's a submission row, that's what the contributor sees
  if (submissionStatus) {
    if (
      submissionStatus === "draft" ||
      submissionStatus === "submitted" ||
      submissionStatus === "under_review" ||
      submissionStatus === "feedback_requested" ||
      submissionStatus === "resubmitted" ||
      submissionStatus === "accepted" ||
      submissionStatus === "rejected"
    ) {
      return submissionStatus;
    }
  }
  if (taskStatus === "matched") return "assigned";
  if (taskStatus === "blocked" || taskStatus === "awaiting_clarification") return "in_progress";
  if (taskStatus === "in_progress") return "in_progress";
  if (taskStatus === "accepted") return "accepted";
  if (taskStatus === "submitted") return "submitted";
  if (taskStatus === "reviewed") return "rejected"; // mentor rejected
  return "assigned";
}

export function ContributorStatusBadge({
  taskStatus,
  submissionStatus,
}: {
  taskStatus: string;
  submissionStatus?: string | null;
}) {
  const label = deriveContributorStatus(taskStatus, submissionStatus);
  return (
    <Badge variant={VARIANTS[label]} dot size="sm">
      {LABELS[label]}
    </Badge>
  );
}

/**
 * Priority order used for sorting the task list: tasks that need the
 * contributor's attention now bubble to the top.
 *
 * From spec §5.D.1 decision heuristic:
 *   revision → ready (draft) → in_progress → submitted → under_review → assigned → accepted
 */
export function statusPriority(label: ContributorStatusLabel): number {
  const order: ContributorStatusLabel[] = [
    "feedback_requested",
    "draft",
    "in_progress",
    "resubmitted",
    "submitted",
    "under_review",
    "assigned",
    "rejected",
    "accepted",
  ];
  const idx = order.indexOf(label);
  return idx === -1 ? 999 : idx;
}
