import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Sets a short-lived cookie that signals the next SSO flow is a *registration*
 * (not a login). The auth.ts signIn callback reads this cookie to decide whether
 * to allow through an email that isn't yet in the Glimmora DB.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role: string = body.role === "enterprise" ? "enterprise" : "contributor";

  const cookieStore = await cookies();
  cookieStore.set("sso_register_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 5 * 60, // 5 minutes — long enough for the OAuth round-trip
    path: "/",
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true });
}
