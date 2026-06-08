-- Migration M1 · tenant_setup
-- Phase 1 foundations · doc 08-codebase-delta §5.1
--
-- Adds the multi-tenant root entity (Tenant) and a nullable tenantId FK
-- on existing tenant-scopable tables (User, AcceptanceDecision,
-- PaymentOrder, PaymentEvent). FK is nullable so existing rows aren't
-- broken; backfill + NOT NULL tightening happens in a later migration
-- once we know every existing row's tenant context.
--
-- ON DELETE RESTRICT: tenants are never hard-deleted (audit integrity).
-- Soft delete is via Tenant.deletedAt.
--
-- Postgres RLS policies for tenant isolation are added in migration M2
-- (rbac_seed) after the role taxonomy + middleware contracts land.

-- ─────────────────────────────────────────────────────────────────────────
-- Tenant: multi-tenant root entity
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'pilot',
    "status" TEXT NOT NULL DEFAULT 'provisioning',
    "region" TEXT NOT NULL DEFAULT 'IN',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "contractRef" TEXT,
    "provisionedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- ─────────────────────────────────────────────────────────────────────────
-- User: add tenantId FK
-- ─────────────────────────────────────────────────────────────────────────
-- Null for cross-tenant users (contributors, mentors, platform admins).
-- Required (NOT NULL) for enterprise users in a later migration.

ALTER TABLE "User"
  ADD COLUMN "tenantId" TEXT;

ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- ─────────────────────────────────────────────────────────────────────────
-- AcceptanceDecision: add tenantId FK
-- ─────────────────────────────────────────────────────────────────────────
-- Enterprise acceptance decisions are always tenant-scoped.

ALTER TABLE "AcceptanceDecision"
  ADD COLUMN "tenantId" TEXT;

ALTER TABLE "AcceptanceDecision"
  ADD CONSTRAINT "AcceptanceDecision_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "AcceptanceDecision_tenantId_decidedAt_idx"
  ON "AcceptanceDecision"("tenantId", "decidedAt");

-- ─────────────────────────────────────────────────────────────────────────
-- PaymentOrder: add tenantId FK
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE "PaymentOrder"
  ADD COLUMN "tenantId" TEXT;

ALTER TABLE "PaymentOrder"
  ADD CONSTRAINT "PaymentOrder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PaymentOrder_tenantId_idx" ON "PaymentOrder"("tenantId");

-- ─────────────────────────────────────────────────────────────────────────
-- PaymentEvent: add tenantId FK
-- ─────────────────────────────────────────────────────────────────────────
-- Nullable for both reasons:
--   1. Existing rows pre-migration have no tenant context
--   2. Some webhook events are account-level (not tenant-scoped)

ALTER TABLE "PaymentEvent"
  ADD COLUMN "tenantId" TEXT;

ALTER TABLE "PaymentEvent"
  ADD CONSTRAINT "PaymentEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PaymentEvent_tenantId_idx" ON "PaymentEvent"("tenantId");
