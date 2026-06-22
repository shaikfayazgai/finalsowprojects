/**
 * POST /api/admin/agents/[agentId]/prompts/[templateName]/rollback
 *
 * Body:
 *   { targetVersionId: string, reason?: string }
 *
 * Flips Agent.activePromptId to the supplied PromptVersion. Subsequent
 * invokeAgent() calls use the prior prompt.
 *
 * Permission: manage.ai_prompt
 *
 * Audit: emits `ai.prompt.rollback` with from/to version + reason.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { PromptManagementError, rollbackToPromptVersion } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  targetVersionId: z.string().min(1),
  reason: z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await ctx.withTx(async (tx) => {
      const r = await rollbackToPromptVersion(tx, {
        agentId,
        targetVersionId: parsed.data.targetVersionId,
        actorUserId: ctx.userId,
        reason: parsed.data.reason,
      });
      await ctx.audit(
        {
          action: "ai.prompt.rollback",
          resource: {
            type: "ai_prompt",
            id: r.toPromptVersionId,
            label: `${agentId}.${templateName} v${r.toVersion}`,
          },
          payload: {
            agentId,
            templateName,
            fromPromptVersionId: r.fromPromptVersionId,
            fromVersion: r.fromVersion,
            toPromptVersionId: r.toPromptVersionId,
            toVersion: r.toVersion,
            reason: parsed.data.reason ?? null,
          },
          severity: "warning",
        },
        { tx },
      );
      return r;
    });
    return NextResponse.json({ result }, { status: 200 });
  } catch (err) {
    if (err instanceof PromptManagementError) {
      const status =
        err.code === "not_found"
          ? 404
          : err.code === "validation" || err.code === "invalid_state"
            ? 400
            : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    // eslint-disable-next-line no-console
    console.error("[admin.agents.prompts.rollback]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
