import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const DEFAULT_BACKEND_URL = "http://localhost:4000";

export function getBackendServiceUrl(): string {
  return (
    process.env.BACKEND_SERVICE_URL ??
    process.env.INTERNAL_BACKEND_URL ??
    DEFAULT_BACKEND_URL
  );
}

/**
 * Forward a Next.js API request to the standalone backend service (Phase 2).
 * Keeps public URLs stable at /api/* while handlers migrate to backend/src.
 *
 * Auth bridge: the FastAPI backend authenticates with its OWN JWT
 * (`Authorization: Bearer <token>`), not the NextAuth session cookie that the
 * browser sends. NextAuth already obtains + refreshes that backend token on
 * login and exposes it at `session.user.accessToken`. We read it here and
 * inject the Authorization header so proxied calls are authenticated. If the
 * incoming request already carries an explicit Authorization header, we respect
 * it (don't override).
 */
export async function proxyToBackendService(
  req: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const target = new URL(backendPath, getBackendServiceUrl());
  // append (not set) so repeated params like ?status=a&status=b are preserved —
  // set() would collapse them to the last value.
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection") return;
    headers.set(key, value);
  });

  // Bridge the NextAuth-held backend JWT into the proxied request.
  if (!headers.has("authorization")) {
    try {
      const session = await auth();
      const token = (session?.user as { accessToken?: string } | undefined)
        ?.accessToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      } else if (session?.user) {
        // Logged in but the backend token is momentarily missing (e.g. right
        // after a transient refresh failure). Don't forward a token-less request
        // — the backend would answer with its raw "Missing bearer token". Return
        // a clean, consistent 401 the FE treats as retry / re-authenticate.
        return NextResponse.json(
          { error: "AUTH_TOKEN_UNAVAILABLE", message: "Session is reconnecting — please retry." },
          { status: 401 },
        );
      }
      // No session at all → fall through so genuinely public endpoints still work.
    } catch (err) {
      console.error("[backend-proxy] could not read session for auth", err);
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(15_000),
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(target.toString(), init);
    const body = await res.text();
    const responseHeaders = new Headers();
    const contentType = res.headers.get("Content-Type");
    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }

    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        responseHeaders.append("set-cookie", value);
      }
    });

    return new NextResponse(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[backend-proxy] request failed", { target: target.toString(), err });
    return NextResponse.json(
      {
        error: "BACKEND_UNAVAILABLE",
        message:
          "Backend service is unavailable. Start it with npm run dev:backend.",
      },
      { status: 503 },
    );
  }
}
