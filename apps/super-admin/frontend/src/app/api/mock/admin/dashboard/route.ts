import { NextResponse } from "next/server";
import { MOCK_ADMIN_DASHBOARD } from "@/mocks/admin/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(MOCK_ADMIN_DASHBOARD);
}
