import { NextResponse } from "next/server";
import { MOCK_ADMINS, isAdminRole } from "@/mocks/admin/personas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("role");
  const role = isAdminRole(raw) ? raw : "plat.admin";
  return NextResponse.json({ profile: MOCK_ADMINS[role] });
}
