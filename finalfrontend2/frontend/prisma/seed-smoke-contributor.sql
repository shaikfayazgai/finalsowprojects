-- Seed real work for the smoke-test contributor so the dashboard / tasks
-- pages render with data instead of empty states.
--
-- Idempotent: cleans its own rows first (prefix "seed-sm-").

\set contrib_id 'cmpmmtmvh0000dopgkotap15r'
\set tenant_id 'm19-tenant-a'
\set plan_id 'seed-plan-rep-v2'

BEGIN;

-- 0. Clean any prior smoke rows.
DELETE FROM "PayoutRecord" WHERE id LIKE 'seed-sm-%';
DELETE FROM "Submission"   WHERE id LIKE 'seed-sm-%';
DELETE FROM "TaskDefinition" WHERE id LIKE 'seed-sm-%';

-- 1. Tasks — 5 lifecycle buckets the dashboard counts.
INSERT INTO "TaskDefinition"
  (id, "planId", "tenantId", "externalKey", title, description,
   "requiredSkills", "estimatedHours", "acceptanceCriteria", complexity,
   "order", status, "assignedContributorId", "assignedAt", "acceptedAt",
   "agreedCurrency", "agreedRatePerHour", "createdAt", "updatedAt")
VALUES
  -- assigned (just dropped)
  ('seed-sm-task-1', :'plan_id', :'tenant_id', 'TSK-001',
   'Build date-range picker',
   'Design + implement an accessible date-range picker component.',
   ARRAY['React','TypeScript','Figma']::text[], 8, 'WCAG 2.1 AA, keyboard nav, two months visible.',
   'medium', 1, 'matched', :'contrib_id', NOW() - INTERVAL '6 hours', NULL,
   'INR', 1500, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  -- in_progress
  ('seed-sm-task-2', :'plan_id', :'tenant_id', 'TSK-002',
   'Reporting CSV export endpoint',
   'Streaming CSV export, signed-URL delivery.',
   ARRAY['Python','FastAPI']::text[], 12, 'Streams without buffering whole result in memory.',
   'medium', 2, 'in_progress', :'contrib_id', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 22 hours',
   'INR', 1800, NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 hours'),

  -- feedback_requested → revision
  ('seed-sm-task-3', :'plan_id', :'tenant_id', 'TSK-003',
   'Auth modal UX polish',
   'Tighten validation states + animation timing.',
   ARRAY['React','Framer Motion']::text[], 4, 'No layout shift on error; reduce focus jumps.',
   'small', 3, 'in_progress', :'contrib_id', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days',
   'INR', 1500, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 hours'),

  -- submitted (under review)
  ('seed-sm-task-4', :'plan_id', :'tenant_id', 'TSK-004',
   'ETL spec — events table v2',
   'Spec + migration notes for the new partitioning scheme.',
   ARRAY['Postgres','SQL']::text[], 6, 'Includes rollback plan + index strategy.',
   'medium', 4, 'submitted', :'contrib_id', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days',
   'INR', 2000, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),

  -- accepted
  ('seed-sm-task-5', :'plan_id', :'tenant_id', 'TSK-005',
   'Tenancy bootstrap script',
   'CLI to scaffold a new tenant with default rate cards and consent records.',
   ARRAY['TypeScript','Prisma']::text[], 10, 'Single command; idempotent; logs every step.',
   'large', 5, 'accepted', :'contrib_id', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days',
   'INR', 2200, NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days'),

  -- accepted (second one, for streak/credentials)
  ('seed-sm-task-6', :'plan_id', :'tenant_id', 'TSK-006',
   'Decomposition unit tests',
   'Add unit coverage for the dependency-resolver edge cases.',
   ARRAY['Jest','TypeScript']::text[], 5, 'All resolver branches covered; CI green.',
   'small', 6, 'accepted', :'contrib_id', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days',
   'INR', 1600, NOW() - INTERVAL '18 days', NOW() - INTERVAL '6 days');

-- 2. Submissions — match each task that the contributor has actually
--    submitted (tasks 3,4,5,6).
INSERT INTO "Submission"
  (id, "taskDefinitionId", "contributorId", "tenantId", version, status,
   "decisionRationale",
   "submittedAt", "decidedAt", "createdAt", "updatedAt")
VALUES
  -- task-3 has revision feedback (latest submission was rejected → resubmit)
  ('seed-sm-sub-3', 'seed-sm-task-3', :'contrib_id', :'tenant_id', 1, 'feedback_requested',
   E'**Required corrections (2)**\n- Validation shake animation still flashes on first render — needs initial mount guard\n- Submit button focus ring is clipped by the modal overflow\n\n**Optional suggestions (1)**\n- Consider adding a subtle haptic on mobile success',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

  -- task-4 under review
  ('seed-sm-sub-4', 'seed-sm-task-4', :'contrib_id', :'tenant_id', 1, 'under_review',
   NULL,
   NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  -- task-5 accepted
  ('seed-sm-sub-5', 'seed-sm-task-5', :'contrib_id', :'tenant_id', 1, 'accepted',
   NULL,
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),

  -- task-6 accepted (older)
  ('seed-sm-sub-6', 'seed-sm-task-6', :'contrib_id', :'tenant_id', 1, 'accepted',
   NULL,
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days');

-- 3. Payouts — accepted tasks become payouts.
INSERT INTO "PayoutRecord"
  (id, "contributorId", "taskDefinitionId", "submissionId", "tenantId",
   "amountMinor", currency, computation, status, "externalRef", "failureReason",
   "eligibleAt", "requestedAt", "processingAt", "sentAt",
   "createdAt", "updatedAt")
VALUES
  -- task-5: ₹22,000 (10h × 2200) — sent yesterday → appears in This week + This month
  ('seed-sm-payout-5', :'contrib_id', 'seed-sm-task-5', 'seed-sm-sub-5', :'tenant_id',
   2200000, 'INR', '{}'::jsonb, 'sent', 'PAY-2025-0042', NULL,
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

  -- task-6: ₹8,000 (5h × 1600) — sent 5 days ago → This month only
  ('seed-sm-payout-6', :'contrib_id', 'seed-sm-task-6', 'seed-sm-sub-6', :'tenant_id',
   800000, 'INR', '{}'::jsonb, 'sent', 'PAY-2025-0038', NULL,
   NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days',
   NOW() - INTERVAL '5 days 12 hours', NOW() - INTERVAL '5 days',
   NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days');

COMMIT;

-- Sanity counts.
SELECT
  (SELECT COUNT(*) FROM "TaskDefinition" WHERE "assignedContributorId" = :'contrib_id') AS tasks_assigned,
  (SELECT COUNT(*) FROM "Submission" WHERE "contributorId" = :'contrib_id') AS submissions,
  (SELECT COUNT(*) FROM "PayoutRecord" WHERE "contributorId" = :'contrib_id') AS payouts;
