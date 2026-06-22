import { NextResponse } from "next/server";
import { MOCK_ADMIN_MENTORS } from "@/mocks/admin/mentors";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_ADMIN_MENTORS });
}
