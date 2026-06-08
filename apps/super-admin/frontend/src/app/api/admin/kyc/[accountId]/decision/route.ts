import { NextRequest, NextResponse } from "next/server";
import { backendBaseForPath } from "@/lib/api/backend-router";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLIMMORA_API = backendBaseForPath("/api/v1/auth/login");
// POST /api/admin/kyc/{accountId}/decision  body: { decision, note }
// Flips contributor_kyc.status + login_accounts.approval_status in the backend
// (so the applicant can actually log in after approval).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await params;
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const body = await req.text();
  const res = await fetch(
    `${GLIMMORA_API}/api/superadmin/kyc/${encodeURIComponent(accountId)}/decision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body || "{}",
    },
  );
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
