/**
 * HMAC-SHA256 signing for audit events.
 *
 * Each emitted event is signed with a server-side key. The signature is
 * stored on the AuditEvent row and verified at read time. Tampering with
 * the row (somehow bypassing the append-only triggers) breaks verification.
 *
 * Key rotation: stored events keep their `signingKeyVersion`. On rotation,
 * the new key gets a higher version; old events still verify against the
 * key they were signed with. Phase 1 ships with v1 only.
 *
 * Security note: NEVER log the signing key. NEVER commit it. The env
 * var `AUDIT_SIGNING_KEY_V1` must be set in every environment.
 */

import crypto from "node:crypto";

const SIGNING_KEY_ENV_PREFIX = "AUDIT_SIGNING_KEY_V";

/**
 * Current active signing key version. Phase 1 = 1. Rotation bumps this
 * and the env (`AUDIT_SIGNING_KEY_V2`, etc.) — old events keep using
 * their own version.
 */
export const CURRENT_KEY_VERSION = 1;

function getSigningKey(version: number): string {
  const envName = `${SIGNING_KEY_ENV_PREFIX}${version}`;
  const key = process.env[envName];
  if (!key) {
    throw new Error(
      `Audit signing key not configured: env var ${envName} is required.`,
    );
  }
  if (key.length < 32) {
    throw new Error(
      `Audit signing key ${envName} is too short (min 32 chars). Use a high-entropy secret.`,
    );
  }
  return key;
}

/**
 * Canonical JSON serialization with alphabetically-sorted keys at every
 * depth. Produces identical output regardless of property insertion
 * order, so two semantically-equal events compute to the same signature.
 *
 * Important: arrays preserve element order (semantic). Only object keys
 * are sorted.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(val as Record<string, unknown>).sort()) {
        sorted[k] = (val as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return val;
  });
}

/**
 * Compute the HMAC-SHA256 signature for a canonical event JSON string.
 * Returns a lowercase hex digest.
 */
export function signAuditEvent(
  canonicalEventJson: string,
  keyVersion = CURRENT_KEY_VERSION,
): string {
  const key = getSigningKey(keyVersion);
  return crypto
    .createHmac("sha256", key)
    .update(canonicalEventJson)
    .digest("hex");
}

/**
 * Constant-time signature verification. Returns true iff the stored
 * signature matches what we recompute from the canonical JSON.
 */
export function verifyAuditEvent(
  canonicalEventJson: string,
  storedSignature: string,
  keyVersion: number,
): boolean {
  const key = getSigningKey(keyVersion);
  const expected = crypto
    .createHmac("sha256", key)
    .update(canonicalEventJson)
    .digest("hex");
  if (expected.length !== storedSignature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(storedSignature, "hex"),
  );
}
