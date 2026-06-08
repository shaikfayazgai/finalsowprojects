import { NextResponse } from "next/server";
import { findWWPartnerById } from "@/mocks/admin/partnerships";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const partner = findWWPartnerById(orgId);
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  return NextResponse.json({ partner });
}
