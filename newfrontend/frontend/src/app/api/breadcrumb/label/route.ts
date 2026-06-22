/**
 * GET /api/breadcrumb/label?type=<entity>&id=<id>
 *
 * Tiny resolver used by the top-bar to turn a UUID path segment into
 * a human-readable label. Mirrors the dedicated detail endpoints but
 * returns just `{ label }` so the topbar can avoid pulling full payloads
 * for every crumb in the trail.
 *
 * Supported types (Phase 1):
 *   - plan        → DecompositionPlan ("Plan v{version} · {sowTitle}")
 *
 * Auth: requireRequest (any signed-in user). Tenant filtering is enforced
 * by the regular RLS context inside ctx.withTx — if a user asks for a
 * label on a row outside their tenant, the lookup returns null and the
 * endpoint replies 404. We never leak labels across tenants.
 *
 * Cache: client (TanStack Query) holds the label for the session's
 * staleTime. Labels rarely change, so this is intentionally trivial.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_TYPES = ["plan"] as const;
type SupportedType = (typeof SUPPORTED_TYPES)[number];

function isSupportedType(s: string): s is SupportedType {
  return (SUPPORTED_TYPES as readonly string[]).includes(s);
}

export async function GET(req: NextRequest) {
  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "";
  const id = url.searchParams.get("id") ?? "";
  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id query params are required" },
      { status: 400 },
    );
  }
  if (!isSupportedType(type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${type}`, supported: SUPPORTED_TYPES },
      { status: 400 },
    );
  }

  const label = await ctx.withTx(async (tx) => {
    if (type === "plan") {
      const row = await tx.decompositionPlan.findUnique({
        where: { id },
        select: { version: true, sow: { select: { title: true } } },
      });
      if (!row) return null;
      const sowTitle = row.sow?.title?.trim();
      return sowTitle ? `${sowTitle} · v${row.version}` : `Plan v${row.version}`;
    }
    return null;
  });

  if (!label) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ type, id, label }, { status: 200 });
}
