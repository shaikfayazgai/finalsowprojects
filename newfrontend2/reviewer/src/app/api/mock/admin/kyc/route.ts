import { NextResponse } from "next/server";
import { MOCK_KYC_CASES, MOCK_KYC_SUMMARY } from "@/mocks/admin/kyc";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: MOCK_KYC_CASES, summary: MOCK_KYC_SUMMARY });
}
