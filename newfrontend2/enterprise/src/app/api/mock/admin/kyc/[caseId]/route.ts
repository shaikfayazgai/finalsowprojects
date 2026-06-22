import { NextResponse } from "next/server";
import { MOCK_KYC_CASES } from "@/mocks/admin/kyc";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const c = MOCK_KYC_CASES.find((x) => x.id === caseId);
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  return NextResponse.json({ case: c });
}
