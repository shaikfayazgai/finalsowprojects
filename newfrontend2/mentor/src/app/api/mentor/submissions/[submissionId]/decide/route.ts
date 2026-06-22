import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;
  const bearerToken = (ctx.session.user as { accessToken?: string }).accessToken;
  const { submissionId } = await params;
  return proxyToBackendService(
    req,
    `/api/v1/mentor/submissions/${submissionId}/decide`,
    { bearerToken },
  );
}
