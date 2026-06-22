/**
 * Enterprise approvers — two-gate model (no per-stage picker).
 */

import {
  defaultApproverForStageMock,
  defaultApproversByStage as defaultApproversByStageMock,
  listApproversForStageMock,
  STAGE_LABEL,
  STAGE_SLA_HOURS,
  type ApproverCandidate,
  type SowApprovalStageKey,
} from "@/lib/enterprise/mocks/approvers";

export type { ApproverCandidate, SowApprovalStageKey };

export { STAGE_LABEL, STAGE_SLA_HOURS };

export function listApproversForStage(stage: SowApprovalStageKey): ApproverCandidate[] {
  return listApproversForStageMock(stage);
}

export function defaultApproverForStage(stage: SowApprovalStageKey): ApproverCandidate {
  return defaultApproverForStageMock(stage);
}

export function defaultApproversByStage(): Record<SowApprovalStageKey, ApproverCandidate> {
  return defaultApproversByStageMock();
}
