/**
 * SOW approval pipeline — enterprise internal gates, then the enterprise
 * Tenant-admin sign-off, then the Super admin (Glimmora) final gate:
 *   1. security      — Enterprise Security review          (/enterprise/.../approve)
 *   2. finance       — Enterprise Finance review           (/enterprise/.../approve)
 *   3. legal         — Enterprise Legal review             (/enterprise/.../approve)
 *   4. tenant_admin  — Tenant admin sign-off (signed)      (/enterprise/.../approve)
 *   5. platform      — Super admin final approval (signed) (/admin/sow)
 *
 * After the Super admin signs off, the SOW is `approved` and Glimmora assigns a
 * mentor, then enterprise assigns a reviewer before decomposition.
 */

import type { SowStage } from "./types";

export const APPROVAL_STAGE_ORDER: readonly SowStage[] = [
  "security",
  "finance",
  "legal",
  "tenant_admin",
  "platform",
];

/** Enterprise-owned internal gates (actionable in the enterprise portal). */
export const ENTERPRISE_APPROVAL_STAGES: readonly SowStage[] = [
  "security",
  "finance",
  "legal",
  "tenant_admin",
];

/** Platform-owned stage — final Super admin approval (not actionable in enterprise portal). */
export const PLATFORM_APPROVAL_STAGE: SowStage = "platform";

/** Last enterprise internal gate before the SOW leaves for the Super admin. */
export const ENTERPRISE_APPROVAL_STAGE: SowStage = "tenant_admin";

export const STAGE_LABEL: Record<SowStage, string> = {
  security: "Security review",
  finance: "Finance review",
  legal: "Legal review",
  tenant_admin: "Tenant admin",
  platform: "Super admin",
};

export const STAGE_SLA_HOURS: Record<SowStage, number> = {
  security: 48,
  finance: 48,
  legal: 48,
  tenant_admin: 48,
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
