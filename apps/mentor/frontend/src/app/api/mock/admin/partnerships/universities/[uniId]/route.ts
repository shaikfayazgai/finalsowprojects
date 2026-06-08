import { NextResponse } from "next/server";
import { findUniversityById } from "@/mocks/admin/partnerships";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ uniId: string }> }) {
  const { uniId } = await params;
  const partner = findUniversityById(uniId);
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  return NextResponse.json({ partner });
}
