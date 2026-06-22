/**
 * Enterprise SSO — public surface.
 *
 * The router-facing entry points:
 *   - resolveSsoDiscovery(slug) — for GET /api/auth/sso/discover
 *   - performSsoSignIn(input)   — for POST /api/auth/{saml,oidc}/[slug]/callback
 *   - verifySamlResponse(...)   — pre-step before performSsoSignIn (SAML)
 *   - exchangeOidcCode(...)     — pre-step before performSsoSignIn (OIDC)
 *   - upsertTenantSsoConfig()   — for POST /api/admin/tenants/[id]/sso
 */

export { resolveSsoDiscovery } from "./discover";
export type { SsoDiscoveryResult } from "./discover";
export {
  validateSsoConfig,
  loadTenantSsoConfig,
} from "./config";
export type { LoadedTenantSso } from "./config";
export {
  performSsoSignIn,
  recordSsoSignatureFailure,
} from "./signin";
export type { SsoSignInInput, SsoSignInResult } from "./signin";
export {
  samlLoginUrl,
  oidcAuthorizationUrl,
  verifySamlResponse,
  exchangeOidcCode,
} from "./provider";
export type { SamlMockInput, OidcMockInput } from "./provider";
export { upsertTenantSsoConfig } from "./admin";
export type { UpsertTenantSsoConfigInput } from "./admin";
export {
  SsoConfigError,
  SsoSignatureError,
} from "./types";
export type {
  SsoKind,
  TenantSsoConfig,
  SamlSsoConfig,
  OidcSsoConfig,
  SamlAttributeMap,
  SsoAssertion,
} from "./types";
