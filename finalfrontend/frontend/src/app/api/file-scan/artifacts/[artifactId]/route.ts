/**
 * GET /api/file-scan/artifacts/:artifactId
 *
 * Surfaces a single artifact's scan status — used by the mentor
 * review UI to gate display of contributor uploads before showing
 * the URL. Cheap to call (single-row read).
 *
 * Permission: `read.submission` (mentors + ent.admin + ent.pmo +
 * contributors all hold it). Cross-tenant operators (mentors) need
 * to read artifacts in any tenant, so `requireRequest` is used.
 *
 * Returns 404 if the artifact doesn't exist (RLS hides it the same
 * way for tenant-scoped users — we don't differentiate to avoid
 * leaking existence).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  if (!artifactId) {
    return NextResponse.json({ error: "Missing artifactId" }, { status: 400 });
  }

  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.submission"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.submission" },
      { status: 403 },
    );
  }

  // SubmissionArtifact is RLS-scoped via tenantId. For tenant-bound
  // users this read is automatically scoped; cross-tenant operators
  // (mentors with no tenantId) bypass the binding and read globally.
  const row = await prisma.submissionArtifact.findFirst({
    where: { id: artifactId },
    select: {
      id: true,
      scanCleared: true,
      scanAttemptedAt: true,
      scanError: true,
    },
  });
  if (!row) {
    return NextResponse.json({ error: "artifact_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      scanCleared: row.scanCleared,
      scanAttemptedAt: row.scanAttemptedAt
        ? row.scanAttemptedAt.toISOString()
        : null,
      scanError: row.scanError,
    },
    { status: 200 },
  );
}
