/**
 * GET /api/admin/agents/[agentId]/prompts/[templateName]/versions
 *
 * Lists every PromptVersion for the given template. Each entry is
 * flagged with `isActive` so the UI can show which one is currently
 * serving traffic. Permission: manage.ai_prompt.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { listPromptVersions, PromptManagementError } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string; templateName: string }> },
) {
  const { agentId, templateName } = await params;
  if (!agentId || !templateName) {
    return NextResponse.json({ error: "Missing path parameters" }, { status: 400 });
  }

  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "manage.ai_prompt"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:manage.ai_prompt" },
      { status: 403 },
    );
  }

  try {
    const versions = await ctx.withTx((tx) =>
      listPromptVersions(tx, { agentId, templateName }),
    );
    return NextResponse.json({ versions }, { status: 200 });
  } catch (err) {
    if (err instanceof PromptManagementError) {
      const status = err.code === "not_found" ? 404 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    // eslint-disable-next-line no-console
    console.error("[admin.agents.prompts.versions]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
