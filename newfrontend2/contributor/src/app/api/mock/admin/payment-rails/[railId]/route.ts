import { NextResponse } from "next/server";
import { findRailById } from "@/mocks/admin/rails";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ railId: string }> }) {
  const { railId } = await params;
  const rail = findRailById(railId);
  if (!rail) return NextResponse.json({ error: "Rail not found" }, { status: 404 });
  return NextResponse.json({ rail });
}
