import type { PlanCode } from "./types";

/** Admin UI tier labels (tenant wizard / detail). */
export type AdminTenantTier = "Enterprise" | "Growth" | "Pilot" | "Trial";

/** Legacy Prisma `subscriptionTier` values. */
const PRISMA_TIER_MAP: Record<string, PlanCode> = {
  enterprise: "enterprise",
  growth: "growth",
  pilot: "pilot",
  trial: "trial",
};

const ADMIN_TIER_MAP: Record<AdminTenantTier, PlanCode> = {
  Enterprise: "enterprise",
  Growth: "growth",
  Pilot: "pilot",
  Trial: "trial",
};

export function planCodeFromPrismaTier(tier: string | null | undefined): PlanCode {
  if (!tier) return "pilot";
  const normalized = tier.toLowerCase().trim();
  return PRISMA_TIER_MAP[normalized] ?? "pilot";
}

export function planCodeFromAdminTier(tier: AdminTenantTier | string): PlanCode {
  if (tier in ADMIN_TIER_MAP) return ADMIN_TIER_MAP[tier as AdminTenantTier];
  return planCodeFromPrismaTier(tier);
}

export function prismaTierFromPlanCode(code: PlanCode): string {
  return code;
}

export function adminTierFromPlanCode(code: PlanCode): AdminTenantTier {
  const map: Record<PlanCode, AdminTenantTier> = {
    enterprise: "Enterprise",
    growth: "Growth",
    pilot: "Pilot",
    trial: "Trial",
  };
  return map[code];
}
