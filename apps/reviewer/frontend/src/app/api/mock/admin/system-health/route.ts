import { NextResponse } from "next/server";
import { MOCK_SERVICES, MOCK_RECENT_ALERTS } from "@/mocks/admin/services";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ services: MOCK_SERVICES, alerts: MOCK_RECENT_ALERTS });
}
