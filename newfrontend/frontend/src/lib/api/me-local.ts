/**
 * Local /api/me when the standalone backend is unavailable.
 * Resolves ent.* roles from UserRole rows, then tenant member mock.
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { MeResponse } from "@/lib/hooks/use-me";
import { toEntRoleCode, normalizeEnterpriseRole } from "@/lib/enterprise/tenant-roles-shared";
import { resolveProfileMember } from "@/lib/settings/settings-mock";

const ACME_FALLBACK_TENANT = {
  id: "tnt-acme-corp",
  slug: "acme-corp",
  name: "Acme Corp",
  status: "active",
  accessibility: "open" as const,
};

function displayInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
}

export async function buildLocalMeResponse(): Promise<MeResponse | null> {
  const session = await auth();
  if (!session?.user?.email) {
    // Demo / no-backend fallback: with no session AND no backend, /api/me would
    // otherwise 503 — which makes gated pages (e.g. the SOW detail) thrash and
    // refetch `me` in a loop. Return a stable seeded admin identity instead.
    const demo =
      process.env.DEV_AUTH_BYPASS === "1" ||
      process.env.NEXT_PUBLIC_ENTERPRISE_DEMO === "1";
    if (!demo) return null;
    const demoEmail = "admin@glimmora.ai";
    const demoMember = resolveProfileMember(demoEmail);
    const demoName = demoMember?.name ?? "Aishwarya Rao";
    const demoRoleCodes = (demoMember?.roles ?? ["admin"])
      .map((r) => normalizeEnterpriseRole(r))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .map((r) => toEntRoleCode(r));
    return {
      user: {
        id: demoEmail,
        email: demoEmail,
        name: demoName,
        role: "admin",
        initials: displayInitials(demoName),
      },
      tenant: ACME_FALLBACK_TENANT,
      roles: (demoRoleCodes.length ? demoRoleCodes : ["ent.admin"]).map((code) => ({
        code,
        scope: "enterprise",
        tenantId: ACME_FALLBACK_TENANT.id,
        grantedAt: new Date().toISOString(),
      })),
    };
  }
  const email = session.user.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenant: true,
      userRoles: { include: { role: true } },
    },
  });

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    session.user.name ||
    email;

  const member = resolveProfileMember(email);
  const fromDb = (user?.userRoles ?? []).map((ur) => ur.roleCode);
  const fromMember = (member?.roles ?? [])
    .map((r) => normalizeEnterpriseRole(r))
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((r) => toEntRoleCode(r));

  const roleCodes = [...new Set([...fromDb, ...(fromDb.length === 0 ? fromMember : [])])];

  const tenantId = user?.tenantId ?? user?.userRoles[0]?.tenantId ?? null;

  const tenant: MeResponse["tenant"] = user?.tenant
    ? {
        id: user.tenant.id,
        slug: user.tenant.slug,
        name: user.tenant.name,
        status: user.tenant.status,
        accessibility: "open",
      }
    : tenantId === ACME_FALLBACK_TENANT.id || email.endsWith("@acme.com")
      ? ACME_FALLBACK_TENANT
      : null;

  return {
    user: {
      id: user?.id ?? (session.user as { id?: string }).id ?? email,
      email,
      name: displayName,
      role: user?.role ?? (session.user as { role?: string }).role ?? "enterprise",
      initials: displayInitials(displayName),
    },
    tenant,
    roles: roleCodes.map((code) => ({
      code,
      scope: "enterprise",
      tenantId: tenant?.id ?? tenantId,
      grantedAt: new Date().toISOString(),
    })),
  };
}
