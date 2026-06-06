import { NextResponse } from "next/server";
import { MOCK_ADMIN_MENTORS, MOCK_MENTOR_POOLS } from "@/mocks/admin/mentors";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const pool = MOCK_MENTOR_POOLS.find((p) => p.id === poolId);
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  return NextResponse.json({ pool, members: MOCK_ADMIN_MENTORS.filter((m) => m.pools.includes(pool.id)) });
}
