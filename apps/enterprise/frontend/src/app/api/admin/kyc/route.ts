import { NextRequest, NextResponse } from "next/server";
import { backendBaseForPath } from "@/lib/api/backend-router";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLIMMORA_API = backendBaseForPath("/api/v1/auth/login");
// GET /api/admin/kyc?status=pending — lists real KYC submissions (women +
// freelancer applicants) from the superadmin service, forwarding the
// signed-in admin's bearer token.
export async function GET(req: NextRequest) {
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const path = status
    ? `/api/superadmin/kyc?status=${encodeURIComponent(status)}`
    : "/api/superadmin/kyc";

  const res = await fetch(`${GLIMMORA_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
