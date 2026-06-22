import { NextResponse } from "next/server";
import { MOCK_RUBRIC_TEMPLATES } from "@/mocks/admin/rubrics";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_RUBRIC_TEMPLATES });
}
