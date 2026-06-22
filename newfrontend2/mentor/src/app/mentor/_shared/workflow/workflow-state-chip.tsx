"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import {
  type WorkflowState,
  workflowStateLabel,
} from "@/mocks/data/mentor-rework-escalation";

/**
 * Canonical visual treatment for every governance workflow state.
 * Maps the WorkflowState union to a tone + chip style so list pages,
 * timelines, and detail headers all use one grammar.
 */
const tone: Record<
  WorkflowState,
  { chip: string; dot: string; label?: string }
> = {
  pending:                 { chip: "border-gray-200 bg-gray-50 text-gray-600",       dot: "bg-gray-400" },
  rework:                  { chip: "border-gold-200 bg-gold-50 text-gold-700",       dot: "bg-gold-500" },
  rework_requested:        { chip: "border-gold-200 bg-gold-50 text-gold-700",       dot: "bg-gold-500" },
  awaiting_contributor:    { chip: "border-gold-200 bg-gold-50 text-gold-700",       dot: "bg-gold-500" },
  revision_submitted:      { chip: "border-teal-200 bg-teal-50 text-teal-700",       dot: "bg-teal-500" },
  pending_validation:      { chip: "border-teal-200 bg-teal-50 text-teal-700",       dot: "bg-teal-500" },
  in_progress:             { chip: "border-teal-200 bg-teal-50 text-teal-700",       dot: "bg-teal-500" },
  ai_ready:                { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500" },
  overdue:                 { chip: "border-red-200 bg-red-50 text-red-700",          dot: "bg-red-500" },
  escalated:               { chip: "border-red-200 bg-red-50 text-red-700",          dot: "bg-red-500" },
  escalation_routed:       { chip: "border-red-200 bg-red-50 text-red-700",          dot: "bg-red-500" },
  escalation_under_review: { chip: "border-red-200 bg-red-50 text-red-700",          dot: "bg-red-500" },
  escalation_resolved:     { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500" },
  governance_hold:         { chip: "border-brown-200 bg-brown-50 text-brown-700",    dot: "bg-brown-500" },
  hold_released:           { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500" },
  blocked:                 { chip: "border-brown-200 bg-brown-50 text-brown-700",    dot: "bg-brown-500" },
  clarification_pending:   { chip: "border-teal-200 bg-teal-50 text-teal-700",       dot: "bg-teal-500" },
  policy_review:           { chip: "border-brown-200 bg-brown-50 text-brown-700",    dot: "bg-brown-500" },
  closed:                  { chip: "border-gray-200 bg-gray-50 text-gray-600",       dot: "bg-gray-400" },
};

export function WorkflowStateChip({
  state,
  size = "md",
}: {
  state: WorkflowState;
  size?: "sm" | "md";
}) {
  const t = tone[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-semibold uppercase tracking-wider",
        size === "sm" ? "px-1.5 py-[1px] text-[9.5px]" : "px-2 py-0.5 text-[10px]",
        t.chip
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {workflowStateLabel[state]}
    </span>
  );
}
