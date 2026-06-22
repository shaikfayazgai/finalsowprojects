"use client";

import { useSearchParams } from "next/navigation";
import { MOCK_ADMINS, isAdminRole, type AdminProfile, type AdminRole } from "@/mocks/admin/personas";
import { resolvePhaseAdminRole } from "@/lib/admin/phase-gate";

/**
 * Active admin identity for mock phase. Reads `?role=` from URL —
 * `plat.admin`, `plat.tsm`, `plat.mpm`, `plat.tns`, `plat.compliance`,
 * `plat.payments`, `plat.partnerships`, `plat.ai`. Defaults to
 * `plat.admin` because it sees every section.
 */
export function useActiveAdmin(): { role: AdminRole; profile: AdminProfile } {
  const sp = useSearchParams();
  // The `?role=` persona switch is a DEMO affordance only. It is disabled in
  // production builds (unless NEXT_PUBLIC_ADMIN_DEMO=1) so a real admin can't
  // self-select a higher-privilege persona by editing the URL. In production
  // the active persona is resolved from the authenticated session (backend).
  const demoEnabled =
    process.env.NEXT_PUBLIC_ADMIN_DEMO === "1" ||
    process.env.NODE_ENV !== "production";
  const raw = demoEnabled ? sp.get("role") : null;
  const requested: AdminRole = isAdminRole(raw) ? raw : "plat.admin";
  // Phase-1 collapses the 8 personas to 3 (admin/tsm/compliance); no-op when
  // NEXT_PUBLIC_ADMIN_PHASE2_ENABLED=1.
  const role = resolvePhaseAdminRole(requested) as AdminRole;
  return { role, profile: MOCK_ADMINS[role] };
}
