-- ============================================================================
-- Local dev seed for the enterprise portal.
--
-- Scope: m19-tenant-a (the existing dev tenant). Login as
--   m19-sponsor-a@example.com (no password set — go through credentials
--   provider if the upstream backend is reachable, or via OAuth).
--
-- Idempotent: re-running clears the seeded fixtures first (see DELETEs at
-- the top of each section), then re-inserts. Existing audit events,
-- payment orders, and user rows are NOT touched.
--
-- Usage:
--   psql -d glimmora_dev -f prisma/seed.sql
--
-- Or via the npm script (`npm run db:seed:local`).
-- ============================================================================

\set ON_ERROR_STOP on
\set tenant '''m19-tenant-a'''
\set sponsor '''m19-sponsor-a'''

BEGIN;

-- ------------------------------------------------------------------
-- Tenant config: rate cards + retention rules + readable name/domain
-- ------------------------------------------------------------------
UPDATE "Tenant"
SET name = 'Glimmora HQ',
    domain = 'glimmora.ai',
    "domainVerified" = true,
    "subscriptionTier" = 'enterprise',
    "subscriptionStartedAt" = '2026-01-01T00:00:00Z',
    "trialEndsAt" = NULL,
    status = 'active',
    "rateCards" = '{
      "currency": "INR",
      "default": 120000,
      "bySegment": {
        "student": 80000,
        "women_workforce": 130000,
        "general_workforce": 120000,
        "internal": 150000
      }
    }'::jsonb,
    "retentionRules" = '{
      "auditEvents": {"mode": "indefinite"},
      "taskEvidence": {"mode": "days", "days": 2555},
      "withdrawnSubmissions": {"mode": "days", "days": 90},
      "submissionArtifacts": {"mode": "days", "days": 730},
      "contributorPII": {"mode": "days", "days": 1095}
    }'::jsonb
WHERE id = :tenant;

-- ------------------------------------------------------------------
-- SOWs — three covering different states
-- ------------------------------------------------------------------
DELETE FROM "Approval" WHERE "tenantId" = :tenant AND "sowId" LIKE 'seed-sow-%';
DELETE FROM "SowVersion" WHERE "tenantId" = :tenant AND "sowId" LIKE 'seed-sow-%';
DELETE FROM "Sow" WHERE "tenantId" = :tenant AND id LIKE 'seed-sow-%';

INSERT INTO "Sow" (id, "tenantId", title, status, stage, "activeVersion", "ownerId", confidentiality, "submittedForApprovalAt", "approvedAt", "createdAt", "updatedAt")
VALUES
  ('seed-sow-helios-q3', :tenant, 'Helios Q3 modernization', 'approval', 'commercial', 2, :sponsor, 'confidential', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours'),
  ('seed-sow-reporting-v2', :tenant, 'Reporting V2 platform', 'approved', NULL, 1, :sponsor, 'internal', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '5 days'),
  ('seed-sow-auth-mod', :tenant, 'Auth modernize', 'draft', NULL, 1, :sponsor, 'internal', NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour');

INSERT INTO "SowVersion" (id, "sowId", version, "tenantId", payload, body, "changeNote", "createdBy", "createdAt")
VALUES
  ('seed-sov-helios-v1', 'seed-sow-helios-q3', 1, :tenant,
   '{"deliverables":[{"id":"D1","title":"Tenant identity + SSO"},{"id":"D2","title":"Reporting surfaces"}],"riskScore":{"completeness":0.82,"confidence":0.74,"compliance":0.91,"patternMatch":0.78,"overall":0.81}}'::jsonb,
   '# Helios Q3 modernization

This SOW covers infrastructure modernization for Helios Q3.

## Scope
- Tenant identity + SSO refresh
- Reporting surfaces rebuild on new pipeline

## Deliverables
D1, D2, D3 — see decomposition plan.', 'Initial draft', :sponsor, NOW() - INTERVAL '5 days'),
  ('seed-sov-helios-v2', 'seed-sow-helios-q3', 2, :tenant,
   '{"deliverables":[{"id":"D1","title":"Tenant identity + SSO"},{"id":"D2","title":"Reporting surfaces"},{"id":"D3","title":"Compliance audit pack"}],"riskScore":{"completeness":0.92,"confidence":0.84,"compliance":0.95,"patternMatch":0.81,"overall":0.88}}'::jsonb,
   '# Helios Q3 modernization (v2)

Title polished, D3 (compliance audit pack) added, dependencies updated.', 'Title polished, D3 added, dependencies updated', :sponsor, NOW() - INTERVAL '3 days'),
  ('seed-sov-reporting-v1', 'seed-sow-reporting-v2', 1, :tenant,
   '{"deliverables":[{"id":"D1","title":"Data plumbing"},{"id":"D2","title":"Report builder UI"},{"id":"D3","title":"Export & schedules"}],"riskScore":{"completeness":0.88,"confidence":0.79,"compliance":0.92,"patternMatch":0.82,"overall":0.85}}'::jsonb,
   '# Reporting V2 platform

Replace the legacy reporting stack.', 'Initial submission', :sponsor, NOW() - INTERVAL '14 days'),
  ('seed-sov-auth-v1', 'seed-sow-auth-mod', 1, :tenant,
   '{"deliverables":[{"id":"D1","title":"SSO integration"},{"id":"D2","title":"MFA flows"}],"riskScore":{"completeness":0.51,"confidence":0.55,"compliance":0.72,"patternMatch":0.6,"overall":0.6}}'::jsonb,
   '# Auth modernize

Modernize the authentication stack with SSO + MFA.', 'Initial draft', :sponsor, NOW() - INTERVAL '1 day');

-- Approval rows for Helios (v2, currently at commercial)
INSERT INTO "Approval" (id, "sowId", "sowVersion", "tenantId", stage, "approverId", decision, comment, "decidedAt", "createdAt", "slaDeadline")
VALUES
  ('seed-ap-helios-bus', 'seed-sow-helios-q3', 2, :tenant, 'business', :sponsor, 'approved', 'Aligned with Q3 OKRs; budget pre-committed via PO-9421.', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 days', NOW() + INTERVAL '46 hours'),
  ('seed-ap-helios-com', 'seed-sow-helios-q3', 2, :tenant, 'commercial', NULL, 'pending', NULL, NULL, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '46 hours'),
  ('seed-ap-helios-leg', 'seed-sow-helios-q3', 2, :tenant, 'legal', NULL, 'pending', NULL, NULL, NOW() - INTERVAL '2 hours', NULL),
  ('seed-ap-helios-sec', 'seed-sow-helios-q3', 2, :tenant, 'security', NULL, 'pending', NULL, NULL, NOW() - INTERVAL '2 hours', NULL),
  ('seed-ap-helios-fin', 'seed-sow-helios-q3', 2, :tenant, 'final', NULL, 'pending', NULL, NULL, NOW() - INTERVAL '2 hours', NULL),
  ('seed-ap-rep-bus', 'seed-sow-reporting-v2', 1, :tenant, 'business', :sponsor, 'approved', 'Sponsor signoff.', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NULL),
  ('seed-ap-rep-com', 'seed-sow-reporting-v2', 1, :tenant, 'commercial', :sponsor, 'approved', 'Rates within band.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 days', NULL),
  ('seed-ap-rep-leg', 'seed-sow-reporting-v2', 1, :tenant, 'legal', :sponsor, 'approved', 'NDA in place.', NOW() - INTERVAL '8 days', NOW() - INTERVAL '12 days', NULL),
  ('seed-ap-rep-sec', 'seed-sow-reporting-v2', 1, :tenant, 'security', :sponsor, 'approved', 'Data classification reviewed.', NOW() - INTERVAL '6 days', NOW() - INTERVAL '12 days', NULL),
  ('seed-ap-rep-fin', 'seed-sow-reporting-v2', 1, :tenant, 'final', :sponsor, 'approved', 'Approved for provisioning.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '12 days', NULL);

-- ------------------------------------------------------------------
-- Decomposition plans (one for the approved Reporting V2 SOW)
-- ------------------------------------------------------------------
DELETE FROM "TaskDependency" WHERE "tenantId" = :tenant AND "fromTaskId" LIKE 'seed-task-%';
DELETE FROM "TaskDefinition" WHERE "tenantId" = :tenant AND id LIKE 'seed-task-%';
DELETE FROM "Milestone" WHERE "tenantId" = :tenant AND id LIKE 'seed-ms-%';
DELETE FROM "DecompositionPlan" WHERE "tenantId" = :tenant AND id LIKE 'seed-plan-%';

INSERT INTO "DecompositionPlan" (id, "sowId", "tenantId", version, status, summary, "createdBy", "createdAt", "updatedAt")
VALUES
  ('seed-plan-rep-v2', 'seed-sow-reporting-v2', :tenant, 1, 'approved',
   'Decomposition for Reporting V2: 3 milestones, 7 tasks, 4 dependencies. Sponsor approved.',
   :sponsor, NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
  ('seed-plan-helios-v1', 'seed-sow-helios-q3', :tenant, 1, 'draft',
   'Working draft — Helios Q3 milestone breakdown. Pending sponsor approval.',
   :sponsor, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '2 hours');

INSERT INTO "Milestone" (id, "planId", "tenantId", "order", name, description, "startDate", "endDate", status, "createdAt", "updatedAt")
VALUES
  ('seed-ms-rep-m1', 'seed-plan-rep-v2', :tenant, 1, 'Data plumbing', 'Source connectors + ETL spec + validation.', NOW() - INTERVAL '3 days', NOW() + INTERVAL '15 days', 'in_progress', NOW() - INTERVAL '4 days', NOW()),
  ('seed-ms-rep-m2', 'seed-plan-rep-v2', :tenant, 2, 'Report builder UI', 'New report authoring surfaces.', NOW() + INTERVAL '14 days', NOW() + INTERVAL '40 days', 'pending', NOW() - INTERVAL '4 days', NOW()),
  ('seed-ms-rep-m3', 'seed-plan-rep-v2', :tenant, 3, 'Export & schedules', 'PDF/CSV export, scheduled distributions.', NOW() + INTERVAL '38 days', NOW() + INTERVAL '60 days', 'pending', NOW() - INTERVAL '4 days', NOW()),
  ('seed-ms-helios-m1', 'seed-plan-helios-v1', :tenant, 1, 'Foundation & infra', 'Tenancy bootstrap.', NOW(), NOW() + INTERVAL '20 days', 'pending', NOW() - INTERVAL '12 hours', NOW()),
  ('seed-ms-helios-m2', 'seed-plan-helios-v1', :tenant, 2, 'Auth + tenanting', 'SSO + per-tenant data isolation.', NOW() + INTERVAL '18 days', NOW() + INTERVAL '45 days', 'pending', NOW() - INTERVAL '12 hours', NOW());

INSERT INTO "TaskDefinition" (id, "planId", "milestoneId", "tenantId", "externalKey", title, description, "requiredSkills", "estimatedHours", "acceptanceCriteria", complexity, "order", status, "aiConfidence", "pmoEdited", "createdAt", "updatedAt")
VALUES
  ('seed-task-rep-t1', 'seed-plan-rep-v2', 'seed-ms-rep-m1', :tenant, 'T-1', 'Connect Snowflake source', 'Set up read-only Snowflake connector with network policy.', ARRAY['snowflake','sql','l3'], 8, 'Read access works from analytics warehouse; network policy whitelisted; connection pool configured.', 'medium', 1, 'in_progress', 86, true, NOW() - INTERVAL '4 days', NOW()),
  ('seed-task-rep-t2', 'seed-plan-rep-v2', 'seed-ms-rep-m1', :tenant, 'T-2', 'ETL spec', 'Specify nightly ETL pipeline.', ARRAY['sql','dbt','l3'], 12, 'Spec covers source→raw→curated; runbook published.', 'medium', 2, 'ready', 80, false, NOW() - INTERVAL '4 days', NOW()),
  ('seed-task-rep-t3', 'seed-plan-rep-v2', 'seed-ms-rep-m1', :tenant, 'T-3', 'Data validation suite', 'Tests for null checks + row counts.', ARRAY['python','l2'], 16, 'CI fails on any validation regression.', 'medium', 3, 'draft', 72, false, NOW() - INTERVAL '4 days', NOW()),
  ('seed-task-rep-t4', 'seed-plan-rep-v2', 'seed-ms-rep-m2', :tenant, 'T-4', 'Builder shell + chart picker', 'Builder UI scaffolding.', ARRAY['react','typescript','l3'], 24, 'Picker covers 6 chart types.', 'high', 4, 'draft', 76, false, NOW() - INTERVAL '4 days', NOW()),
  ('seed-task-rep-t5', 'seed-plan-rep-v2', 'seed-ms-rep-m2', :tenant, 'T-5', 'Saved reports list', 'Server-paginated list.', ARRAY['react','typescript','l2'], 12, 'Search + pagination.', 'medium', 5, 'draft', 68, false, NOW() - INTERVAL '4 days', NOW()),
  ('seed-task-rep-t6', 'seed-plan-rep-v2', 'seed-ms-rep-m3', :tenant, 'T-6', 'CSV export pipeline', 'Background export job.', ARRAY['python','aws','l3'], 18, 'Exports under 60s for 1M rows.', 'high', 6, 'draft', 64, false, NOW() - INTERVAL '4 days', NOW()),
  ('seed-task-rep-t7', 'seed-plan-rep-v2', 'seed-ms-rep-m3', :tenant, 'T-7', 'Schedule UI', 'Cron-style report scheduling.', ARRAY['react','typescript','l2'], 14, 'Schedules persist + notify on failure.', 'medium', 7, 'draft', 60, false, NOW() - INTERVAL '4 days', NOW()),
  ('seed-task-helios-t1', 'seed-plan-helios-v1', 'seed-ms-helios-m1', :tenant, 'T-1', 'Tenancy bootstrap', 'Wire RLS policies + tenant context middleware.', ARRAY['postgres','sql','l3'], 10, 'RLS enforces per-tenant isolation; tested with cross-tenant probe.', 'high', 1, 'draft', 81, false, NOW() - INTERVAL '12 hours', NOW()),
  ('seed-task-helios-t2', 'seed-plan-helios-v1', 'seed-ms-helios-m2', :tenant, 'T-2', 'SSO integration', 'SAML 2.0 + group→role mapping.', ARRAY['oidc','saml','l3'], 16, 'Login via Glimmora Azure AD works; group mapping verified.', 'high', 2, 'draft', 74, false, NOW() - INTERVAL '12 hours', NOW());

INSERT INTO "TaskDependency" (id, "tenantId", "fromTaskId", "toTaskId", type, "createdAt")
VALUES
  ('seed-dep-1', :tenant, 'seed-task-rep-t1', 'seed-task-rep-t2', 'finish_to_start', NOW() - INTERVAL '4 days'),
  ('seed-dep-2', :tenant, 'seed-task-rep-t2', 'seed-task-rep-t3', 'finish_to_start', NOW() - INTERVAL '4 days'),
  ('seed-dep-3', :tenant, 'seed-task-rep-t3', 'seed-task-rep-t4', 'finish_to_start', NOW() - INTERVAL '4 days'),
  ('seed-dep-4', :tenant, 'seed-task-rep-t4', 'seed-task-rep-t6', 'finish_to_start', NOW() - INTERVAL '4 days');

-- ------------------------------------------------------------------
-- Submissions — required by PayoutRecord FK
-- ------------------------------------------------------------------
DELETE FROM "PayoutRecord" WHERE "tenantId" = :tenant AND id LIKE 'seed-pay-%';
DELETE FROM "Submission" WHERE "tenantId" = :tenant AND id LIKE 'seed-sub-%';

INSERT INTO "Submission" (id, "taskDefinitionId", "contributorId", "tenantId", version, status, "submittedAt", "createdAt", "updatedAt")
VALUES
  ('seed-sub-1', 'seed-task-rep-t1', :sponsor, :tenant, 1, 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '4 days'),
  ('seed-sub-2', 'seed-task-rep-t2', :sponsor, :tenant, 1, 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '3 days'),
  ('seed-sub-3', 'seed-task-rep-t3', :sponsor, :tenant, 1, 'accepted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
  ('seed-sub-4', 'seed-task-rep-t4', :sponsor, :tenant, 1, 'accepted', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours'),
  ('seed-sub-5', 'seed-task-rep-t5', :sponsor, :tenant, 1, 'accepted', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours'),
  ('seed-sub-6', 'seed-task-helios-t1', :sponsor, :tenant, 1, 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

-- ------------------------------------------------------------------
-- Payouts — six rows spanning eligible / processing / sent / on_hold
-- ------------------------------------------------------------------

INSERT INTO "PayoutRecord" (id, "contributorId", "taskDefinitionId", "submissionId", "tenantId", "amountMinor", currency, computation, status, "externalRef", "failureReason", "eligibleAt", "requestedAt", "processingAt", "sentAt", "createdAt", "updatedAt")
VALUES
  ('seed-pay-1', :sponsor, 'seed-task-rep-t1', 'seed-sub-1', :tenant, 1200000, 'INR', '{"currency":"INR","ratePerHour":1500,"hoursBilled":8,"amountMinor":1200000,"minorMultiplier":100}'::jsonb, 'sent', 'TRX-9421', NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 days'),
  ('seed-pay-2', :sponsor, 'seed-task-rep-t2', 'seed-sub-2', :tenant, 2400000, 'INR', '{"currency":"INR","ratePerHour":2000,"hoursBilled":12,"amountMinor":2400000,"minorMultiplier":100}'::jsonb, 'sent', 'TRX-9420', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'),
  ('seed-pay-3', :sponsor, 'seed-task-rep-t3', 'seed-sub-3', :tenant, 2400000, 'INR', '{"currency":"INR","ratePerHour":1500,"hoursBilled":16,"amountMinor":2400000,"minorMultiplier":100}'::jsonb, 'processing', NULL, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours'),
  ('seed-pay-4', :sponsor, 'seed-task-rep-t4', 'seed-sub-4', :tenant, 4320000, 'INR', '{"currency":"INR","ratePerHour":1800,"hoursBilled":24,"amountMinor":4320000,"minorMultiplier":100}'::jsonb, 'eligible', NULL, NULL, NOW() - INTERVAL '6 hours', NULL, NULL, NULL, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
  ('seed-pay-5', :sponsor, 'seed-task-rep-t5', 'seed-sub-5', :tenant, 1440000, 'INR', '{"currency":"INR","ratePerHour":1200,"hoursBilled":12,"amountMinor":1440000,"minorMultiplier":100}'::jsonb, 'eligible', NULL, NULL, NOW() - INTERVAL '2 hours', NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('seed-pay-6', :sponsor, 'seed-task-helios-t1', 'seed-sub-6', :tenant, 1500000, 'INR', '{"currency":"INR","ratePerHour":1500,"hoursBilled":10,"amountMinor":1500000,"minorMultiplier":100}'::jsonb, 'on_hold', NULL, 'KYC re-verification pending', NOW() - INTERVAL '3 days', NULL, NULL, NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day');

-- ------------------------------------------------------------------
-- ContributorProfiles — make the consent inventory render some rows
-- ------------------------------------------------------------------
DELETE FROM "ContributorProfile" WHERE id LIKE 'seed-cp-%';

-- Reuse existing dev contributors as the consent-inventory contributors.
INSERT INTO "ContributorProfile" (id, "userId", "contribType", country, dob, timezone, "departmentCategory", "primarySkills", availability, "ndaAccepted", "acceptTos", "acceptCoc", "acceptPrivacy", "acceptFee", "acceptAhp", "marketingOptIn", "createdAt", "updatedAt")
SELECT
  'seed-cp-' || u.id,
  u.id,
  'individual',
  'IN',
  '1995-01-01'::timestamp,
  'Asia/Kolkata',
  'engineering',
  ARRAY['react','typescript'],
  'full_time',
  true, true, true, true, true, true, false,
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '30 days'
FROM "User" u
WHERE u.email IN (
  'm19-sponsor-a@example.com',
  'm9a-sponsor@example.com',
  'm9b-sponsor@example.com',
  'm8-sponsor-a@example.com',
  'm8-sponsor-b@example.com'
)
ON CONFLICT ("userId") DO NOTHING;

-- One profile missing required consents (for the "missing" filter)
UPDATE "ContributorProfile"
SET "ndaAccepted" = false, "acceptCoc" = false
WHERE id = 'seed-cp-m9b-sponsor';

-- ------------------------------------------------------------------
-- SOW templates — three rows visible at /enterprise/sow/templates
-- ------------------------------------------------------------------
DELETE FROM "SowTemplate" WHERE id LIKE 'seed-tpl-%';

INSERT INTO "SowTemplate" (id, "tenantId", name, description, spec, defaults, "isDefault", "createdBy", "createdAt", "updatedAt")
VALUES
  ('seed-tpl-design', :tenant, 'Design System Q-cycle', 'Standard quarterly design system update.', '{"sections":["scope","deliverables","timeline"],"approverChain":["business","commercial","legal","security","final"]}'::jsonb, '{"slaHours":48}'::jsonb, false, :sponsor, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
  ('seed-tpl-marketing', :tenant, 'Marketing campaign', 'Short-cycle marketing engagement.', '{"sections":["scope","deliverables"],"approverChain":["business","commercial","final"]}'::jsonb, '{"slaHours":24}'::jsonb, false, :sponsor, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
  ('seed-tpl-eng', :tenant, 'Engineering project', 'Default 5-stage template.', '{"sections":["scope","deliverables","timeline","risk"],"approverChain":["business","commercial","legal","security","final"]}'::jsonb, '{"slaHours":48}'::jsonb, true, :sponsor, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days');

COMMIT;

-- Sanity counts
SELECT
  (SELECT COUNT(*) FROM "Sow" WHERE "tenantId" = :tenant) AS sows,
  (SELECT COUNT(*) FROM "DecompositionPlan" WHERE "tenantId" = :tenant) AS plans,
  (SELECT COUNT(*) FROM "Milestone" WHERE "tenantId" = :tenant) AS milestones,
  (SELECT COUNT(*) FROM "TaskDefinition" WHERE "tenantId" = :tenant) AS tasks,
  (SELECT COUNT(*) FROM "PayoutRecord" WHERE "tenantId" = :tenant) AS payouts,
  (SELECT COUNT(*) FROM "SowTemplate" WHERE "tenantId" = :tenant) AS templates,
  (SELECT COUNT(*) FROM "ContributorProfile" WHERE id LIKE 'seed-cp-%') AS consent_profiles;
