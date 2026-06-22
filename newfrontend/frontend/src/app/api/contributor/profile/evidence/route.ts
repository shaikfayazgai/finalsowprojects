import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/evidence");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/evidence");
}
