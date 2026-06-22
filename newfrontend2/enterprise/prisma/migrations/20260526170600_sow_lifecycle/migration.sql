-- Migration M8 · sow_lifecycle
-- Phase 1 foundations · SOW §3.1.MVP.1 + doc 02 §5.C
--
-- Adds Sow + SowVersion + Approval + SowTemplate.
-- Enables RLS on all four (tenant-scoped via denormalized tenantId).
-- Seeds 15 new SOW permissions + maps them to existing roles.
--
-- Schema highlights:
--   - Sow:         lifecycle entity. status + stage drive the approval pipeline.
--                  activeVersion points to the currently-displayed SowVersion.
--   - SowVersion:  immutable snapshots; new version on edit / send-back.
--                  payload is JSON during Phase 1 shape settling.
--   - Approval:    per-stage decision rows. 5 stages (business → final).
--                  Send-back creates a new pending row when returning to a stage.
--   - SowTemplate: configurable intake templates. tenantId nullable
--                  (null = platform-wide, available to all tenants).
--
-- Note: schema CREATE TABLE statements are applied via `prisma db push`
-- (Phase 1 dev mode). This file is the canonical record for when the
-- migration history is cleaned up pre-prod (see doc 06 risk R-11).
-- The seed + RLS + grant blocks below ARE applied directly via psql.

-- ─────────────────────────────────────────────────────────────────────
-- RLS policies on tenant-scoped SOW tables
-- ─────────────────────────────────────────────────────────────────────
-- All four tables follow the same pattern as M5 (AcceptanceDecision et al):
-- visible iff tenantId IS NULL OR tenantId matches app.tenant_id.

ALTER TABLE "Sow" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "Sow";
CREATE POLICY "tenant_isolation_select" ON "Sow" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "Sow";
CREATE POLICY "tenant_isolation_modify" ON "Sow" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE "SowVersion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "SowVersion";
CREATE POLICY "tenant_isolation_select" ON "SowVersion" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "SowVersion";
CREATE POLICY "tenant_isolation_modify" ON "SowVersion" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE "Approval" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "Approval";
CREATE POLICY "tenant_isolation_select" ON "Approval" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "Approval";
CREATE POLICY "tenant_isolation_modify" ON "Approval" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE "SowTemplate" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "SowTemplate";
CREATE POLICY "tenant_isolation_select" ON "SowTemplate" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "SowTemplate";
CREATE POLICY "tenant_isolation_modify" ON "SowTemplate" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

-- ═════════════════════════════════════════════════════════════════════
-- SEED: 15 SOW permissions
-- ═════════════════════════════════════════════════════════════════════

INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  -- SOW lifecycle
  ('create.sow',                'sow', 'create',                'Create a new SOW (sponsor / admin)'),
  ('read.sow',                  'sow', 'read',                  'Read SOWs in own tenant scope'),
  ('update.sow',                'sow', 'update',                'Update a draft SOW'),
  ('delete.sow',                'sow', 'delete',                'Soft-delete (archive) a SOW'),
  ('submit.sow',                'sow', 'submit',                'Submit a draft SOW into the approval pipeline'),
  ('withdraw.sow',              'sow', 'withdraw',              'Withdraw a SOW from approval'),
  ('archive.sow',               'sow', 'archive',               'Archive a closed SOW'),
  -- Per-stage approval permissions
  ('approve.sow.business',      'sow', 'approve.business',      'Approve at the Business stage'),
  ('approve.sow.commercial',    'sow', 'approve.commercial',    'Approve at the Commercial stage'),
  ('approve.sow.legal',         'sow', 'approve.legal',         'Approve at the Legal stage'),
  ('approve.sow.security',      'sow', 'approve.security',      'Approve at the Security stage'),
  ('approve.sow.final',         'sow', 'approve.final',         'Approve at the Final stage'),
  -- SOW templates
  ('create.sow_template',       'sow_template', 'create',       'Create a SOW intake template'),
  ('read.sow_template',         'sow_template', 'read',         'Read SOW templates'),
  ('update.sow_template',       'sow_template', 'update',       'Update a SOW template')
ON CONFLICT (code) DO NOTHING;

-- ─── Role-permission mappings ───

-- ent.admin: all SOW permissions
INSERT INTO "RolePermission" ("roleCode", "permissionCode")
SELECT 'ent.admin', code FROM "Permission" WHERE "resource" IN ('sow', 'sow_template')
ON CONFLICT DO NOTHING;

-- plat.admin: all SOW permissions (cross-tenant via tenantId-scope)
INSERT INTO "RolePermission" ("roleCode", "permissionCode")
SELECT 'plat.admin', code FROM "Permission" WHERE "resource" IN ('sow', 'sow_template')
ON CONFLICT DO NOTHING;

-- ent.sponsor: author + manage own SOWs; gets final-stage sign-off
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.sponsor', 'create.sow'),
  ('ent.sponsor', 'read.sow'),
  ('ent.sponsor', 'update.sow'),
  ('ent.sponsor', 'submit.sow'),
  ('ent.sponsor', 'withdraw.sow'),
  ('ent.sponsor', 'approve.sow.business'),
  ('ent.sponsor', 'approve.sow.final'),
  ('ent.sponsor', 'read.sow_template')
ON CONFLICT DO NOTHING;

-- ent.pmo: read access; helps the sponsor / runs decomposition after approval
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.pmo', 'read.sow'),
  ('ent.pmo', 'read.sow_template')
ON CONFLICT DO NOTHING;

-- ent.finance: commercial-stage approver
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.finance', 'read.sow'),
  ('ent.finance', 'approve.sow.commercial')
ON CONFLICT DO NOTHING;

-- ent.compliance: legal-stage approver
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.compliance', 'read.sow'),
  ('ent.compliance', 'approve.sow.legal')
ON CONFLICT DO NOTHING;

-- ent.it: security-stage approver
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.it', 'read.sow'),
  ('ent.it', 'approve.sow.security')
ON CONFLICT DO NOTHING;

-- plat.compliance: cross-tenant audit read
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.compliance', 'read.sow')
ON CONFLICT DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════
-- SEED: 2 platform-wide SOW templates
-- ═════════════════════════════════════════════════════════════════════
-- Phase 1 ships with these defaults per doc 02 §5.C.10. Tenants can
-- clone + customize. The `spec` is a JSON-shaped descriptor; the front-
-- end + intake AI use it to know what fields to extract.

INSERT INTO "SowTemplate" ("id", "tenantId", "name", "description", "spec", "defaults", "isDefault", "updatedAt") VALUES
  (
    'tpl-software-default', NULL,
    'Software project',
    'Default template for software development / engineering SOWs',
    '{"sections":["overview","deliverables","milestones","acceptance_criteria","dependencies","constraints","risk_assessment"],"requiredFields":["title","startDate","endDate","sponsor","deliverables"],"approverChain":["business","commercial","legal","security","final"]}'::jsonb,
    '{"riskThresholds":{"completenessMin":70,"confidenceMin":65},"slaHours":{"business":48,"commercial":48,"legal":72,"security":72,"final":48}}'::jsonb,
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'tpl-design-default', NULL,
    'Design system / UX project',
    'Default template for design + product engagements',
    '{"sections":["overview","deliverables","milestones","acceptance_criteria","design_system_scope","accessibility_requirements"],"requiredFields":["title","startDate","endDate","sponsor","deliverables"],"approverChain":["business","commercial","legal","final"]}'::jsonb,
    '{"riskThresholds":{"completenessMin":70,"confidenceMin":65},"slaHours":{"business":48,"commercial":48,"legal":48,"final":24}}'::jsonb,
    false,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO NOTHING;
