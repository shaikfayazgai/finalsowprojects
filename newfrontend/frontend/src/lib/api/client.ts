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

/**
 * Browser-only auto-logout hook.
 *
 * `client.ts` is imported by BOTH server route handlers and client components,
 * so it cannot statically import `next-auth/react` (client-only). Instead the
 * client-side token-expiry module registers a handler here at module load. When
 * `fetchInternal` sees a 401 whose body is the proxy's `AUTH_TOKEN_UNAVAILABLE`
 * marker, it invokes this — which signs the user out to the portal login — so
 * every page using `fetchInternal` gets clean re-auth instead of a stuck
 * "Session is reconnecting" state. No-op on the server (never registered there).
 */
type TokenErrorHandler = (body: unknown) => boolean;
let tokenErrorHandler: TokenErrorHandler | null = null;
export function registerTokenErrorHandler(fn: TokenErrorHandler): void {
  tokenErrorHandler = fn;
}
function maybeHandleTokenError(status: number, body: unknown): void {
  if (status === 401 && tokenErrorHandler) {
    try {
      tokenErrorHandler(body);
    } catch {
      /* never let logout bookkeeping mask the original error */
    }
  }
}

const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds — covers Render cold-start delays
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
    const res = await fetch(path, { credentials: "include", ...rest, signal });
    // Token-expiry auto-logout: peek a 401 body via a clone so the caller still
    // gets an unconsumed Response. Browser-only (handler is null on the server).
    if (res.status === 401 && tokenErrorHandler) {
      const body = await res.clone().json().catch(() => ({}));
      maybeHandleTokenError(res.status, body);
    }
    return res;
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
    const baseUrl = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;
    const res = await fetch(`${baseUrl}${path}`, {
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
      maybeHandleTokenError(res.status, body);
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
