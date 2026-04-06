export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiCallOptions = RequestInit & { token?: string };

export async function apiCall<T>(
  path: string,
  options?: ApiCallOptions,
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options ?? {};

  try {
    const baseUrl = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;
    const res = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(extraHeaders as Record<string, string>),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = body?.detail ?? body?.message ?? `API error ${res.status}`;
      const message =
        typeof detail === "string" ? detail : JSON.stringify(detail);
      throw new ApiError(res.status, message);
    }

    const data = await res.json() as T;
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, err instanceof Error ? err.message : "Network error");
  }
}
