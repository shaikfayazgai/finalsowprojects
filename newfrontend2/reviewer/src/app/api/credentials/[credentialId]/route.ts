/**
 * GET /api/credentials/:credentialId
 *
 * Contributor's own credential detail. Returns 404 if the credential
 * isn't theirs to view (avoid existence-leak across users).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { getCredentialDetail } from "@/lib/credentials";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> },
) {
  const { credentialId } = await params;
  if (!credentialId) return NextResponse.json({ error: "Missing credentialId" }, { status: 400 });

  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.credential"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.credential" },
      { status: 403 },
    );
  }

  try {
    const detail = await prisma.$transaction((tx) => getCredentialDetail(tx, credentialId));
    if (!detail) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }
    // Contributors can only see their own through this endpoint
    if (detail.contributorId !== ctx.userId) {
      // Avoid existence-leak: return 404 instead of 403
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }
    return NextResponse.json({ credential: detail }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[credentials.GET id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
