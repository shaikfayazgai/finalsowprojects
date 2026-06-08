/**
 * Approver pool mock for SOW intake Step 3. Per-stage picker fills
 * from these candidates. Commercial is fixed to the Glimmora team.
 *
 * Backend handoff:
 *   GET /api/enterprise/approvers?stage=  → ApproverCandidate[]
 */

export type SowApprovalStageKey = "business" | "commercial" | "legal" | "security" | "final";

export interface ApproverCandidate {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Default option for this stage? */
  default?: boolean;
  /** Read-only / auto-assigned (e.g. Glimmora Commercial team)? */
  auto?: boolean;
}

/** Per-stage SLA in hours — Phase 1 policy default. */
export const STAGE_SLA_HOURS: Record<SowApprovalStageKey, number> = {
  business: 48,
  commercial: 48,
  legal: 48,
  security: 48,
  final: 48,
};

// Per the locked GTPROJECT flow, the enterprise internal gates are Finance /
// Security / Legal — and they are all approved by the Enterprise Admin directly
// (no separate named approver people). The underlying stage KEYS are kept
// (business/commercial/legal/security/final) so existing SOWs don't break; only
// the display labels + approver pool changed. "commercial" stays the Glimmora
// auto step; "final" is the enterprise final sign-off.
export const STAGE_LABEL: Record<SowApprovalStageKey, string> = {
  business: "Finance",
  commercial: "Commercial",
  legal: "Legal",
  security: "Security",
  final: "Final sign-off",
};

// Single approver for every enterprise stage = the Enterprise Admin. Commercial
// remains the auto-assigned Glimmora step.
const ENTERPRISE_ADMIN: ApproverCandidate = {
  id: "u-enterprise-admin",
  name: "Enterprise Admin",
  email: "",
  role: "Enterprise Admin",
  default: true,
};

const APPROVERS: Record<SowApprovalStageKey, ApproverCandidate[]> = {
  business: [ENTERPRISE_ADMIN],
  commercial: [
    { id: "u-glimmora-com", name: "Glimmora Commercial team", email: "commercial@glimmora.ai", role: "Auto-assigned", default: true, auto: true },
  ],
  legal: [ENTERPRISE_ADMIN],
  security: [ENTERPRISE_ADMIN],
  final: [ENTERPRISE_ADMIN],
};

export function listApproversForStageMock(stage: SowApprovalStageKey): ApproverCandidate[] {
  return APPROVERS[stage];
}

export function defaultApproverForStageMock(stage: SowApprovalStageKey): ApproverCandidate {
  return APPROVERS[stage].find((a) => a.default) ?? APPROVERS[stage][0]!;
}
