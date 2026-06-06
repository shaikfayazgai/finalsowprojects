import { fetchInternal } from "@/lib/api/client";

/**
 * Frontend proxy for contributor self-signup → Glimmora backend.
 * Mirrors /api/auth/login: lives under the public /api/auth prefix so the
 * edge proxy lets it through, and forwards to the backend register endpoint.
 * The backend enforces email uniqueness across ALL roles (single
 * login_accounts table).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { firstName, email, password } = body ?? {};
  if (!firstName || !email || !password) {
    return Response.json({ detail: "Name, email and password are required" }, { status: 400 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ||
    process.env.GLIMMORA_API_URL ||
    "http://localhost:9000";

  try {
    const res = await fetchInternal(`${baseUrl}/api/v1/auth/register/contributor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ detail: "Registration failed. Please try again." }, { status: 500 });
  }
}
