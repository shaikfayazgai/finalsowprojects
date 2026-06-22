/**
 * GET /api/superadmin/kyc
 *
 * Proxy → backend /api/superadmin/kyc. Forwards query params (e.g. ?status=pending).
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

export async function GET(req: NextRequest) {
  const guard = await requireRole(["admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qs = req.nextUrl.searchParams.toString();
  const upstream = `${GLIMMORA_API}/api/superadmin/kyc${qs ? "?" + qs : ""}`;

  try {
    const res = await fetch(upstream, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/superadmin/kyc GET]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
