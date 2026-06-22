import { NextRequest, NextResponse } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";
import { requireRequest } from "@/lib/api/request-context";
import {
  changeLocalPassword,
  LocalPasswordChangeError,
} from "@/lib/auth/change-local-password";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const proxyReq = new NextRequest(req.url, {
    method: req.method,
    headers: req.headers,
    body: rawBody || undefined,
  });
  return proxyToBackendService(proxyReq, "/api/v1/auth/password/change");
}
