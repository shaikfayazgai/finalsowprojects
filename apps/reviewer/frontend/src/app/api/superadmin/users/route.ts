import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireRole } from "@/lib/auth/require-role";
import { backendBaseForPath } from "@/lib/api/backend-router";
import { getAdminToken, invalidateAdminToken } from "@/lib/api/admin-token";

const GLIMMORA_API = backendBaseForPath("/api/superadmin/users");
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;


function toErrorMessage(data: Record<string, unknown>, fallback: string): string {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0] as { field?: string; message?: string };
    if (typeof first?.field === "string" && typeof first?.message === "string") {
      return `${first.field}: ${first.message}`;
    }
    if (typeof first?.message === "string") return first.message;
  }
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const x = item as { msg?: string };
          if (typeof x.msg === "string") return x.msg;
        }
        return "invalid";
      })
      .join("; ");
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  // super_admin can provision any role. enterprise admins may provision their own
  // workspace people (reviewer / member) — but NOT elevated roles. Anything else
  // is rejected.
  const guard = await requireRole(["super_admin", "enterprise"]);
  if (guard instanceof NextResponse) return guard;

  const secureCookie = req.nextUrl.protocol === "https:";
  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const callerRole = (jwt as { role?: string } | null)?.role ?? "";
  const callerEmail = (jwt as { email?: string } | null)?.email ?? "";
  const isSuperAdmin = callerRole === "super_admin" || callerRole === "superadmin";
  // Super admins call the backend with their own token. Enterprise admins can't
  // (the backend endpoint is admin-only), so we use the platform admin service
  // account on their behalf — after clamping the role below.
  let token = isSuperAdmin
    ? (jwt as { glimmoraAccessToken?: string } | null)?.glimmoraAccessToken
    : undefined;
  if (!token) token = (await getAdminToken()) ?? undefined;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in as super_admin or set GLIMMORA_ADMIN_EMAIL and GLIMMORA_ADMIN_PASSWORD in .env." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Privilege guard: a non-super-admin (enterprise) caller may only provision
  // workspace-level roles, never elevated ones.
  if (!isSuperAdmin) {
    const requested = String(body.role ?? "").toLowerCase();
    const allowedForEnterprise = new Set([
      "reviewer", "member", "contributor", "freelancer", "women", "student",
    ]);
    if (!allowedForEnterprise.has(requested)) {
      return NextResponse.json(
        { error: "Enterprise admins can only invite reviewer/member roles." },
        { status: 403 },
      );
    }
    // Inviter-based tenant scoping: stamp the new member with the inviting
    // admin's tenant so it appears only in this enterprise's registry.
    if (callerEmail && body.callerEmail === undefined) {
      body.callerEmail = callerEmail;
    }
  }

  const upstream = `${GLIMMORA_API}/api/superadmin/users`;
  const send = (bearer: string) =>
    fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify(body),
    });

  let res = await send(token);
  let data = await res.json().catch(() => ({} as Record<string, unknown>));

  if (res.status === 401 && ADMIN_EMAIL && ADMIN_PASSWORD) {
    invalidateAdminToken();
    const fresh = await getAdminToken();
    if (fresh) {
      res = await send(fresh);
      data = await res.json().catch(() => ({} as Record<string, unknown>));
    }
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: toErrorMessage(data, "Failed to create user") },
      { status: res.status },
    );
  }

  return NextResponse.json(data, { status: res.status });
}
