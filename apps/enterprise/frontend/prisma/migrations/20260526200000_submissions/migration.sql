-- Migration M15 · submissions
-- Phase 1 foundations · doc 06 §10.1 criterion #10
--
-- Adds Submission + SubmissionArtifact. Extends TaskDefinition with
-- assignedContributorId / assignedAt / acceptedAt for live work
-- routing.
--
-- Both new tables are tenant-scoped (denormalized tenantId) with
-- RLS enforced.
--
-- DDL applied via `prisma db push`. This file records the RLS
-- policies + permission seed (applied via psql).

-- ═════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "Submission";
CREATE POLICY "tenant_isolation_select" ON "Submission" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "Submission";
CREATE POLICY "tenant_isolation_modify" ON "Submission" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE "SubmissionArtifact" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "SubmissionArtifact";
CREATE POLICY "tenant_isolation_select" ON "SubmissionArtifact" FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "SubmissionArtifact";
CREATE POLICY "tenant_isolation_modify" ON "SubmissionArtifact" FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

-- ═════════════════════════════════════════════════════════════════════
-- PERMISSIONS
-- ═════════════════════════════════════════════════════════════════════

INSERT INTO "Permission" ("code", "resource", "action", "description") VALUES
  ('create.submission',   'submission', 'create', 'Create a draft submission on an assigned task'),
  ('update.submission',   'submission', 'update', 'Edit a draft / feedback-requested submission'),
  ('submit.submission',   'submission', 'submit', 'Promote a draft to submitted (terminal commit for contributor)'),
  ('read.submission',     'submission', 'read',   'Read submissions (own as contributor; any as mentor/admin)'),
  ('assign.task',         'task',       'assign', 'Assign a TaskDefinition to a contributor (matching/operator action)'),
  ('claim.review',        'review',     'claim',  'Claim a submitted submission for mentor review')
ON CONFLICT (code) DO NOTHING;

-- ─── Role-permission mappings ───

-- Contributors: create / update / submit / read their own submissions.
-- Server enforces "own only" via contributorId check.
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('contributor', 'create.submission'),
  ('contributor', 'update.submission'),
  ('contributor', 'submit.submission'),
  ('contributor', 'read.submission')
ON CONFLICT DO NOTHING;

-- Mentors: read any submission, claim for review
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('mentor',        'read.submission'),
  ('mentor',        'claim.review'),
  ('mentor.senior', 'read.submission'),
  ('mentor.senior', 'claim.review'),
  ('mentor.lead',   'read.submission'),
  ('mentor.lead',   'claim.review')
ON CONFLICT DO NOTHING;

-- Enterprise: read submissions in own tenant (post-mentor); assign tasks
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('ent.admin',    'read.submission'),
  ('ent.admin',    'assign.task'),
  ('ent.pmo',      'read.submission'),
  ('ent.pmo',      'assign.task'),
  ('ent.reviewer', 'read.submission'),
  ('ent.sponsor',  'read.submission')
ON CONFLICT DO NOTHING;

-- Platform admins
INSERT INTO "RolePermission" ("roleCode", "permissionCode") VALUES
  ('plat.admin',      'read.submission'),
  ('plat.admin',      'assign.task'),
  ('plat.admin',      'claim.review'),
  ('plat.compliance', 'read.submission'),
  ('plat.tns',        'read.submission')
ON CONFLICT DO NOTHING;
