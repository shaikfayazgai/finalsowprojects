import { NextResponse } from "next/server";
import { MOCK_GOV_CASES, MOCK_GOV_SUMMARY } from "@/mocks/admin/governance";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_GOV_CASES, summary: MOCK_GOV_SUMMARY });
}
