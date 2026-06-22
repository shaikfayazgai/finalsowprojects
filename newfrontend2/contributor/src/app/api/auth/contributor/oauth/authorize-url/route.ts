import { NextRequest, NextResponse } from "next/server";
import { parseContributorWorkspaceAuthorizeResponse } from "@/lib/api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/contributor/oauth/authorize-url?provider=google|microsoft
 *
 * Fetches the IdP authorization URL from the Glimmora API (JSON string body)
 * so the client can redirect without exposing server-only env, and to avoid
 * CORS on browser → API fetches.
 */
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  if (provider !== "google" && provider !== "microsoft") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const baseUrl = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "GLIMMORA_API_URL is not configured" }, { status: 500 });
  }

  const slug = provider === "microsoft" ? "microsoft" : "google";
  const apiUrl = `${baseUrl}/api/v1/auth/contributor/oauth/${slug}/authorize`;

  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: text || res.statusText || "Authorize request failed" },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }
    let raw: unknown;
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      raw = text;
    }
    const url = parseContributorWorkspaceAuthorizeResponse(raw);
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid URL from authorize API" }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authorize request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
