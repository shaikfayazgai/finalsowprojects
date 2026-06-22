/**
 * SSO discovery — what the login UI calls to figure out where to send
 * a user once it knows their tenant slug.
 *
 * The route handler (src/app/api/auth/sso/discover/route.ts) is a thin
 * wrapper around `resolveSsoDiscovery()`. The smoke test imports the
 * resolver directly so it doesn't have to spin up Next.
 */

import { loadTenantSsoConfig } from "./config";
import { samlLoginUrl, oidcAuthorizationUrl } from "./provider";

export interface SsoDiscoveryResult {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  kind: "saml" | "oidc";
  /** Where the login UI should redirect the user. */
  loginUrl: string;
}

/**
 * Resolve a tenant slug to its SSO entry point.
 *
 * Returns null when:
 *   - the tenant doesn't exist
 *   - ssoConfig is unset
 *   - ssoConfig.enabled === false
 *
 * The route handler maps null → 404, mirroring how the IdP-routing
 * spec in doc 05 §3 wants unknown / disabled tenants to look
 * indistinguishable from non-existent ones (defense in depth).
 */
export async function resolveSsoDiscovery(
  tenantSlug: string,
): Promise<SsoDiscoveryResult | null> {
  const loaded = await loadTenantSsoConfig(tenantSlug);
  if (!loaded) return null;
  if (!loaded.config.enabled) return null;
  // Paused / closed tenants don't get to start an SSO flow either.
  if (loaded.tenantStatus !== "active" && loaded.tenantStatus !== "provisioning") {
    return null;
  }
  const loginUrl =
    loaded.config.kind === "saml"
      ? samlLoginUrl(loaded.tenantSlug)
      : oidcAuthorizationUrl(loaded.tenantSlug, loaded.config.oidc!);
  return {
    tenantId: loaded.tenantId,
    tenantSlug: loaded.tenantSlug,
    tenantName: loaded.tenantName,
    kind: loaded.config.kind,
    loginUrl,
  };
}
