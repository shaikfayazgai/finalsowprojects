"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { PlanStatus, TaskStatus } from "@/lib/decomposition/types";

const PLAN_VARIANT: Record<PlanStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  draft: "beige",
  approved: "blue",
  active: "forest",
  archived: "glass",
};

const PLAN_LABEL: Record<PlanStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  active: "Active",
  archived: "Archived",
};

const TASK_VARIANT: Record<TaskStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  draft: "beige",
  ready: "gold",
  matched: "blue",
  in_progress: "blue",
  submitted: "teal",
  reviewed: "teal",
  accepted: "forest",
  cancelled: "danger",
};

const TASK_LABEL: Record<TaskStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  matched: "Matched",
  in_progress: "In progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
  accepted: "Accepted",
  cancelled: "Cancelled",
};

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  return (
    <Badge variant={PLAN_VARIANT[status]} dot size="sm">
      {PLAN_LABEL[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={TASK_VARIANT[status]} size="sm">
      {TASK_LABEL[status]}
    </Badge>
  );
}
