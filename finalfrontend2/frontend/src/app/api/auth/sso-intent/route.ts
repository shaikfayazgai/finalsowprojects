import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/sso-intent");
}
