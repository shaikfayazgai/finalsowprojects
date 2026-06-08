"use client";

import { useQuery } from "@tanstack/react-query";

export interface MeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
}

export interface MeTenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  accessibility: "open" | "admin_only" | "blocked" | "closed";
}

export interface MeRole {
  code: string;
  scope: string;
  tenantId: string | null;
  grantedAt: string;
}

export interface MeResponse {
  user: MeUser;
  tenant: MeTenant | null;
  roles: MeRole[];
}

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/me", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`me fetch failed (${res.status})`);
  return res.json();
}

/**
 * Resolves the current user, tenant, and role grants in one shot.
 * Tenant.name powers the dashboard header; roles[].code drives
 * role-conditional rendering.
 *
 * Cached for 5 minutes — these change rarely mid-session.
 */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
