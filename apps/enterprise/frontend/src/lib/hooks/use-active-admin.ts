"use client";

import { useSearchParams } from "next/navigation";
import { MOCK_ADMINS, isAdminRole, type AdminProfile, type AdminRole } from "@/mocks/admin/personas";

/**
 * Active admin identity for mock phase. Reads `?role=` from URL —
 * `plat.admin`, `plat.tsm`, `plat.mpm`, `plat.tns`, `plat.compliance`,
 * `plat.payments`, `plat.partnerships`, `plat.ai`. Defaults to
 * `plat.admin` because it sees every section.
 */
export function useActiveAdmin(): { role: AdminRole; profile: AdminProfile } {
  const sp = useSearchParams();
  const raw = sp.get("role");
  const role: AdminRole = isAdminRole(raw) ? raw : "plat.admin";
  return { role, profile: MOCK_ADMINS[role] };
}
