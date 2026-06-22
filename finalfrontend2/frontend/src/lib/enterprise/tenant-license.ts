/**
 * Tenant-licensed enterprise roles — enabled at platform provisioning,
 * enforced in enterprise invite / member role UI.
 */

import { useAdminProvisioningStore } from "@/lib/stores/admin-provisioning-store";
import {
  DEFAULT_LICENSED_ROLES,
  ENTERPRISE_ROLES,
  RELEASE_ENTERPRISE_ROLES,
  type EnterpriseRole,
} from "./tenant-roles-shared";

const ACME_TENANT_ID = "tnt-acme-corp";

/** Seeded mock tenant IDs → default license map when not in provisioning store. */
const SEED_LICENSES: Record<string, Partial<Record<EnterpriseRole, boolean>>> = {
  [ACME_TENANT_ID]: DEFAULT_LICENSED_ROLES,
  "glimmora-hq": DEFAULT_LICENSED_ROLES,
};
const RELEASE_ROLE_SET = new Set<EnterpriseRole>(RELEASE_ENTERPRISE_ROLES);

function filterReleaseRoles(roles: EnterpriseRole[]): EnterpriseRole[] {
  return roles.filter((role) => RELEASE_ROLE_SET.has(role));
}

export function resolveLicensedRoles(tenantId?: string | null): EnterpriseRole[] {
  const id = tenantId?.trim();
  if (id) {
    const dynamic = useAdminProvisioningStore.getState().tenants.find((t) => t.id === id);
    if (dynamic?.rolesEnabled) {
      return filterReleaseRoles(
        ENTERPRISE_ROLES.filter((role) => dynamic.rolesEnabled[role]),
      );
    }
    const seed = SEED_LICENSES[id];
    if (seed) {
      return filterReleaseRoles(
        ENTERPRISE_ROLES.filter((role) => seed[role] ?? false),
      );
    }
  }

  return filterReleaseRoles(
    ENTERPRISE_ROLES.filter((role) => DEFAULT_LICENSED_ROLES[role]),
  );
}

export function isRoleLicensed(role: EnterpriseRole, tenantId?: string | null): boolean {
  return resolveLicensedRoles(tenantId).includes(role);
}
