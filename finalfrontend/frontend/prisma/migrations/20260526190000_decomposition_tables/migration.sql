-- Migration M11 · decomposition_tables
-- Phase 1 foundations · doc 06 §10.0 priority #4
--
-- Adds DecompositionPlan + Milestone + TaskDefinition + TaskDependency.
-- All tenant-scoped via denormalized tenantId; RLS enforces isolation.
-- Seeds 5 permissions + role mappings.
--
-- Schema highlights:
--   - DecompositionPlan: 1+ per SOW (versioned). Lifecycle:
--       draft → approved → active → archived.
--   - Milestone: phase grouping within a plan. `order` is unique within
--       plan; drives display sort.
--   - TaskDefinition: atomic units routed to contributors. Carries
--       requiredSkills[] (codes from M10 taxonomy), estimatedHours,
--       acceptance criteria, complexity. AI vs PMO edits tracked.
--   - TaskDependency: DAG edges between tasks. Phase 1 only uses
--       'finish_to_start'.
--
-- DDL applied via `prisma db push`. This file records:
--   1. RLS policies on the 4 new tables (applied via psql)
--   2. GIN index on TaskDefinition.requiredSkills (raw SQL)
--   3. Permission + role-mapping seed (applied via psql)

-- ═════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE "DecompositionPlan" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "DecompositionPlan";
CREATE POLICY "tenant_isolation_select" ON "DecompositionPlan" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "DecompositionPlan";
CREATE POLICY "tenant_isolation_modify" ON "DecompositionPlan" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "Milestone";
CREATE POLICY "tenant_isolation_select" ON "Milestone" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "Milestone";
CREATE POLICY "tenant_isolation_modify" ON "Milestone" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE "TaskDefinition" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "TaskDefinition";
CREATE POLICY "tenant_isolation_select" ON "TaskDefinition" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "TaskDefinition";
CREATE POLICY "tenant_isolation_modify" ON "TaskDefinition" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE "TaskDependency" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "TaskDependency";
CREATE POLICY "tenant_isolation_select" ON "TaskDependency" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "TaskDependency";
CREATE POLICY "tenant_isolation_modify" ON "TaskDependency" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

-- ─── GIN index on requiredSkills for matching engine ───
-- Speeds up "find tasks needing skill X" lookups used by the
-- contributor task feed + match scoring.
CREATE INDEX IF NOT EXISTS "TaskDefinition_requiredSkills_gin"
  ON "TaskDefinition" USING GIN ("requiredSkills");

-- ═════════════════════════════════════════════════════════════════════
-- SEED: 5 decomposition permissions
-- ═════════════════════════════════════════════════════════════════════

INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  ('read.decomposition_plan',    'decomposition_plan', 'read',    'Read decomposition plans + milestones + tasks'),
  ('manage.decomposition_plan',  'decomposition_plan', 'manage',  'Create / update plans, milestones, tasks, dependencies'),
  ('approve.decomposition_plan', 'decomposition_plan', 'approve', 'Sponsor sign-off on a plan; advances draft → approved'),
  ('activate.decomposition_plan','decomposition_plan', 'activate','Provision an approved plan into live tasks'),
  ('archive.decomposition_plan', 'decomposition_plan', 'archive', 'Archive a plan version')
ON CONFLICT (code) DO NOTHING;

-- ─── Role-permission mappings ───

-- plat.admin: all decomposition permissions
INSERT INTO "RolePermission" ("roleCode", "permissionCode")
SELECT 'plat.admin', code FROM "Permission" WHERE "resource" = 'decomposition_plan'
ON CONFLICT DO NOTHING;

-- ent.admin: all
INSERT INTO "RolePermission" ("roleCode", "permissionCode")
SELECT 'ent.admin', code FROM "Permission" WHERE "resource" = 'decomposition_plan'
ON CONFLICT DO NOTHING;

-- ent.sponsor: create draft + read + approve (sign-off)
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.sponsor', 'read.decomposition_plan'),
  ('ent.sponsor', 'manage.decomposition_plan'),
  ('ent.sponsor', 'approve.decomposition_plan')
ON CONFLICT DO NOTHING;

-- ent.pmo: day-to-day planner — create, read, update, activate
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.pmo', 'read.decomposition_plan'),
  ('ent.pmo', 'manage.decomposition_plan'),
  ('ent.pmo', 'activate.decomposition_plan'),
  ('ent.pmo', 'archive.decomposition_plan')
ON CONFLICT DO NOTHING;

-- ent.reviewer: read-only oversight
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.reviewer', 'read.decomposition_plan')
ON CONFLICT DO NOTHING;

-- plat.compliance: read-only oversight
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.compliance', 'read.decomposition_plan')
ON CONFLICT DO NOTHING;
