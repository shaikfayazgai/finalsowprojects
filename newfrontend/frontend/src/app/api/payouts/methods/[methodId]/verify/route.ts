import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ methodId: string }> },
) {
  const { methodId } = await params;
  return proxyToBackendService(req, `/api/v1/payouts/methods/${methodId}/verify`);
}
