import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Same-origin proxy for SOW upload. The browser SOW client used to POST the
 * multipart file DIRECTLY to NEXT_PUBLIC_GLIMMORA_API_URL (a cross-origin call
 * to the backend), which silently failed in the browser — so SOWs never
 * persisted even though the UI showed them from the local store. Routing the
 * upload through this same-origin proxy fixes that: it resolves the logged-in
 * user's own Glimmora token from the NextAuth session and forwards the file to
 * the backend, so the SOW is created under the RIGHT owner.
 *
 *   POST /api/sow/upload?approved=1   (multipart: file, projectTitle, clientOrganisation, linkedSowId?)
 */
const BACKEND = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";

async function userToken(req: NextRequest): Promise<string | null> {
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  if (!jwt) return null;
  let token = jwt.glimmoraAccessToken as string | undefined;
  // Refresh the user's own token if it's missing (keeps ownership correct).
  if (!token && jwt.glimmoraRefreshToken) {
    try {
      const r = await fetch(`${BACKEND}/api/v1/auth/refresh`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: jwt.glimmoraRefreshToken }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.access_token) token = d.access_token;
    } catch { /* ignore */ }
  }
  return token ?? null;
}

export async function POST(req: NextRequest) {
  const token = await userToken(req);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const approved = req.nextUrl.searchParams.get("approved") === "1";
  const path = approved ? "/api/v1/sow/upload-approved" : "/api/v1/sow/upload";
  try {
    const form = await req.formData();
    const r = await fetch(`${BACKEND}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: AbortSignal.timeout(90000),
    });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
  } catch {
    return NextResponse.json({ detail: "Upload failed. Please try again." }, { status: 502 });
  }
}
