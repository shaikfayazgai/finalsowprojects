import { NextResponse } from "next/server";
import { MOCK_UNIVERSITIES } from "@/mocks/admin/partnerships";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_UNIVERSITIES });
}
