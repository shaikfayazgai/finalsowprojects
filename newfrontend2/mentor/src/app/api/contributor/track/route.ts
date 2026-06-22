/**
 * GET /api/contributor/track
 *
 * Returns contributor track (persona) + onboarding completion from the local
 * ContributorProfile. Cross-tenant; contributors only.
 */

import { NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import {
  getContributorTrackStatus,
  DEMO_CONTRIBUTOR_TRACK,
} from "@/lib/contributor/profile-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Demo / no-backend builds: the seeded identity is an admin, so this
// contributor-only route would 403 and the persona hook would retry forever,
// blanking the contributor portal. Serve a seeded track instead.
const DEMO =
  process.env.DEV_AUTH_BYPASS === "1" ||
  process.env.NEXT_PUBLIC_CONTRIBUTOR_DEMO === "1" ||
  process.env.NEXT_PUBLIC_ENTERPRISE_DEMO === "1" ||
  process.env.NEXT_PUBLIC_ADMIN_DEMO === "1";

export async function GET() {
  const ctx = await requireRequest({ allowedRoles: ["contributor"] });
  if (ctx instanceof NextResponse) {
    if (DEMO) return NextResponse.json(DEMO_CONTRIBUTOR_TRACK);
    return ctx;
  }

  const status = await getContributorTrackStatus(ctx.userId);
  if (!status) {
    if (DEMO) return NextResponse.json(DEMO_CONTRIBUTOR_TRACK);
    return NextResponse.json({ detail: "User not found." }, { status: 404 });
  }

  return NextResponse.json(status);
}
