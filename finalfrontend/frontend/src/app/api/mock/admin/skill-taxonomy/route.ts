import { NextResponse } from "next/server";
import { MOCK_SKILLS } from "@/mocks/admin/skills";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_SKILLS });
}
