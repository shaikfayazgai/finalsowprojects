-- Workforce sourcing & review routing (Decision #21–#24)

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "workforcePolicy" JSONB;

ALTER TABLE "DecompositionPlan" ADD COLUMN IF NOT EXISTS "defaultWorkforceSourcing" TEXT;
ALTER TABLE "DecompositionPlan" ADD COLUMN IF NOT EXISTS "defaultReviewPath" TEXT;
ALTER TABLE "DecompositionPlan" ADD COLUMN IF NOT EXISTS "twoStageReviewEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "TaskDefinition" ADD COLUMN IF NOT EXISTS "workforceSourcing" TEXT;
ALTER TABLE "TaskDefinition" ADD COLUMN IF NOT EXISTS "reviewPath" TEXT;
ALTER TABLE "TaskDefinition" ADD COLUMN IF NOT EXISTS "internalReviewerId" TEXT;

ALTER TABLE "TaskDefinition"
  ADD CONSTRAINT "TaskDefinition_internalReviewerId_fkey"
  FOREIGN KEY ("internalReviewerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "TaskDefinition_reviewPath_idx" ON "TaskDefinition"("reviewPath");
