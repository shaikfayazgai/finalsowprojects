/**
 * GET /api/superadmin/contributors — full contributor directory for document
 * verification (profile + every uploaded file reference per contributor).
 *
 * Proxies to the super-admin FastAPI backend's
 * GET /api/superadmin/contributors/directory, injecting the admin's backend JWT
 * as a Bearer token. Backend enforces the admin role.
 *
 * NOTE: the backend path is `.../contributors/directory` (the bare
 * `/contributors` is the lightweight task-assign candidate pool). This proxy
 * lives at the frontend-friendly `/api/superadmin/contributors`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backendBase(): string {
  return (
    process.env.BACKEND_SERVICE_URL ??
    process.env.GLIMMORA_API_BASE_URL ??
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ??
    "http://127.0.0.1:8102"
  );
}

async function bearer(): Promise<string | null> {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (role !== "admin" && role !== "super_admin" && role !== "superadmin") return null;
  return (session?.user as { accessToken?: string } | undefined)?.accessToken ?? null;
}

export async function GET(_req: NextRequest) {
  const token = await bearer();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${backendBase()}/api/superadmin/contributors/directory`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 });
  }
}
