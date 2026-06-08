-- Student track: persist faculty supervisor + approval from partnership admin.
ALTER TABLE "ContributorProfile"
  ADD COLUMN IF NOT EXISTS "supervisorEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "supervisorName" TEXT,
  ADD COLUMN IF NOT EXISTS "supervisorApprovedAt" TIMESTAMP(3);
