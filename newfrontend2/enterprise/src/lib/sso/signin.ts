/**
 * SSO sign-in pipeline — JIT user provisioning + durable Session creation
 * + audit emit. Shared by both the SAML and OIDC callback handlers.
 *
 * Lifecycle on a successful IdP assertion:
 *   1. Upsert the User row (email is the upsert key — same pattern as
 *      the Credentials provider's upsertLocalUserForSession in src/auth.ts).
 *   2. Stamp tenantId on first sight (never overwrite — if a user has
 *      already been claimed by a different tenant we treat that as a
 *      configuration error and audit-emit the conflict).
 *   3. Create a durable Session row keyed off a random session id.
 *   4. Emit auth.sso.<kind>.signin audit event.
 *
 * Returns the userId + sessionId so the route handler can plant a
 * NextAuth-compatible cookie on the response.
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { hashSessionToken } from "@/lib/session";
import { auditEmit } from "@/lib/audit";
import type { SsoAssertion, SsoKind } from "./types";

/**
 * 30 days — matches NextAuth session.maxAge in src/auth.ts so JWT and
 * durable session expire together.
 */
const SSO_SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

export interface SsoSignInInput {
  tenantId: string;
  tenantSlug: string;
  kind: SsoKind;
  assertion: SsoAssertion;
  /** Forensic context, when available. */
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SsoSignInResult {
  userId: string;
  sessionId: string;
  /** True when this is the first time the user signed in via this tenant. */
  jitProvisioned: boolean;
}

function splitName(
  assertion: SsoAssertion,
): { firstName: string; lastName: string } {
  const first = assertion.firstName?.trim() ?? "";
  const last = assertion.lastName?.trim() ?? "";
  if (first || last) return { firstName: first, lastName: last };
  // Fallback: derive from email local-part so the row is at least readable.
  const local = assertion.email.split("@")[0] ?? "";
  return { firstName: local, lastName: "" };
}

export async function performSsoSignIn(
  input: SsoSignInInput,
): Promise<SsoSignInResult> {
  const email = input.assertion.email.toLowerCase();
  const providerStr = `${input.kind}-${input.tenantSlug}`;
  const { firstName, lastName } = splitName(input.assertion);

  // Find existing user first so we know whether this is a JIT provision.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, tenantId: true },
  });

  let userId: string;
  let jitProvisioned = false;

  if (!existing) {
    // First-time SSO user — enterprise role (tenant employee) per spec.
    const created = await prisma.user.create({
      data: {
        email,
        firstName: firstName || email.split("@")[0] || "user",
        lastName,
        role: "enterprise",
        provider: providerStr,
        tenantId: input.tenantId,
        emailVerified: true, // IdP asserted email — trust it.
      },
      select: { id: true },
    });
    userId = created.id;
    jitProvisioned = true;
  } else {
    userId = existing.id;
    // Refresh display fields + provider; only set tenantId when null so
    // we never silently re-tenant a contributor / mentor account.
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: firstName || undefined,
        lastName,
        provider: providerStr,
        ...(existing.tenantId == null ? { tenantId: input.tenantId } : {}),
      },
    });
  }

  // Durable Session row — same shape as src/auth.ts createDurableSession.
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + SSO_SESSION_LIFETIME_SECONDS * 1000,
  );
  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      tenantId: input.tenantId,
      tokenHash: hashSessionToken(sessionId),
      expiresAt,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      mfaVerified: false,
    },
  });

  await auditEmit({
    tenantId: input.tenantId,
    actor: {
      userId,
      portalRole: "enterprise",
      sessionId,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
    action: `auth.sso.${input.kind}.signin`,
    resource: { type: "user", id: userId, label: email },
    payload: {
      tenantSlug: input.tenantSlug,
      kind: input.kind,
      provider: providerStr,
      jitProvisioned,
      subject: input.assertion.subject ?? null,
    },
    severity: "info",
  });

  return { userId, sessionId, jitProvisioned };
}

/**
 * Audit-only helper used when the IdP assertion fails signature
 * verification. Caller passes the tenant context it managed to resolve
 * before the failure; we record what we know.
 */
export async function recordSsoSignatureFailure(input: {
  tenantId: string | null;
  tenantSlug: string;
  kind: SsoKind;
  reason: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await auditEmit({
    tenantId: input.tenantId,
    actor: {
      userId: "system",
      portalRole: "system",
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
    action: `auth.sso.${input.kind}.signature_invalid`,
    resource: {
      type: "tenant",
      id: input.tenantId ?? "unknown",
      label: input.tenantSlug,
    },
    payload: {
      tenantSlug: input.tenantSlug,
      kind: input.kind,
      reason: input.reason,
    },
    severity: "warning",
  });
}
