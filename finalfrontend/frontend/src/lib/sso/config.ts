/**
 * SSO config validation + load helpers.
 *
 * Tenant.ssoConfig is stored as Prisma Json so callers must validate
 * before using it. validateSsoConfig() narrows arbitrary JSON to a
 * TenantSsoConfig; loadTenantSsoConfig() fetches by slug and returns
 * the parsed config plus the resolved tenant id.
 */

import { prisma } from "@/lib/db";
import {
  SsoConfigError,
  type OidcSsoConfig,
  type SamlSsoConfig,
  type TenantSsoConfig,
} from "./types";

type Json = unknown;

function isRecord(v: Json): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function validateSsoConfig(raw: Json): TenantSsoConfig {
  if (!isRecord(raw)) {
    throw new SsoConfigError("invalid_shape", "ssoConfig must be an object");
  }
  if (typeof raw.enabled !== "boolean") {
    throw new SsoConfigError(
      "invalid_enabled",
      "ssoConfig.enabled must be boolean",
    );
  }
  const kind = raw.kind;
  if (kind !== "saml" && kind !== "oidc") {
    throw new SsoConfigError(
      "missing_kind",
      "ssoConfig.kind must be 'saml' or 'oidc'",
    );
  }

  const out: TenantSsoConfig = { enabled: raw.enabled, kind };

  if (kind === "saml") {
    if (!isRecord(raw.saml)) {
      throw new SsoConfigError(
        "missing_saml_fields",
        "ssoConfig.saml is required when kind='saml'",
      );
    }
    const entityId = asString(raw.saml.entityId);
    const ssoUrl = asString(raw.saml.ssoUrl);
    const certificate = asString(raw.saml.certificate);
    const attrMap = raw.saml.attributeMap;
    if (!entityId || !ssoUrl || !certificate) {
      throw new SsoConfigError(
        "missing_saml_fields",
        "ssoConfig.saml requires entityId, ssoUrl, certificate",
      );
    }
    if (!isRecord(attrMap) || !asString(attrMap.email)) {
      throw new SsoConfigError(
        "missing_saml_fields",
        "ssoConfig.saml.attributeMap.email is required",
      );
    }
    const saml: SamlSsoConfig = {
      entityId,
      ssoUrl,
      certificate,
      attributeMap: {
        email: asString(attrMap.email) as string,
        firstName: asString(attrMap.firstName),
        lastName: asString(attrMap.lastName),
      },
    };
    out.saml = saml;
  } else {
    if (!isRecord(raw.oidc)) {
      throw new SsoConfigError(
        "missing_oidc_fields",
        "ssoConfig.oidc is required when kind='oidc'",
      );
    }
    const issuer = asString(raw.oidc.issuer);
    const clientId = asString(raw.oidc.clientId);
    const clientSecret = asString(raw.oidc.clientSecret);
    if (!issuer || !clientId || !clientSecret) {
      throw new SsoConfigError(
        "missing_oidc_fields",
        "ssoConfig.oidc requires issuer, clientId, clientSecret",
      );
    }
    const oidc: OidcSsoConfig = {
      issuer,
      clientId,
      clientSecret,
      scopes: Array.isArray(raw.oidc.scopes)
        ? (raw.oidc.scopes.filter((s) => typeof s === "string") as string[])
        : undefined,
    };
    out.oidc = oidc;
  }

  return out;
}

export interface LoadedTenantSso {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantStatus: string;
  config: TenantSsoConfig;
}

/**
 * Look up a tenant by slug and return its parsed SSO config. Returns
 * null when the tenant doesn't exist or ssoConfig is unset.
 *
 * Does NOT enforce `enabled`; callers (discover endpoint, callback
 * handlers) decide whether disabled tenants are visible.
 */
export async function loadTenantSsoConfig(
  tenantSlug: string,
): Promise<LoadedTenantSso | null> {
  if (!tenantSlug) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      ssoConfig: true,
    },
  });
  if (!tenant) return null;
  if (tenant.ssoConfig == null) return null;
  let config: TenantSsoConfig;
  try {
    config = validateSsoConfig(tenant.ssoConfig as unknown);
  } catch {
    // Malformed stored config — treat as no SSO. Admin must re-save.
    return null;
  }
  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    tenantStatus: tenant.status,
    config,
  };
}
