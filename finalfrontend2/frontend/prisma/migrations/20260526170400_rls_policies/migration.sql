-- Migration M5 · rls_policies
-- Phase 1 foundations · doc 05 §3.5 + locked decision #1
--
-- Defense-in-depth tenant isolation at the Postgres engine. Every
-- tenant-scoped query MUST run inside a transaction that's bound to a
-- tenant via:
--
--     SELECT set_config('app.tenant_id', '<tenant uuid>', true);
--
-- Use the helper `setTransactionTenant(tx, tenantId)` in
-- `src/lib/tenant/transaction.ts` from app code.
--
-- ─────────────────────────────────────────────────────────────────────
-- What's RLS-enabled and what isn't
-- ─────────────────────────────────────────────────────────────────────
--
-- RLS ENABLED — tenant queries are the canonical access pattern:
--   • AcceptanceDecision · PaymentOrder · PaymentEvent
--     Tenant-required business records. Any unscoped query is a bug.
--   • UserRole
--     The OR-null clause lets cross-tenant role grants (mentor, plat.*,
--     contributor) coexist with tenant-bound ent.* grants in a single
--     read.
--
-- RLS DISABLED (intentional) — app-layer tenant filtering only:
--   • User                — identity lookups (by email, by id) happen
--                           before tenant context exists. Auth would
--                           break if User were RLS-bound.
--   • Session             — validateSession() reads by session id; the
--                           tenant for that session is the OUTPUT, not
--                           an input. RLS would create a chicken-and-egg.
--   • AuditEvent          — compliance officers + platform admins need
--                           legitimate cross-tenant reads. Tenant-scoped
--                           audit UIs filter via WHERE tenantId = ?.
--                           App-layer RBAC is the gate.
--   • Tenant              — the root entity itself. Listing/finding
--                           tenants must work without a tenant context.
--   • Role · Permission · RolePermission · TrustedDevice · ContributorProfile
--                         — global taxonomy or user-scoped tables that
--                           don't carry tenantId.
--
-- ─────────────────────────────────────────────────────────────────────
-- Policy semantics (apply uniformly to the RLS-enabled tables)
-- ─────────────────────────────────────────────────────────────────────
--
-- Read policy:
--   tenantId IS NULL                                                  -- cross-tenant rows are visible to everyone
--   OR tenantId::text = current_setting('app.tenant_id', true)         -- tenant-bound rows are visible only when var matches
--
-- Write policy (WITH CHECK):
--   tenantId IS NULL                                                  -- system writes (no tenant set) can create null-tenant rows
--   OR tenantId::text = current_setting('app.tenant_id', true)         -- tenant-bound writes must match
--
-- When app.tenant_id is unset, current_setting('app.tenant_id', true)
-- returns NULL. `tenantId::text = NULL` evaluates to NULL → treated as
-- FALSE by the policy. Net effect: unset var sees ONLY null-tenant
-- rows (correct for system flows), can WRITE only null-tenant rows.
--
-- Postgres superusers (DB owners) bypass RLS by default — fine for
-- local dev + migrations. Production should connect with a non-
-- superuser role. App code uses a non-superuser via DATABASE_URL.

-- ═════════════════════════════════════════════════════════════════════
-- AcceptanceDecision
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE "AcceptanceDecision" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "AcceptanceDecision";
CREATE POLICY "tenant_isolation_select" ON "AcceptanceDecision"
  FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "AcceptanceDecision";
CREATE POLICY "tenant_isolation_modify" ON "AcceptanceDecision"
  FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

-- ═════════════════════════════════════════════════════════════════════
-- PaymentOrder
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE "PaymentOrder" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "PaymentOrder";
CREATE POLICY "tenant_isolation_select" ON "PaymentOrder"
  FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "PaymentOrder";
CREATE POLICY "tenant_isolation_modify" ON "PaymentOrder"
  FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

-- ═════════════════════════════════════════════════════════════════════
-- PaymentEvent
-- ═════════════════════════════════════════════════════════════════════

ALTER TABLE "PaymentEvent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "PaymentEvent";
CREATE POLICY "tenant_isolation_select" ON "PaymentEvent"
  FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "PaymentEvent";
CREATE POLICY "tenant_isolation_modify" ON "PaymentEvent"
  FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

-- ═════════════════════════════════════════════════════════════════════
-- UserRole
-- ═════════════════════════════════════════════════════════════════════
-- Cross-tenant roles (mentor.*, plat.*, contributor) have tenantId=NULL
-- and are visible to everyone. Tenant-bound ent.* grants are filtered
-- by current_setting. A user's full role bundle in tenant X reads as
-- (cross-tenant ∪ X-bound) which is exactly what middleware needs.

ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON "UserRole";
CREATE POLICY "tenant_isolation_select" ON "UserRole"
  FOR SELECT
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS "tenant_isolation_modify" ON "UserRole";
CREATE POLICY "tenant_isolation_modify" ON "UserRole"
  FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    "tenantId" IS NULL
    OR "tenantId"::text = current_setting('app.tenant_id', true)
  );
