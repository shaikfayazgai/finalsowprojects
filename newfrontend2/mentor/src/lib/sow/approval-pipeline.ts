/**
 * SOW approval pipeline — enterprise internal gates first, Glimmora platform last:
 *   1. finance   — Enterprise Finance review        (/enterprise/sow/.../approve)
 *   2. security  — Enterprise Security review       (/enterprise/sow/.../approve)
 *   3. legal     — Enterprise Legal review          (/enterprise/sow/.../approve)
 *   4. platform  — Glimmora platform approval (last)(/admin/sow)
 *
 * After the platform gate approves, the SOW is `approved` and Glimmora
 * assigns a mentor (see mentorship assignment), then enterprise assigns a
 * reviewer before decomposition.
 */

import type { SowStage } from "./types";

export const APPROVAL_STAGE_ORDER: readonly SowStage[] = [
  "finance",
  "security",
  "legal",
  "platform",
];

/** Enterprise-owned internal gates (actionable in the enterprise portal). */
export const ENTERPRISE_APPROVAL_STAGES: readonly SowStage[] = [
  "finance",
  "security",
  "legal",
];

/** Platform-owned stage — Glimmora, final gate (not actionable in enterprise portal). */
export const PLATFORM_APPROVAL_STAGE: SowStage = "platform";

/** Last enterprise internal gate before the SOW leaves for the platform. */
export const ENTERPRISE_APPROVAL_STAGE: SowStage = "legal";

export const STAGE_LABEL: Record<SowStage, string> = {
  finance: "Finance review",
  security: "Security review",
  legal: "Legal review",
  platform: "Glimmora platform",
};

export const STAGE_SLA_HOURS: Record<SowStage, number> = {
  finance: 48,
  security: 48,
  legal: 48,
  platform: 48,
};

/** True when the stage is an enterprise internal gate (finance/security/legal). */
export function isEnterpriseStage(stage: SowStage): boolean {
  return ENTERPRISE_APPROVAL_STAGES.includes(stage);
}

export function nextApprovalStage(stage: SowStage): SowStage | null {
  const idx = APPROVAL_STAGE_ORDER.indexOf(stage);
  if (idx < 0 || idx === APPROVAL_STAGE_ORDER.length - 1) return null;
  return APPROVAL_STAGE_ORDER[idx + 1]!;
}

export function stageIndex(stage: SowStage): number {
  return APPROVAL_STAGE_ORDER.indexOf(stage);
}
