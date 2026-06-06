-- Migration M18 · credentials
-- Phase 1 foundations · doc 06 §10.1 criterion #13 (credential issued)
--
-- Adds Credential — one row per accepted submission, auto-issued
-- atomically with PayoutRecord by the mentor accept hook.
--
-- NOT RLS-protected (same rationale as PayoutRecord: contributors
-- read their own cross-tenant; public verify uses shareSlug). App
-- layer enforces scope.
--
-- DDL applied via `prisma db push`. This file seeds permissions only.

INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  ('read.credential',   'credential', 'read',   'Read credentials (own as contributor; tenant as admin; all as plat.*)'),
  ('issue.credential',  'credential', 'issue',  'Manually issue a credential (typically system-triggered on accept)'),
  ('revoke.credential', 'credential', 'revoke', 'Revoke a credential (T&S / compliance / tenant admin)')
ON CONFLICT (code) DO NOTHING;

-- ─── Role-permission mappings ───

-- Contributors: read own credentials
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('contributor', 'read.credential')
ON CONFLICT DO NOTHING;

-- Mentors: read credentials they may have been part of issuing (for context)
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('mentor',        'read.credential'),
  ('mentor.senior', 'read.credential'),
  ('mentor.lead',   'read.credential')
ON CONFLICT DO NOTHING;

-- Enterprise: read tenant-scoped credentials; admin can revoke
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.admin',    'read.credential'),
  ('ent.admin',    'revoke.credential'),
  ('ent.pmo',      'read.credential'),
  ('ent.sponsor',  'read.credential'),
  ('ent.reviewer', 'read.credential')
ON CONFLICT DO NOTHING;

-- Platform: full powers
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.admin',      'read.credential'),
  ('plat.admin',      'issue.credential'),
  ('plat.admin',      'revoke.credential'),
  ('plat.tns',        'read.credential'),
  ('plat.tns',        'revoke.credential'),
  ('plat.compliance', 'read.credential'),
  ('plat.compliance', 'revoke.credential')
ON CONFLICT DO NOTHING;
