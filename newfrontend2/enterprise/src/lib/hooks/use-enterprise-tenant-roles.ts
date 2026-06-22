"use client";

import {
  canAccessAnySettings,
  getAccessibleSections,
  getSectionAccess,
  type SettingsAccessLevel,
  type SettingsSectionId,
} from "@/lib/settings/settings-rbac";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";

/**
 * Resolves tenant-scoped roles for the signed-in enterprise user.
 */
export function useEnterpriseTenantRoles() {
  const { sessionStatus, meLoading, email, member, roles } = useEnterpriseAccess();

  return {
    status: sessionStatus,
    // True while /api/me (the role source) is still resolving. Callers must not
    // make access decisions (e.g. redirect) until this is false — otherwise
    // they act on an empty role set during the load window.
    rolesResolving: meLoading,
    email,
    member,
    roles,
    canAccessSettings: canAccessAnySettings(roles),
    accessibleSections: getAccessibleSections(roles),
    sectionAccess: (section: SettingsSectionId): SettingsAccessLevel =>
      getSectionAccess(roles, section),
  };
}
