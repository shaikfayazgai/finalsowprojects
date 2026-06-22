-- Migration M2 · rbac_seed
-- Phase 1 foundations · doc 08-codebase-delta §5.1
--
-- Adds the RBAC schema (Role, Permission, RolePermission, UserRole) and
-- seeds the 20-role taxonomy from cross-functional spec §3.1 plus a
-- baseline permission catalog for tenant/user/role/audit/dashboard/
-- self-service operations.
--
-- Role taxonomy (4 scopes, 20 roles):
--   contributor                                      (1)
--   mentor · mentor.senior · mentor.lead             (3)
--   ent.admin · sponsor · pmo · finance · compliance · reviewer · procurement · it (8)
--   plat.admin · tsm · mpm · tns · compliance · payments · partnerships · ai (8)
--
-- SoD (separation-of-duties) is a SOFT warning per locked decision —
-- mutuallyExclusiveWith populated for known conflicts (e.g., ent.finance
-- vs ent.procurement); assignment surfaces in admin invite flows surface
-- the warning but don't hard-block.
--
-- This migration seeds only the M2-scope permissions (tenant, user, role,
-- audit, dashboard, self-service). Permissions for SOW, rate cards,
-- payouts, etc. are added in their respective migrations (M8, M11, M12).

-- ─────────────────────────────────────────────────────────────────────────
-- Role
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE "Role" (
    "code" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mutuallyExclusiveWith" TEXT[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "Role_scope_idx" ON "Role"("scope");

-- ─────────────────────────────────────────────────────────────────────────
-- Permission
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE "Permission" (
    "code" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");
CREATE INDEX "Permission_action_idx" ON "Permission"("action");

-- ─────────────────────────────────────────────────────────────────────────
-- RolePermission (many-to-many)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE "RolePermission" (
    "roleCode" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleCode", "permissionCode")
);

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_roleCode_fkey"
  FOREIGN KEY ("roleCode") REFERENCES "Role"("code")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_permissionCode_fkey"
  FOREIGN KEY ("permissionCode") REFERENCES "Permission"("code")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "RolePermission_permissionCode_idx" ON "RolePermission"("permissionCode");

-- ─────────────────────────────────────────────────────────────────────────
-- UserRole (many-to-many, optionally tenant-scoped)
-- ─────────────────────────────────────────────────────────────────────────
-- Synthetic id because Postgres treats NULL ≠ NULL — a single composite
-- unique constraint on (userId, roleCode, tenantId) would let a user
-- have two `mentor` roles (both with tenantId=NULL). Two partial unique
-- indexes below enforce uniqueness correctly across both cases.

CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleCode" TEXT NOT NULL,
    "tenantId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_roleCode_fkey"
  FOREIGN KEY ("roleCode") REFERENCES "Role"("code")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX "UserRole_roleCode_idx" ON "UserRole"("roleCode");
CREATE INDEX "UserRole_tenantId_idx" ON "UserRole"("tenantId");

-- Partial unique: tenant-scoped role assignments
CREATE UNIQUE INDEX "UserRole_unique_with_tenant"
  ON "UserRole"("userId", "roleCode", "tenantId")
  WHERE "tenantId" IS NOT NULL;

-- Partial unique: cross-tenant role assignments
CREATE UNIQUE INDEX "UserRole_unique_without_tenant"
  ON "UserRole"("userId", "roleCode")
  WHERE "tenantId" IS NULL;

-- ═════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═════════════════════════════════════════════════════════════════════════

-- ─── Seed: Roles (20 across 4 scopes) ───

INSERT INTO "Role" ("code", "scope", "description", "mutuallyExclusiveWith", "updatedAt") VALUES
  -- Contributor (1)
  ('contributor', 'contributor', 'Individual contributor performing tasks across tenants', '{}', CURRENT_TIMESTAMP),

  -- Mentor (3)
  ('mentor', 'mentor', 'Reviews contributor submissions; conducts mentorship sessions', '{}', CURRENT_TIMESTAMP),
  ('mentor.senior', 'mentor', 'Handles escalations + dispute adjudication forwarded from base mentors', '{}', CURRENT_TIMESTAMP),
  ('mentor.lead', 'mentor', 'Pool oversight + capacity management across mentors in their pool', '{}', CURRENT_TIMESTAMP),

  -- Enterprise (8)
  ('ent.admin', 'enterprise', 'Full enterprise admin — tenant config, roles, billing, integrations', '{}', CURRENT_TIMESTAMP),
  ('ent.sponsor', 'enterprise', 'Project sponsor — SOW authoring + approval + budget oversight', '{}', CURRENT_TIMESTAMP),
  ('ent.pmo', 'enterprise', 'PMO / Project Manager — decomposition, monitoring, exception management', '{}', CURRENT_TIMESTAMP),
  ('ent.finance', 'enterprise', 'Finance controller — rate cards, invoices, payouts, ERP exports', '{ent.procurement}', CURRENT_TIMESTAMP),
  ('ent.compliance', 'enterprise', 'Compliance officer — audit, governance config, risk dashboards', '{}', CURRENT_TIMESTAMP),
  ('ent.reviewer', 'enterprise', 'Internal client reviewer — two-stage review accept/reject/rework', '{}', CURRENT_TIMESTAMP),
  ('ent.procurement', 'enterprise', 'Procurement lead — PO creation, vendor records, SOW-to-PO mapping', '{ent.finance}', CURRENT_TIMESTAMP),
  ('ent.it', 'enterprise', 'IT / Security admin — SSO, HRIS, webhooks, security policies', '{}', CURRENT_TIMESTAMP),

  -- Platform (Glimmora staff, 8)
  ('plat.admin', 'platform', 'Super-admin — full read/write across the Glimmora platform', '{}', CURRENT_TIMESTAMP),
  ('plat.tsm', 'platform', 'Tenant Success Manager — tenant onboarding, provisioning, customer health', '{}', CURRENT_TIMESTAMP),
  ('plat.mpm', 'platform', 'Mentor Program Manager — mentor pool, competencies, pairings', '{}', CURRENT_TIMESTAMP),
  ('plat.tns', 'platform', 'Trust & Safety Officer — governance triage, dispute adjudication, safety triage', '{}', CURRENT_TIMESTAMP),
  ('plat.compliance', 'platform', 'Glimmora Compliance Officer — cross-tenant audit, retention, regulatory evidence', '{}', CURRENT_TIMESTAMP),
  ('plat.payments', 'platform', 'Payments Operator — payment rail config, reconciliation, payout escalations', '{}', CURRENT_TIMESTAMP),
  ('plat.partnerships', 'platform', 'Partnership Manager — university + women-workforce programs', '{}', CURRENT_TIMESTAMP),
  ('plat.ai', 'platform', 'AI Operator — agent configuration, prompt templates, model monitoring', '{}', CURRENT_TIMESTAMP);

-- ─── Seed: Permissions (baseline 28) ───

INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  -- Tenant
  ('create.tenant', 'tenant', 'create', 'Provision a new enterprise tenant'),
  ('read.tenant', 'tenant', 'read', 'Read tenant info'),
  ('update.tenant', 'tenant', 'update', 'Update tenant config'),
  ('pause.tenant', 'tenant', 'pause', 'Pause tenant access (blocks logins)'),
  ('resume.tenant', 'tenant', 'resume', 'Resume a paused tenant'),
  ('close.tenant', 'tenant', 'close', 'Close tenant (soft delete; audit-retained)'),

  -- User management
  ('read.user', 'user', 'read', 'Read any user in scope'),
  ('read.user.self', 'user', 'read.self', 'Read own user record'),
  ('create.user', 'user', 'create', 'Create new user'),
  ('invite.user', 'user', 'invite', 'Send invite to new user via email'),
  ('update.user', 'user', 'update', 'Update any user in scope'),
  ('update.user.self', 'user', 'update.self', 'Update own user record'),
  ('suspend.user', 'user', 'suspend', 'Suspend a user account (revokes all sessions)'),

  -- Roles & RBAC
  ('read.role', 'role', 'read', 'Read role definitions'),
  ('assign.role', 'role', 'assign', 'Assign role to user'),
  ('revoke.role', 'role', 'revoke', 'Revoke role from user'),
  ('create.role', 'role', 'create', 'Create new role definition (platform-side only)'),

  -- Audit
  ('read.audit', 'audit', 'read', 'Read audit events in own scope'),
  ('read.audit.cross_tenant', 'audit', 'read.cross_tenant', 'Read audit events across all tenants'),
  ('export.audit', 'audit', 'export', 'Export audit events to CSV/JSON/NDJSON'),

  -- Dashboard + self-service (granted to every authenticated role)
  ('read.dashboard.self', 'dashboard', 'read.self', 'View own portal dashboard'),
  ('read.profile.self', 'profile', 'read.self', 'Read own profile'),
  ('update.profile.self', 'profile', 'update.self', 'Update own profile'),
  ('manage.session.self', 'session', 'manage.self', 'Manage own active sessions (revoke, view)'),
  ('manage.mfa.self', 'mfa', 'manage.self', 'Manage own MFA factors (setup, disable)'),
  ('manage.consent.self', 'consent', 'manage.self', 'View / modify own consent records'),
  ('read.notification.self', 'notification', 'read.self', 'Read own notifications'),
  ('update.notification_preferences.self', 'notification_preferences', 'update.self', 'Update own notification channel preferences');

-- ─── Seed: Role-Permission mappings ───

-- Every authenticated role gets the self-service + dashboard bundle
INSERT INTO "RolePermission" ("roleCode", "permissionCode")
SELECT r.code, p.code
FROM "Role" r
CROSS JOIN "Permission" p
WHERE p.code IN (
  'read.profile.self',
  'update.profile.self',
  'manage.session.self',
  'manage.mfa.self',
  'manage.consent.self',
  'read.notification.self',
  'update.notification_preferences.self',
  'read.dashboard.self',
  'read.user.self',
  'update.user.self'
);

-- ─── plat.admin: everything in M2 scope ───
INSERT INTO "RolePermission" ("roleCode", "permissionCode")
SELECT 'plat.admin', code FROM "Permission"
WHERE code NOT LIKE '%.self';

-- ─── Platform roles (selective grants) ───

-- Tenant Success Manager
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.tsm', 'create.tenant'),
  ('plat.tsm', 'read.tenant'),
  ('plat.tsm', 'update.tenant'),
  ('plat.tsm', 'pause.tenant'),
  ('plat.tsm', 'resume.tenant'),
  ('plat.tsm', 'read.user'),
  ('plat.tsm', 'invite.user'),
  ('plat.tsm', 'read.audit');

-- Mentor Program Manager (mentor management; minimal tenant access)
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.mpm', 'read.tenant'),
  ('plat.mpm', 'read.user'),
  ('plat.mpm', 'read.audit');

-- Trust & Safety
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.tns', 'read.tenant'),
  ('plat.tns', 'read.user'),
  ('plat.tns', 'suspend.user'),
  ('plat.tns', 'read.audit'),
  ('plat.tns', 'read.audit.cross_tenant');

-- Glimmora Compliance — read across tenants + export
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.compliance', 'read.tenant'),
  ('plat.compliance', 'read.user'),
  ('plat.compliance', 'read.role'),
  ('plat.compliance', 'read.audit'),
  ('plat.compliance', 'read.audit.cross_tenant'),
  ('plat.compliance', 'export.audit');

-- Payments
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.payments', 'read.tenant'),
  ('plat.payments', 'read.audit');

-- Partnerships
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.partnerships', 'read.tenant'),
  ('plat.partnerships', 'read.user'),
  ('plat.partnerships', 'read.audit');

-- AI Operator
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.ai', 'read.tenant'),
  ('plat.ai', 'read.audit');

-- ─── Enterprise roles (selective grants) ───

-- ent.admin: full tenant scope
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.admin', 'read.tenant'),
  ('ent.admin', 'update.tenant'),
  ('ent.admin', 'read.user'),
  ('ent.admin', 'create.user'),
  ('ent.admin', 'invite.user'),
  ('ent.admin', 'update.user'),
  ('ent.admin', 'suspend.user'),
  ('ent.admin', 'read.role'),
  ('ent.admin', 'assign.role'),
  ('ent.admin', 'revoke.role'),
  ('ent.admin', 'read.audit'),
  ('ent.admin', 'export.audit');

-- ent.sponsor
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.sponsor', 'read.tenant'),
  ('ent.sponsor', 'read.user'),
  ('ent.sponsor', 'read.audit');

-- ent.pmo
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.pmo', 'read.tenant'),
  ('ent.pmo', 'read.user'),
  ('ent.pmo', 'read.audit');

-- ent.finance
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.finance', 'read.tenant'),
  ('ent.finance', 'read.user'),
  ('ent.finance', 'read.audit'),
  ('ent.finance', 'export.audit');

-- ent.compliance
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.compliance', 'read.tenant'),
  ('ent.compliance', 'read.user'),
  ('ent.compliance', 'read.role'),
  ('ent.compliance', 'read.audit'),
  ('ent.compliance', 'export.audit');

-- ent.reviewer (minimal — review-specific perms come in M10)
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.reviewer', 'read.tenant'),
  ('ent.reviewer', 'read.audit');

-- ent.procurement
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.procurement', 'read.tenant'),
  ('ent.procurement', 'read.user'),
  ('ent.procurement', 'read.audit');

-- ent.it
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.it', 'read.tenant'),
  ('ent.it', 'read.user'),
  ('ent.it', 'read.audit');

-- ─── Mentor roles ───

INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('mentor', 'read.audit');

INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('mentor.senior', 'read.audit');

-- mentor.lead also reads team members
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('mentor.lead', 'read.user'),
  ('mentor.lead', 'read.audit');

-- ─── Contributor: only self-service from the CROSS JOIN above ───
-- (no extra grants needed in M2; resource-specific grants land with M9+)
