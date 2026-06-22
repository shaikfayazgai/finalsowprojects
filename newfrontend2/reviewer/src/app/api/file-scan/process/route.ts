/**
 * POST /api/file-scan/process
 *
 * Admin-only operator action to manually kick off the file-scan
 * worker batch. Processes up to `limit` pending SubmissionArtifact
 * rows (scanCleared=false, scanAttemptedAt=null) and returns the
 * verdicts.
 *
 * In production this would be invoked by a cron / queue worker.
 * The HTTP surface exists so operators can drain a backlog manually
 * and so the smoke test has a request-shaped entry point.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import {
  processPendingArtifacts,
  FileScanServiceError,
} from "@/lib/file-scan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postBody = z.object({
  limit: z.number().int().positive().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireRequest({
    allowedRoles: ["admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  let body: unknown = {};
  try {
    // Tolerate empty body — JSON.parse on empty string throws.
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = postBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const limit = parsed.data.limit ?? 25;

  try {
    const { processed, results } = await ctx.withTx((tx) =>
      processPendingArtifacts(tx, limit),
    );
    return NextResponse.json({ processed, results }, { status: 200 });
  } catch (err) {
    return mapServiceError(err, "[file-scan.process.POST]");
  }
}

function mapServiceError(err: unknown, logTag: string): NextResponse {
  if (err instanceof FileScanServiceError) {
    const status =
      err.code === "not_found"
        ? 404
        : err.code === "validation" || err.code === "invalid_state"
          ? 400
          : 500;
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status },
    );
  }
  // eslint-disable-next-line no-console
  console.error(logTag, err);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
