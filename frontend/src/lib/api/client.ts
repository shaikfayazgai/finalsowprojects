export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 60s — covers backend cold-starts AND Next.js dev first-hit route compilation
// (on Windows the first request to an uncompiled API route can take 20–30s to
// render; several profile routes compile at once on page load). In production
// these routes are pre-built so requests return in tens of milliseconds.
const REQUEST_TIMEOUT_MS = 60_000;
/**
 * Wrapper around fetch() for internal Next.js API routes (/api/...).
 * Adds the same 15-second timeout as apiCall() so internal routes
 * never hang indefinitely on a slow backend or cold start.
 */
export async function fetchInternal(
  path: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs, signal: externalSignal, ...rest } = options ?? {};
  const timeoutSignal = AbortSignal.timeout(timeoutMs ?? REQUEST_TIMEOUT_MS);
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, timeoutSignal])
    : timeoutSignal;
  try {
    return await fetch(path, { credentials: "include", ...rest, signal });
  } catch (err) {
    if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new ApiError(408, "Request timed out. Please try again.");
    }
    throw err;
  }
}

type ApiCallOptions = RequestInit & { token?: string; timeoutMs?: number };

export async function apiCall<T>(
  path: string,
  options?: ApiCallOptions,
): Promise<T> {
  const { token, headers: extraHeaders, timeoutMs, signal: externalSignal, ...rest } = options ?? {};

  // Combine caller's signal (if any) with the timeout signal
  const timeoutSignal = AbortSignal.timeout(timeoutMs ?? REQUEST_TIMEOUT_MS);
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, timeoutSignal])
    : timeoutSignal;

  try {
    // Routes starting with /api/ are frontend (Next.js) routes; everything else
    // targets the Glimmora backend via GLIMMORA_API_URL.
    //
    // Relative URLs only resolve in the browser. When apiCall runs on the
    // server (e.g. inside NextAuth's authorize()), a bare "/api/..." has no
    // origin and fetch throws. Detect the server runtime and prefix the app's
    // own origin so the frontend proxy route is still reachable.
    let url: string;
    if (path.startsWith("/api/")) {
      const isServer = typeof window === "undefined";
      if (isServer) {
        const appOrigin =
          process.env.NEXTAUTH_URL ??
          process.env.NEXT_PUBLIC_BASE_URL ??
          "http://localhost:3000";
        url = `${appOrigin.replace(/\/$/, "")}${path}`;
      } else {
        url = path; // Browser — relative resolves to current origin
      }
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;
      url = `${baseUrl}${path}`;
    }

    const res = await fetch(url, {
      ...rest,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(extraHeaders as Record<string, string>),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = body?.detail ?? body?.message ?? `API error ${res.status}`;
      let message: string;
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        // FastAPI validation errors: [{ loc: [...], msg: "...", type: "..." }]
        message = detail
          .map((e: { loc?: string[]; msg?: string }) => {
            const field = e.loc?.slice(1).join(".") ?? "field";
            return `${field}: ${e.msg ?? "invalid"}`;
          })
          .join("; ");
      } else {
        message = JSON.stringify(detail);
      }
      throw new ApiError(res.status, message, body);
    }

    const data = await res.json() as T;
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new ApiError(408, "Request timed out. Please try again.");
    }
    throw new ApiError(500, err instanceof Error ? err.message : "Network error");
  }
}
