/**
 * Per-tenant SSO configuration types.
 *
 * Stored on Tenant.ssoConfig (Json). Two flavors: SAML 2.0 and OIDC.
 * Live integration with a real IdP requires either a SAML library
 * (e.g. samlify, @boku/passport-saml) or a real OIDC client — neither
 * is installed in Phase 1, so the actual signature verification +
 * authorization-code exchange are stubbed by a mock provider gateway
 * (see ./provider.ts). Live mode swaps the stubs for real libraries
 * without changing the storage shape, the discover endpoint, or the
 * JIT-provisioning flow.
 *
 * Validation: validateSsoConfig() narrows arbitrary JSON to one of the
 * variants below; callers (admin API + smoke test) should run it before
 * persisting or relying on the shape.
 */

export type SsoKind = "saml" | "oidc";

export interface SamlAttributeMap {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface SamlSsoConfig {
  /** IdP entity ID (e.g. https://sso.acme.com/saml/metadata). */
  entityId: string;
  /** IdP SSO endpoint where SAMLRequest is sent. */
  ssoUrl: string;
  /** PEM-format certificate used to validate SAML response signatures. */
  certificate: string;
  attributeMap: SamlAttributeMap;
}

export interface OidcSsoConfig {
  /** OIDC issuer URL (e.g. https://login.acme.com). */
  issuer: string;
  clientId: string;
  /** Confidential client secret. Stored server-side only. */
  clientSecret: string;
  /** OAuth scopes; defaults to ['openid', 'profile', 'email']. */
  scopes?: string[];
}

export interface TenantSsoConfig {
  enabled: boolean;
  kind: SsoKind;
  saml?: SamlSsoConfig;
  oidc?: OidcSsoConfig;
}

/**
 * SSO assertion payload normalized from either flavor. The provider
 * gateway emits one of these after validating the IdP response; the
 * downstream JIT-provisioning flow consumes only this shape so the
 * SAML and OIDC paths converge.
 */
export interface SsoAssertion {
  email: string;
  firstName?: string;
  lastName?: string;
  /** Raw subject/nameID from the IdP, for audit + future linkage. */
  subject?: string;
}

export class SsoConfigError extends Error {
  constructor(
    public readonly code:
      | "invalid_shape"
      | "missing_kind"
      | "missing_saml_fields"
      | "missing_oidc_fields"
      | "invalid_enabled",
    message: string,
  ) {
    super(message);
    this.name = "SsoConfigError";
  }
}

export class SsoSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsoSignatureError";
  }
}
