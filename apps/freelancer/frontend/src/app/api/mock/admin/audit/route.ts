import { NextResponse } from "next/server";
import { MOCK_ADMIN_AUDIT_EVENTS } from "@/mocks/admin/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ events: MOCK_ADMIN_AUDIT_EVENTS });
}
