-- Tenant subscription Phase 1 — trial window, period start, usage counters.

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usageCounters" JSONB;

UPDATE "Tenant"
SET "subscriptionStartedAt" = COALESCE("subscriptionStartedAt", "provisionedAt", "createdAt")
WHERE "subscriptionStartedAt" IS NULL;
