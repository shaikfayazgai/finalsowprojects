/**
 * SOW intake approvers — enterprise internal gates (finance → security →
 * legal) then the Glimmora platform gate (last). Enterprise gates are owned
 * by their role holders; platform is Glimmora-only and auto-routed.
 */

import type { SowStage } from "@/lib/sow/types";
import { STAGE_LABEL, STAGE_SLA_HOURS } from "@/lib/sow/approval-pipeline";

export type SowApprovalStageKey = SowStage;

export type { SowStage };
export { STAGE_LABEL, STAGE_SLA_HOURS };

export interface ApproverCandidate {
  id: string;
  name: string;
  email: string;
  role: string;
  default?: boolean;
  auto?: boolean;
}

/** Intake no longer assigns per-stage people; kept for payload shape compatibility. */
export function defaultApproversByStage(): Record<SowApprovalStageKey, ApproverCandidate> {
  return {
    finance: {
      id: "u-ent-finance",
      name: "Finance reviewer",
      email: "finance@tenant",
      role: "Enterprise · Finance gate",
      default: true,
    },
    security: {
      id: "u-ent-security",
      name: "Security reviewer",
      email: "security@tenant",
      role: "Enterprise · Security gate",
      default: true,
    },
    legal: {
      id: "u-ent-legal",
      name: "Legal reviewer",
      email: "legal@tenant",
      role: "Enterprise · Legal gate",
      default: true,
    },
    tenant_admin: {
      id: "u-ent-admin",
      name: "Tenant admin",
      email: "admin@tenant",
      role: "Enterprise · Tenant admin sign-off",
      default: true,
    },
    platform: {
      id: "u-glimmora-superadmin",
      name: "Super admin",
      email: "admin@glimmora.ai",
      role: "Super admin gate (final)",
      default: true,
      auto: true,
    },
  };
}

export function listApproversForStageMock(_stage: SowApprovalStageKey): ApproverCandidate[] {
  return [];
}

export function defaultApproverForStageMock(stage: SowApprovalStageKey): ApproverCandidate {
  return defaultApproversByStage()[stage];
}
