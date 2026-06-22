"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  canAccessEnterprisePath,
  canApproveSowStage,
  canActOnEnterpriseStage,
  canSignOffSowFinal,
  isSowOwner as checkIsSowOwner,
  canCreateSow,
  resolveEnterpriseHomePath,
  resolveEnterprisePersona,
  resolveEnterpriseRoles,
  type EnterprisePersona,
} from "@/lib/enterprise/rbac";
import type { SowStage } from "@/lib/sow/types";
import { resolveLicensedRoles } from "@/lib/enterprise/tenant-license";
import {
  type EnterpriseRole,
  roleLabel,
  toEntRoleCode,
} from "@/lib/enterprise/tenant-roles-shared";
import { resolveProfileMember } from "@/lib/settings/settings-mock";
import { useMe } from "@/lib/hooks/use-me";

export function useEnterpriseAccess() {
  const { data: session, status: sessionStatus } = useSession();
  const { data: me, isLoading: meLoading } = useMe();
  // Demo bypass: with no backend, /api/me + the session can't resolve real
  // roles/email, which would otherwise hard-block the portal and fail the
  // confidentiality filter closed. Fall back to the seeded admin so the
  // mock-first portal renders with data. Gated on NEXT_PUBLIC_ENTERPRISE_DEMO.
  const demo = process.env.NEXT_PUBLIC_ENTERPRISE_DEMO === "1";
  const email =
    session?.user?.email ?? me?.user?.email ?? (demo ? "admin@glimmora.ai" : null);
  const member = resolveProfileMember(email);
  const sessionPortalRole = session?.user?.role ?? null;

  const roles = useMemo(() => {
    const resolved = resolveEnterpriseRoles({
      meRoleCodes: me?.roles?.map((r) => r.code),
      memberRoles: member?.roles,
      sessionPortalRole,
      email,
      meLoading,
    });
    if (resolved.length === 0 && demo && !meLoading) {
      return ["admin"] as EnterpriseRole[];
    }
    return resolved;
  }, [me?.roles, member?.roles, sessionPortalRole, email, meLoading, demo]);

  const persona = useMemo(() => resolveEnterprisePersona(roles), [roles]);
  const homePath = useMemo(() => resolveEnterpriseHomePath(roles), [roles]);
  const tenantId = me?.tenant?.id ?? null;
  const licensedRoles = useMemo(() => resolveLicensedRoles(tenantId), [tenantId]);

  const roleLabels = useMemo(
    () => roles.map((r) => roleLabel(r)),
    [roles],
  );

  const roleCodes = useMemo(() => roles.map((r) => toEntRoleCode(r)), [roles]);

  return {
    sessionStatus,
    meLoading,
    email,
    member,
    roles,
    persona,
    homePath,
    tenantId,
    licensedRoles,
    roleLabels,
    roleCodes,
    canApproveStage: (stage: Parameters<typeof canApproveSowStage>[1]) =>
      canApproveSowStage(roles, stage),
    canActOnStage: (ownerId: string, stage: SowStage) =>
      canActOnEnterpriseStage(roles, email, ownerId, stage),
    canSignOffSowFinal: (ownerId: string) =>
      canSignOffSowFinal(roles, email, ownerId),
    isSowOwner: (ownerId: string) => checkIsSowOwner(email, ownerId),
    canAccessPath: (pathname: string) => canAccessEnterprisePath(pathname, roles),
    canCreateSow: canCreateSow(roles),
  };
}

export type { EnterprisePersona, EnterpriseRole };
