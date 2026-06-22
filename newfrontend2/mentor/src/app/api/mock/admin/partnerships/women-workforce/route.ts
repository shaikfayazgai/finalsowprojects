import { NextResponse } from "next/server";
import { MOCK_WW_PARTNERS } from "@/mocks/admin/partnerships";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_WW_PARTNERS });
}
