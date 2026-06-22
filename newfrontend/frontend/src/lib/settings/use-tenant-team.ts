"use client";

/**
 * Real tenant team members from the enterprise backend (/api/enterprise/team),
 * mapped to the Tenant & roles member-directory shape. Replaces the seeded
 * mock member list so the page shows the actual people provisioned for the
 * tenant, with real first-login status + actions (resend / activate).
 */

import * as React from "react";
import type { TenantMemberMock } from "@/lib/settings/settings-mock";

export interface BackendTeamMember {
  id: string;
  email: string;
  name: string;
  portalRole: string;
  roleCode: string | null;
  roleCodes?: string[] | null;
  roleLabel: string | null;
  department: string | null;
  active: boolean;
  mustChangePassword: boolean;
  firstLoginComplete: boolean;
  lastLoginAt: string | null;
  status: "active" | "pending_first_login" | "inactive";
  createdAt: string | null;
}

/** All role codes the member holds (PMO + Reviewer, …), stripped of `ent.`. */
function deriveRoles(m: BackendTeamMember): string[] {
  if (m.roleCodes && m.roleCodes.length) {
    return m.roleCodes.map((c) => c.replace(/^ent\./, ""));
  }
  if (m.roleCode) return [m.roleCode.replace(/^ent\./, "")];
  if (m.portalRole === "reviewer") return ["reviewer"];
  if (m.portalRole === "enterprise") return ["admin"];
  return [];
}

const STATUS_MAP: Record<BackendTeamMember["status"], TenantMemberMock["status"]> = {
  pending_first_login: "invited",
  active: "active",
  inactive: "suspended",
};

export function mapBackendMember(m: BackendTeamMember): TenantMemberMock & {
  firstLoginComplete: boolean;
} {
  const status = STATUS_MAP[m.status] ?? "active";
  return {
    id: m.id,
    name: m.name || m.email,
    email: m.email,
    roles: deriveRoles(m),
    status,
    invitedAt: status === "invited" ? m.createdAt : null,
    lastActiveAt: m.lastLoginAt,
    suspendedAt: status === "suspended" ? m.createdAt : null,
    firstLoginComplete: m.firstLoginComplete,
  };
}

export type TenantTeamMember = ReturnType<typeof mapBackendMember>;

export function useTenantTeam() {
  const [members, setMembers] = React.useState<TenantTeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/enterprise/team", { cache: "no-store" });
      if (!res.ok) {
        setError(res.status === 403 ? "You don't have permission to manage members." : "Couldn't load members.");
        setMembers([]);
        return;
      }
      const body = (await res.json()) as { items?: BackendTeamMember[] };
      setMembers((body.items ?? []).map(mapBackendMember));
    } catch {
      setError("Couldn't load members.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  return { members, loading, error, refetch };
}

/** Resend credentials (regenerate temp password + re-email). */
export async function resendMemberCredentials(memberId: string): Promise<boolean> {
  const res = await fetch(`/api/enterprise/team/${memberId}/resend`, { method: "POST" });
  return res.ok;
}

/** Activate / deactivate a member (no row deleted — is_active flip). */
export async function setMemberActive(memberId: string, active: boolean): Promise<boolean> {
  const res = await fetch(`/api/enterprise/team/${memberId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  return res.ok;
}

/** Permanently delete a member's account (hard delete). */
export async function deleteMember(memberId: string): Promise<boolean> {
  const res = await fetch(`/api/enterprise/team/${memberId}`, { method: "DELETE" });
  return res.ok;
}

/**
 * Set a member's roles (one or several, e.g. PMO + Reviewer). The backend keeps
 * one enterprise role primary for portal routing and stores the rest as extras.
 */
export async function setMemberRoles(memberId: string, roleCodes: string[]): Promise<boolean> {
  const res = await fetch(`/api/enterprise/team/${memberId}/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roleCodes }),
  });
  return res.ok;
}
