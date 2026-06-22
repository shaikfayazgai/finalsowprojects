import { NextRequest, NextResponse } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import type { SowStage } from "@/lib/sow/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOW_STAGES: SowStage[] = ["finance", "security", "legal", "platform"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sowId: string }> },
) {
  const { sowId } = await params;

  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  let stage: SowStage | undefined;
  try {
    const body = (await req.clone().json()) as { stage?: string };
    if (body.stage && SOW_STAGES.includes(body.stage as SowStage)) {
      stage = body.stage as SowStage;
    }
  } catch {
    /* body optional for proxy-only backends */
  }

  if (stage) {
    const perm = `approve.sow.${stage}`;
    if (!(await userHasPermission(ctx.userId, perm))) {
      return NextResponse.json(
        { error: "forbidden", reason: `missing_permission:${perm}` },
        { status: 403 },
      );
    }
  }

  return proxyToBackendService(req, `/api/v1/sow/${sowId}/approve`);
}
