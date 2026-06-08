import { NextResponse } from "next/server";
import { MOCK_ROLES } from "@/mocks/admin/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_ROLES });
}
