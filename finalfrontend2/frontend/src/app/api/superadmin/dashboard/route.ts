/**
 * GET /api/superadmin/dashboard
 *
 * Proxy route — forwards to the Glimmora backend superadmin dashboard
 * endpoint and returns the raw response. Injects the session bearer token
 * so the frontend component can call /api/superadmin/dashboard without
 * needing to handle auth itself.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

export async function GET(req: NextRequest) {
  const guard = await requireRole(["super_admin", "admin"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });
  const token = (jwt as { glimmoraAccessToken?: string } | null)
    ?.glimmoraAccessToken;

  if (!token) {
    return NextResponse.json(
      { error: "No backend token — sign in again" },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${GLIMMORA_API}/api/superadmin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[superadmin/dashboard proxy]", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 502 },
    );
  }
}
