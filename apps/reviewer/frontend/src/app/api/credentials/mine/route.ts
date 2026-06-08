/**
 * GET /api/credentials/mine
 *
 * Lists the contributor's own credentials across all tenants. Cross-
 * tenant by design (a contributor earns credentials with multiple
 * enterprise customers).
 *
 * Permission: read.credential (every authenticated user with the
 * permission gets their own scope).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { listCredentialsForContributor } from "@/lib/credentials";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.credential"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.credential" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "100"), 1), 200);

  try {
    const items = await prisma.$transaction((tx) =>
      listCredentialsForContributor(tx, {
        contributorUserId: ctx.userId,
        status: statusParam === "issued" || statusParam === "revoked" ? statusParam : undefined,
        limit,
      }),
    );
    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[credentials.mine.GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
