-- Migration M17a · payouts (schema + eligibility)
-- Phase 1 foundations · doc 06 §10.1 criterion #13 (payout becomes eligible)
--
-- Adds PayoutMethod + PayoutRecord. Extends TaskDefinition with
-- agreedRatePerHour + agreedCurrency for rate snapshotting at assign
-- time.
--
-- NOTE on RLS: PayoutRecord is NOT covered by RLS in Phase 1. Contributors
-- need to read their own payouts across multiple tenants; the standard
-- tenant-isolation policy would block that. Application layer enforces
-- read scope (contributorId match OR tenantId match) via the request
-- handler. A future migration will add a user-aware policy once the
-- broader `app.user_id` session var pattern lands.
--
-- DDL applied via `prisma db push`. This file seeds permissions only.

-- ═════════════════════════════════════════════════════════════════════
-- PERMISSIONS
-- ═════════════════════════════════════════════════════════════════════

INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  ('manage.payout_method', 'payout_method', 'manage',  'Add / edit / remove own payout methods'),
  ('read.payout_method',   'payout_method', 'read',    'Read own payout methods (or admin: any)'),
  ('read.payout',          'payout',        'read',    'Read payouts (own as contributor; tenant as finance; all as plat.payments)'),
  ('record.payout',        'payout',        'record',  'Trigger / advance / hold a payout state machine'),
  ('verify.payout_method', 'payout_method', 'verify',  'Approve a payout method after name-match check')
ON CONFLICT (code) DO NOTHING;

-- ─── Role-permission mappings ───

-- Contributors: manage own methods, read own
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('contributor', 'manage.payout_method'),
  ('contributor', 'read.payout_method'),
  ('contributor', 'read.payout')
ON CONFLICT DO NOTHING;

-- Enterprise finance: read tenant payouts (no own, since they're not paying themselves)
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.finance', 'read.payout'),
  ('ent.admin',   'read.payout'),
  ('ent.pmo',     'read.payout')
ON CONFLICT DO NOTHING;

-- Platform payments role drives the actual rail
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.payments', 'read.payout'),
  ('plat.payments', 'record.payout'),
  ('plat.payments', 'verify.payout_method'),
  ('plat.payments', 'read.payout_method'),
  ('plat.admin',    'read.payout'),
  ('plat.admin',    'record.payout'),
  ('plat.admin',    'verify.payout_method'),
  ('plat.admin',    'read.payout_method')
ON CONFLICT DO NOTHING;

-- Compliance: read-only oversight
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.compliance', 'read.payout'),
  ('plat.compliance', 'read.payout_method')
ON CONFLICT DO NOTHING;
