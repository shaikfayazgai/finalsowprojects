import { fetchInternal } from "@/lib/api/client";

/**
 * Public frontend proxy for OTP-based password reset (no reset links).
 * Lives under /api/auth (public in proxy.ts) and forwards to the backend.
 *
 *   POST /api/auth/otp?action=send    body { email, loginUrl? }  → sends 6-digit code
 *   POST /api/auth/otp?action=reset   body { email, code, newPassword } → verify + set pw
 */
function backend(): string {
  return (
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ||
    process.env.GLIMMORA_API_URL ||
    "http://localhost:9000"
  );
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const body = await req.json().catch(() => ({}));

  try {
    if (action === "send") {
      const res = await fetchInternal(`${backend()}/api/v1/auth/otp/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: body.email }),
      });
      const data = await res.json().catch(() => ({}));
      return Response.json(data, { status: res.status });
    }

    if (action === "verify") {
      // Verify the email OTP and mark email_verified=true server-side.
      const res = await fetchInternal(`${backend()}/api/v1/auth/otp/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: body.email, code: body.code }),
      });
      const data = await res.json().catch(() => ({}));
      return Response.json(data, { status: res.status });
    }

    if (action === "reset") {
      const res = await fetchInternal(`${backend()}/api/v1/auth/password/setup-after-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: body.email,
          code: body.code,
          new_password: body.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      return Response.json(data, { status: res.status });
    }

    return Response.json({ detail: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ detail: "Request failed. Please try again." }, { status: 500 });
  }
}
