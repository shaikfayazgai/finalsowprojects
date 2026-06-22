import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/rate-cards");
}

export async function PUT(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/rate-cards");
}
