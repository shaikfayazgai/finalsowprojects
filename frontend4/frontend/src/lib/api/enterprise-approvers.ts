/**
 * Enterprise approver pool — SOW intake Step 3.
 *
 * MOCK MODE: reads from src/lib/enterprise/mocks/approvers.ts.
 *
 * Backend replacement:
 *   GET /api/enterprise/approvers?stage=business → ApproverCandidate[]
 */

import {
  defaultApproverForStageMock,
  listApproversForStageMock,
  STAGE_LABEL,
  STAGE_SLA_HOURS,
  type ApproverCandidate,
  type SowApprovalStageKey,
} from "@/lib/enterprise/mocks/approvers";

export type {
  ApproverCandidate,
  SowApprovalStageKey,
};

export { STAGE_LABEL, STAGE_SLA_HOURS };

export function listApproversForStage(stage: SowApprovalStageKey): ApproverCandidate[] {
  // return fetchInternal(`/api/enterprise/approvers?stage=${stage}`).then(...)
  return listApproversForStageMock(stage);
}

export function defaultApproverForStage(stage: SowApprovalStageKey): ApproverCandidate {
  return defaultApproverForStageMock(stage);
}

export function defaultApproversByStage(): Record<SowApprovalStageKey, ApproverCandidate> {
  const stages: SowApprovalStageKey[] = ["business", "legal", "security", "commercial", "final"];
  return Object.fromEntries(stages.map((s) => [s, defaultApproverForStage(s)])) as Record<
    SowApprovalStageKey,
    ApproverCandidate
  >;
}
