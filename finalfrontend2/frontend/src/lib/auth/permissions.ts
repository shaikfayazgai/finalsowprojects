/**
 * Permission checks — small helper that resolves a user's effective
 * permissions through UserRole → Role → RolePermission and decides
 * whether a given code (or set of codes) is held.
 *
 * Phase 1 uses a per-call query; no caching layer yet. Volume is low
 * (<10 perm checks per request typically) and the join is indexed.
 * If Phase 2 latency budgets demand it, swap in a per-request memo or
 * Redis cache keyed on (userId, role-fingerprint).
 *
 * For RLS-scoped permission lookups, the caller should pass the same
 * `tx` they're working inside so the read participates in the
 * `app.tenant_id` scope. For platform-wide checks (no tenant), use
 * the default prisma client.
 */

import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Returns the set of permission codes held by the user via any of
 * their role assignments.
 */
export async function listUserPermissions(
  userId: string,
  db: Db = prisma,
): Promise<Set<string>> {
  const rows = await db.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          rolePermissions: {
            select: { permissionCode: true },
          },
        },
      },
    },
  });
  const codes = new Set<string>();
  for (const row of rows) {
    for (const rp of row.role.rolePermissions) {
      codes.add(rp.permissionCode);
    }
  }
  return codes;
}

/**
 * Returns true iff the user holds the given permission code through
 * any role.
 */
export async function userHasPermission(
  userId: string,
  code: string,
  db: Db = prisma,
): Promise<boolean> {
  const found = await db.userRole.findFirst({
    where: {
      userId,
      role: {
        rolePermissions: { some: { permissionCode: code } },
      },
    },
    select: { id: true },
  });
  return found !== null;
}

/**
 * Returns true iff the user holds ANY of the given permission codes.
 * Useful for endpoints that accept multiple distinct roles
 * (e.g., "create.sow OR update.sow" for the wizard's save path).
 */
export async function userHasAnyPermission(
  userId: string,
  codes: readonly string[],
  db: Db = prisma,
): Promise<boolean> {
  if (codes.length === 0) return false;
  const found = await db.userRole.findFirst({
    where: {
      userId,
      role: {
        rolePermissions: { some: { permissionCode: { in: [...codes] } } },
      },
    },
    select: { id: true },
  });
  return found !== null;
}
