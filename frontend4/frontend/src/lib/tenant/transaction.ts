/**
 * Bind a tenant id to the current Postgres transaction so RLS policies
 * (added in migration M19) can enforce isolation at the DB engine.
 *
 * Every request handler doing a tenant-scoped query MUST be inside a
 * `prisma.$transaction(async (tx) => ...)` block AND call this helper
 * before any queries. Forgetting to set the var means RLS sees the
 * default (empty) and rejects the query — fail loud, not silent.
 *
 * Spec: docs/portal-specs/05-cross-functional.md §3.5
 */

import type { Prisma } from "@/generated/prisma/client";

/**
 * Set `app.tenant_id` for the current transaction. Uses Postgres
 * `set_config(name, value, is_local)` with `is_local = true` (analogous
 * to SET LOCAL — variable reverts at transaction commit/rollback).
 *
 * Parameterized to prevent any SQL injection risk; tenantId itself
 * comes from authoritative session data, not user input.
 */
export async function setTransactionTenant(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
}

/**
 * Clear the tenant binding for the current transaction. Rarely needed
 * — most use is wrapped in $transaction so the LOCAL setting reverts
 * automatically at commit. Useful when explicit cross-tenant queries
 * (audit export, system jobs) need to break out of tenant scope.
 *
 * Callers MUST have a role that bypasses RLS for this to be useful;
 * normal app roles still get tenant-filtered.
 */
export async function clearTransactionTenant(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', '', true)`;
}
