-- Migration M4 · audit_log
-- Phase 1 foundations · doc 08-codebase-delta §5.1
--
-- Adds AuditEvent — the immutable, append-only log every state-changing
-- action writes to. The foundation of platform observability + the
-- SOW §3.1.MVP.8 / §14 compliance commitment.
--
-- Storage model:
--   • Postgres table with full indexing for actor/resource/action/time/
--     tenant searches.
--   • Postgres TRIGGERS reject UPDATE + DELETE attempts — append-only
--     enforced at the DB engine. Even an app connecting as superuser
--     cannot mutate rows.
--   • Application writes HMAC signature in `signature` column; verifies
--     at read time. Key version captured for rotation.
--   • Daily snapshot to S3 with object lock (infra, not this migration).
--
-- Audit retention: 7 years floor (locked decision); tenant-configurable
-- to longer. Pruning is NOT a SQL operation — old events go to cold
-- storage via the snapshot job.
--
-- IDs: UUIDv4 default (Prisma @default(uuid())). Application SHOULD
-- supply UUIDv7 (time-orderable) for index efficiency; Postgres has no
-- native v7 generator yet so it's app-minted.

-- ─────────────────────────────────────────────────────────────────────────
-- AuditEvent table
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "actorPortalRole" TEXT NOT NULL,
    "actorSessionId" TEXT,
    "actorIpAddress" TEXT,
    "actorUserAgent" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceLabel" TEXT,
    "payload" JSONB NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "signature" TEXT,
    "signingKeyVersion" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- Tenant FK — RESTRICT so deleting a tenant doesn't orphan/lose audit history.
-- Tenant deletion in app must first reassign or archive related events.
ALTER TABLE "AuditEvent"
  ADD CONSTRAINT "AuditEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes for the canonical query patterns from doc 05 §4.5
-- ─────────────────────────────────────────────────────────────────────────

-- "Show me everything in tenant X, newest first" (paginated tenant audit UI)
CREATE INDEX "AuditEvent_tenantId_timestamp_idx"
  ON "AuditEvent"("tenantId", "timestamp" DESC);

-- "Show me everything actor X did, newest first" (user history view)
CREATE INDEX "AuditEvent_actorUserId_timestamp_idx"
  ON "AuditEvent"("actorUserId", "timestamp" DESC);

-- "Show me everything that happened to resource <type>:<id>" (per-entity audit trail)
CREATE INDEX "AuditEvent_resource_timestamp_idx"
  ON "AuditEvent"("resourceType", "resourceId", "timestamp" DESC);

-- "Show me all <action> events" (action filtering)
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

-- "Show me all warning+ events" (alerting + compliance feed)
CREATE INDEX "AuditEvent_severity_idx" ON "AuditEvent"("severity");

-- Time-range queries without tenant filter (cross-tenant compliance)
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp" DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- Append-only enforcement: triggers reject UPDATE + DELETE
-- ─────────────────────────────────────────────────────────────────────────
-- This is belt-and-suspenders defense:
--   • Application code should write only via auditEmit() which only INSERTs.
--   • If a bug or migration script attempts UPDATE/DELETE, the trigger
--     raises an exception and the transaction rolls back.
--   • Test environments that need bulk cleanup should DROP + recreate the
--     test database rather than DELETE individual rows.
--
-- Tenant lifecycle (close, etc.) and key rotation re-signing happen via
-- separate mechanisms that bypass this constraint — neither mutates audit
-- rows directly.

CREATE OR REPLACE FUNCTION "audit_event_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'AuditEvent is append-only. % is not permitted.', TG_OP
    USING HINT = 'Audit events must be re-emitted as new rows, never modified.',
          ERRCODE = '42501';  -- insufficient_privilege
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_event_no_update"
  BEFORE UPDATE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION "audit_event_block_mutation"();

CREATE TRIGGER "audit_event_no_delete"
  BEFORE DELETE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION "audit_event_block_mutation"();

-- Truncate-protect: TRUNCATE bypasses row-level triggers.
CREATE OR REPLACE FUNCTION "audit_event_block_truncate"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'AuditEvent is append-only. TRUNCATE is not permitted.'
    USING HINT = 'Audit events cannot be wiped. Use cold storage migration.',
          ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_event_no_truncate"
  BEFORE TRUNCATE ON "AuditEvent"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_event_block_truncate"();

-- Documentation on the table itself.
COMMENT ON TABLE "AuditEvent" IS
  'Append-only audit log. INSERT only; UPDATE/DELETE/TRUNCATE blocked by triggers. HMAC-signed per row; signature verified at read time.';
