import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

/* ── POST /api/auth/password/change ─────────────────────────────────────────
 * Proxies to super-admin service: POST /api/v1/auth/password/change
 *
 * Body fields forwarded as-is:
 *   old_password     string   — current password (also accepted as current_password)
 *   new_password     string   — new password
 *   confirmPassword  string   — optional confirmation (also accepted as confirm_password)
 *
 * The backend expects: { old_password, new_password, confirmPassword? }
 * This proxy normalises the two accepted aliases into the canonical field
 * names before forwarding, so both old and new callers keep working.
 */

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let body: Record<string, unknown> = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }
  }

  // Normalise field aliases so both old and new callers work.
  const normalised: Record<string, unknown> = {
    old_password:
      body.old_password ?? body.current_password ?? undefined,
    new_password: body.new_password ?? undefined,
    confirmPassword:
      body.confirmPassword ?? body.confirm_password ?? undefined,
    ...body,
  };
  // Remove the alias keys to avoid duplication.
  delete normalised.current_password;
  delete normalised.confirm_password;

  const url = `${BACKEND}/api/v1/auth/password/change`;

  try {
    const backendRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(req),
      },
      body: JSON.stringify(normalised),
      cache: "no-store",
    });

    if (backendRes.ok) {
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    if (backendRes.status === 422) {
      const body422 = await backendRes
        .json()
        .catch(() => ({ detail: "Validation error" }));
      return NextResponse.json(body422, { status: 422 });
    }

    const errBody = await backendRes.json().catch(() => ({
      detail: `Backend error ${backendRes.status}`,
    }));
    return NextResponse.json(errBody, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach auth service." },
      { status: 502 },
    );
  }
}
