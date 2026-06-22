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
  const { sessionStatus, email, member, roles } = useEnterpriseAccess();

  return {
    status: sessionStatus,
    email,
    member,
    roles,
    canAccessSettings: canAccessAnySettings(roles),
    accessibleSections: getAccessibleSections(roles),
    sectionAccess: (section: SettingsSectionId): SettingsAccessLevel =>
      getSectionAccess(roles, section),
  };
}
