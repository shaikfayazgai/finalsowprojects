import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBackendServiceUrl } from "@/lib/api/backend-service";

/**
 * Server-side proxy for the authenticated reviewer backend (/api/v1/reviewer/*).
 *
 * The reviewer QA pages fetch these routes from the browser with only the
 * session cookie — the Glimmora access token lives server-side in the NextAuth
 * session, so we read it here via auth() and forward it as a Bearer token to the
 * Python backend (which gates every reviewer endpoint with get_current_user).
 */
export async function reviewerBackendProxy(
  backendPath: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<NextResponse> {
  const session = await auth();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  if (!token) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "No reviewer session." },
      { status: 401 },
    );
  }

  const target = new URL(backendPath, getBackendServiceUrl());
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(target.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      {
        error: "BACKEND_UNAVAILABLE",
        message: "Reviewer backend is unavailable.",
      },
      { status: 503 },
    );
  }
}
