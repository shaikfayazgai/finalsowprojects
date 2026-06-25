import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND =
  process.env.BACKEND_SERVICE_URL ??
  process.env.INTERNAL_BACKEND_URL ??
  process.env.NEXT_PUBLIC_GLIMMORA_API_URL ??
  process.env.GLIMMORA_API_URL ??
  "http://localhost:9000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── POST /api/contributor/profile/upload ───────────────────────────────────
 * Multipart upload of a profile-wizard file (avatar / government-ID document /
 * passport photo) to Vercel Blob via the freelancer backend. Returns
 * { url, filename, content_type, size_bytes }; the wizard stores `url` into
 * profile_extra (avatar_url / verification.idDocument).
 *
 * Custom handler (NOT proxyToBackendService): that helper reads the body as
 * text(), which corrupts binary multipart. Here we forward the FormData with its
 * multipart boundary intact and inject the NextAuth-held backend token.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid form data." }, { status: 400 });
  }

  // Forward the optional ?kind= namespace (avatar / id_document / passport_photo).
  const kind = req.nextUrl.searchParams.get("kind");
  const qs = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  const url = `${BACKEND}/api/contributor/profile/upload${qs}`;

  try {
    // Do NOT set Content-Type — fetch sets the multipart boundary from the body.
    const backendRes = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const data = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ detail: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
