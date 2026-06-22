/**
 * POST /api/reviewers/invites — reviewer invite proxy.
 * Forwards to the real super-admin backend: POST /api/v1/users
 * with role="reviewer" and sendInvitation=true so the backend
 * creates the account and emails credentials in one shot.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get("authorization") ?? "";
  return token ? { Authorization: token } : {};
}

export async function POST(req: NextRequest) {
  const headers = { "Content-Type": "application/json", ...authHeader(req) };

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  // Map the frontend invite payload to the backend CreateUserRequest shape.
  // The frontend sends { email, note }; the backend expects { email, role,
  // sendInvitation, note } where note is stored in a data field.
  const backendBody = {
    email: body.email,
    role: "reviewer",
    sendInvitation: true,
    // Pass the optional note through so the backend can include it.
    ...(body.note ? { note: body.note } : {}),
  };

  const url = `${BACKEND}/api/v1/users`;

  try {
    const backendRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(backendBody),
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));

    if (backendRes.ok) {
      // Normalize backend response to the shape the UI expects:
      // { code, registerUrl, email, expiresAt, emailSent }
      return NextResponse.json(
        {
          code: (data as Record<string, unknown>).id ?? null,
          registerUrl: null,
          email: (data as Record<string, unknown>).email ?? body.email,
          expiresAt: null,
          emailSent: (data as Record<string, unknown>).emailSent ?? true,
        },
        { status: 201 },
      );
    }

    if (backendRes.status === 422) {
      return NextResponse.json(data, { status: 422 });
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach reviewer invite service." },
      { status: 502 },
    );
  }
}
