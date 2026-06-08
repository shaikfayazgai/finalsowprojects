-- Migration M3 · session_persistence
-- Phase 1 foundations · doc 08-codebase-delta §5.1
--
-- Adds Session + TrustedDevice tables.
--
-- Why durable sessions in addition to JWT cookies:
--   • Logout actually invalidates: setting Session.revokedAt makes
--     middleware reject the JWT even before it expires.
--   • Multi-device: user sees + revokes individual sessions in settings.
--   • Idle timeout: per-tenant policy can shorten the effective session
--     (default 30d, tenant-configurable down to 8h per locked decision).
--   • Bulk revocation: password change / mentor suspension / tenant
--     pause all bulk-set revokedAt for affected users.
--
-- TrustedDevice records the "trust this device for 30 days" decision.
-- One row per (userId, deviceFingerprint); persists across multiple
-- Sessions; revoking it removes future MFA bypass.
--
-- Companion Redis blacklist (built later) caches revoked session ids
-- with TTL = remaining lifetime; middleware checks Redis first, falls
-- back to Postgres if miss.

-- ─────────────────────────────────────────────────────────────────────────
-- Session
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "deviceFingerprint" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "mfaVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "revokedBy" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_tenantId_idx" ON "Session"("tenantId");
CREATE INDEX "Session_revokedAt_idx" ON "Session"("revokedAt");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- TrustedDevice
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "label" TEXT,
    "trustedUntil" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- One trusted device row per (user, fingerprint). Re-checking "trust this
-- device" on the same browser updates the existing row's trustedUntil.
CREATE UNIQUE INDEX "TrustedDevice_userId_deviceFingerprint_key"
  ON "TrustedDevice"("userId", "deviceFingerprint");

CREATE INDEX "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");
CREATE INDEX "TrustedDevice_trustedUntil_idx" ON "TrustedDevice"("trustedUntil");

ALTER TABLE "TrustedDevice"
  ADD CONSTRAINT "TrustedDevice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
