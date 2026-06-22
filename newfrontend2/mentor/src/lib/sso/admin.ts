/**
 * Admin-side SSO mutation. Audit-emits `tenant.sso.configure` so the
 * platform-admin audit log records every IdP-config change.
 */

import { prisma } from "@/lib/db";
import { auditEmit } from "@/lib/audit";
import { validateSsoConfig } from "./config";
import type { TenantSsoConfig } from "./types";

export interface UpsertTenantSsoConfigInput {
  tenantId: string;
  /** Raw config from API body. Will be validated. */
  config: unknown;
  /** Admin (plat.admin / super_admin) performing the change. */
  actorUserId: string;
  actorPortalRole?: string;
  actorSessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface UpsertTenantSsoConfigResult {
  tenantId: string;
  config: TenantSsoConfig;
}

export async function upsertTenantSsoConfig(
  input: UpsertTenantSsoConfigInput,
): Promise<UpsertTenantSsoConfigResult> {
  const parsed = validateSsoConfig(input.config);

  // Find tenant first so we can audit before/after.
  const before = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { id: true, slug: true, ssoConfig: true },
  });
  if (!before) {
    const err = new Error("tenant not found");
    (err as { code?: string }).code = "tenant_not_found";
    throw err;
  }

  // Strip out the OIDC clientSecret from the audit before/after snapshots
  // to avoid persisting it in plaintext in audit logs (it's already stored
  // on the Tenant row but audit search/UI exposure is broader).
  const redact = (cfg: unknown): unknown => {
    if (cfg == null || typeof cfg !== "object") return cfg;
    const c = cfg as Record<string, unknown>;
    const oidc = c.oidc as Record<string, unknown> | undefined;
    return {
      ...c,
      ...(oidc
        ? {
            oidc: {
              ...oidc,
              clientSecret: oidc.clientSecret ? "[REDACTED]" : null,
            },
          }
        : {}),
    };
  };

  const updated = await prisma.tenant.update({
    where: { id: input.tenantId },
    data: { ssoConfig: parsed as unknown as object },
    select: { id: true, slug: true, ssoConfig: true },
  });

  await auditEmit({
    tenantId: input.tenantId,
    actor: {
      userId: input.actorUserId,
      portalRole: input.actorPortalRole ?? "plat.admin",
      sessionId: input.actorSessionId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
    action: "tenant.sso.configure",
    resource: { type: "tenant", id: input.tenantId, label: updated.slug },
    payload: { kind: parsed.kind, enabled: parsed.enabled },
    before: { ssoConfig: redact(before.ssoConfig) as Record<string, unknown> },
    after: { ssoConfig: redact(parsed) as Record<string, unknown> },
    severity: "info",
  });

  return { tenantId: updated.id, config: parsed };
}
