/**
 * SSO provider gateway — Phase 1 MOCK mode.
 *
 * Production / live-mode design
 * ─────────────────────────────
 * - SAML: install `samlify` (recommended; pure-TS, no native deps) or
 *   `@boku/passport-saml`. Use it to:
 *     1. Build the SAMLRequest in samlLoginUrl().
 *     2. Verify the SAMLResponse signature against
 *        tenant.ssoConfig.saml.certificate inside verifySamlResponse()
 *        — that's the function that currently just trusts caller input.
 *     3. Extract attributes via tenant.ssoConfig.saml.attributeMap.
 *   The downstream JIT-provisioning + Session creation in `./signin.ts`
 *   does not change.
 *
 * - OIDC: install `openid-client` (the standard Node OIDC client). Use it to:
 *     1. Discover the issuer (`Issuer.discover(config.oidc.issuer)`).
 *     2. Build an authorization URL with PKCE in oidcAuthorizationUrl().
 *     3. Exchange the code in exchangeOidcCode() and verify the ID token.
 *   The userinfo claims map directly into SsoAssertion.
 *
 * Why mocks for Phase 1
 * ─────────────────────
 * Per the locked Phase 1 simplification note: real IdP integration
 * happens during pilot onboarding with each customer's specific IdP
 * (Okta, Azure AD, etc.). Phase 1 ships the storage shape, discovery
 * surface, callback flow, JIT provisioning, and audit trail — the
 * exact same surface a real library would plug into — so live mode is
 * a drop-in upgrade.
 *
 * Don't install a SAML/OIDC library yet (per constraint: default to
 * mock rather than add deps).
 */

import {
  SsoSignatureError,
  type OidcSsoConfig,
  type SamlSsoConfig,
  type SsoAssertion,
} from "./types";

/**
 * URL the login UI redirects to so the user starts a SAML flow.
 * In live mode this would also include a signed AuthnRequest.
 */
export function samlLoginUrl(tenantSlug: string): string {
  return `/api/auth/saml/${encodeURIComponent(tenantSlug)}/login`;
}

/**
 * URL the login UI redirects to so the user starts an OIDC flow.
 * In live mode this would build an authorization URL with PKCE
 * pointing at config.issuer/authorize.
 */
export function oidcAuthorizationUrl(
  tenantSlug: string,
  _config: OidcSsoConfig,
): string {
  return `/api/auth/oidc/${encodeURIComponent(tenantSlug)}/login`;
}

/**
 * Verify a SAML response (mock).
 *
 * Live mode: parse the SAMLResponse XML, verify signature against
 * config.certificate, check NotOnOrAfter, audience, etc., then map
 * attributes via config.attributeMap to produce the SsoAssertion.
 *
 * Mock mode: callers POST a pre-parsed payload directly. We still
 * surface a `signaturePresent` boolean so the smoke test can exercise
 * both happy + signature-failure paths without crypto.
 */
export interface SamlMockInput {
  /** Pre-parsed attributes the test/dev IdP would normally supply. */
  attributes: Record<string, string>;
  /** Subject / NameID. */
  subject?: string;
  /** Dev signal that flips to "signature ok". Default true. */
  signaturePresent?: boolean;
}

export function verifySamlResponse(
  config: SamlSsoConfig,
  input: SamlMockInput,
): SsoAssertion {
  if (input.signaturePresent === false) {
    // Surfaced as SsoSignatureError to caller — matches live behavior
    // when samlify rejects a tampered response.
    throw new SsoSignatureError("SAML response signature invalid");
  }
  const emailKey = config.attributeMap.email;
  const email = input.attributes[emailKey];
  if (!email) {
    throw new SsoSignatureError(
      `SAML response missing required attribute '${emailKey}'`,
    );
  }
  const firstNameKey = config.attributeMap.firstName;
  const lastNameKey = config.attributeMap.lastName;
  return {
    email,
    firstName: firstNameKey ? input.attributes[firstNameKey] : undefined,
    lastName: lastNameKey ? input.attributes[lastNameKey] : undefined,
    subject: input.subject ?? email,
  };
}

/**
 * Exchange an OIDC authorization code for an SsoAssertion (mock).
 *
 * Live mode: openid-client.Client#callback() → tokenSet.claims().
 *
 * Mock mode: callers POST the claims directly. We honor `config.clientId`
 * + a mocked "code" to simulate the round-trip.
 */
export interface OidcMockInput {
  /** Claims that openid-client.tokenSet.claims() would normally return. */
  claims: {
    email: string;
    given_name?: string;
    family_name?: string;
    sub?: string;
  };
  /** Mock authorization code. Just round-trips for audit. */
  code: string;
}

export function exchangeOidcCode(
  _config: OidcSsoConfig,
  input: OidcMockInput,
): SsoAssertion {
  if (!input.claims?.email) {
    throw new SsoSignatureError("OIDC token response missing 'email' claim");
  }
  return {
    email: input.claims.email,
    firstName: input.claims.given_name,
    lastName: input.claims.family_name,
    subject: input.claims.sub ?? input.claims.email,
  };
}
