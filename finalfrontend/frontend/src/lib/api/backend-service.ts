import { NextRequest, NextResponse } from "next/server";

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
 */
export async function proxyToBackendService(
  req: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const target = new URL(backendPath, getBackendServiceUrl());
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection") return;
    headers.set(key, value);
  });

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
