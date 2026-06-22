import { planCodeFromAdminTier } from "@/lib/subscription/tier-map";
import type { PlanCode } from "@/lib/subscription/types";

export async function patchAdminTenantSubscription(
  tenantId: string,
  input: { planCode: PlanCode; contractRef?: string; trialDays?: number },
): Promise<Response> {
  return fetch(`/api/admin/tenants/${tenantId}/subscription`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
}

export function planCodeFromAdminTierLabel(tier: string): PlanCode {
  return planCodeFromAdminTier(tier);
}
