/**
 * GET /api/contributor/track
 *
 * Returns contributor track (persona) + onboarding completion from the local
 * ContributorProfile. Cross-tenant; contributors only.
 */

import { NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { getContributorTrackStatus } from "@/lib/contributor/profile-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireRequest({ allowedRoles: ["contributor"] });
  if (ctx instanceof NextResponse) return ctx;

  const status = await getContributorTrackStatus(ctx.userId);
  if (!status) {
    return NextResponse.json({ detail: "User not found." }, { status: 404 });
  }

  return NextResponse.json(status);
}
