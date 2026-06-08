"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { SowStage, SowStatus } from "@/lib/sow/types";

const STATUS_VARIANT: Record<SowStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  draft: "beige",
  approval: "blue",
  approved: "forest",
  rejected: "danger",
  withdrawn: "brown",
  archived: "glass",
};

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: "Draft",
  approval: "In approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

const STAGE_LABEL: Record<SowStage, string> = {
  business: "Business",
  commercial: "Commercial",
  legal: "Legal",
  security: "Security",
  final: "Final sign-off",
};

export function SowStatusBadge({ status }: { status: SowStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} dot size="sm">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function SowStageBadge({ stage }: { stage: SowStage | null | undefined }) {
  if (!stage) return null;
  return (
    <Badge variant="gold" size="sm">
      {STAGE_LABEL[stage]} stage
    </Badge>
  );
}

export function stageLabel(stage: SowStage): string {
  return STAGE_LABEL[stage];
}
