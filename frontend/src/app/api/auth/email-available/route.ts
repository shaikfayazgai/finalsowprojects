import { fetchInternal } from "@/lib/api/client";

/**
 * Public pre-signup duplicate-email check (no auth). Lets the signup form warn
 * about an existing email BEFORE the user verifies an OTP, so the OTP isn't
 * wasted. Forwards to the backend's /api/v1/auth/email-available.
 */
function backend(): string {
  return (
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ||
    process.env.GLIMMORA_API_URL ||
    "http://localhost:9000"
  );
}

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email") ?? "";
  try {
    const res = await fetchInternal(
      `${backend()}/api/v1/auth/email-available?email=${encodeURIComponent(email)}`,
      { method: "GET" },
    );
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    // Fail open — don't block signup if the check itself errors.
    return Response.json({ available: true, exists: false }, { status: 200 });
  }
}
