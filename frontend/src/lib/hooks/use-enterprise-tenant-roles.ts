"use client";

import { useSession } from "next-auth/react";
import { resolveProfileMember } from "@/lib/settings/settings-mock";
import {
  canAccessAnySettings,
  getAccessibleSections,
  getSectionAccess,
  type SettingsAccessLevel,
  type SettingsSectionId,
} from "@/lib/settings/settings-rbac";

/**
 * Resolves tenant-scoped roles for the signed-in enterprise user.
 * Falls back to admin for demo sessions not in the tenant mock directory.
 */
export function useEnterpriseTenantRoles() {
  const { data: session, status } = useSession();
  const email = session?.user?.email ?? null;
  const member = resolveProfileMember(email);

  const roles = member?.roles?.length
    ? member.roles
    : session?.user?.role === "enterprise" ||
        session?.user?.role === "admin" ||
        session?.user?.role === "super_admin"
      ? ["admin"]
      : [];

  return {
    status,
    email,
    member,
    roles,
    canAccessSettings: canAccessAnySettings(roles),
    accessibleSections: getAccessibleSections(roles),
    sectionAccess: (section: SettingsSectionId): SettingsAccessLevel =>
      getSectionAccess(roles, section),
  };
}
