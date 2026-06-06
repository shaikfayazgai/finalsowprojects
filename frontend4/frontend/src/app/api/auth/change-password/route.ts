import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRequest } from "@/lib/api/request-context";
import {
  changeLocalPassword,
  LocalPasswordChangeError,
} from "@/lib/auth/change-local-password";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLIMMORA_API = process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;

function readPasswordFields(body: Record<string, unknown>) {
  const currentPassword =
    (typeof body.old_password === "string" && body.old_password) ||
    (typeof body.current_password === "string" && body.current_password) ||
    "";
  const newPassword =
    (typeof body.new_password === "string" && body.new_password) || "";
  const confirmPassword =
    (typeof body.confirmPassword === "string" && body.confirmPassword) ||
    (typeof body.confirm_password === "string" && body.confirm_password) ||
    newPassword;
  return { currentPassword, newPassword, confirmPassword };
}

export async function POST(req: NextRequest) {
  try {
    return await handleChangePassword(req);
  } catch (err) {
    // Surface the real error instead of Next's opaque "Bad request."
    console.error("[change-password] unhandled:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

async function handleChangePassword(req: NextRequest) {
  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

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

  const { currentPassword, newPassword, confirmPassword } = readPasswordFields(body);
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Passwords do not match." },
      { status: 400 },
    );
  }

  // 1) Provisioned / backend accounts (incl. first-login temp-password reset):
  //    the password lives in the FastAPI login_accounts table, so change it
  //    there using the session's bearer token. This is the primary path.
  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const token = (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken;

  if (token) {
    try {
      const res = await fetch(`${GLIMMORA_API}/api/v1/auth/password/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        return NextResponse.json({ success: true, message: "Password updated." });
      }
      // If the backend says the current password is wrong, fall through to try
      // the local Prisma path (covers self-signup accounts whose password is
      // only in the frontend DB).
      const detail =
        (typeof data.detail === "string" && data.detail) ||
        (typeof data.message === "string" && data.message) ||
        "Couldn't update your password.";
      // Only fall through on an auth/credential error; surface other errors.
      const credErr = res.status === 400 || res.status === 401 || res.status === 403;
      if (!credErr) {
        return NextResponse.json({ success: false, message: detail }, { status: res.status });
      }
    } catch {
      // network/backend issue — try local path next
    }
  }

  // 2) Local Prisma-backed accounts (e.g. women self-signup) — verify + update
  //    the frontend DB passwordHash.
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { passwordHash: true },
  });
  if (user?.passwordHash) {
    try {
      await changeLocalPassword({
        userId: ctx.userId,
        currentPassword,
        newPassword,
        confirmPassword,
        exceptSessionId: ctx.sessionId,
      });
      return NextResponse.json({ success: true, message: "Password updated." });
    } catch (err) {
      if (err instanceof LocalPasswordChangeError) {
        const status =
          err.code === "invalid_current" || err.code === "validation" ? 400 : 404;
        return NextResponse.json({ success: false, message: err.message }, { status });
      }
      throw err;
    }
  }

  return NextResponse.json(
    { success: false, message: "Couldn't update your password. Check your current password and try again." },
    { status: 400 },
  );
}
