/**
 * POST /api/ai/invoke
 *
 * The single entry point clients use to call any AI agent. Wraps
 * `invokeAgent()` from `@/lib/ai` with auth + role-gate + audit-ready
 * context.
 *
 * Body:
 *   { agentId, promptName, variables, requestId? }
 *
 * Responses:
 *   200 { ok: true,  response }   — agent succeeded
 *   200 { ok: false, failure }    — agent unavailable / rejected / errored
 *   400                            — body validation failed
 *   401                            — unauthenticated
 *   403                            — role isn't allowed for this agent
 *
 * Why 200 for typed failures: the orchestrator's failure result is a
 * normal product response (clients work without AI per locked decision
 * #7). HTTP non-2xx is reserved for "we couldn't even try."
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { invokeAgent, type AgentId, type AgentResult } from "@/lib/ai";
import { requireRequest } from "@/lib/api/request-context";
import type { Role } from "@/lib/auth/require-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_ID_VALUES = [
  "sow-intake",
  "decomposition",
  "contributor-support",
  "review-assistant",
] as const satisfies readonly AgentId[];

const bodySchema = z.object({
  agentId: z.enum(AGENT_ID_VALUES),
  promptName: z.string().min(1).max(64),
  variables: z.record(z.string(), z.unknown()),
  requestId: z.string().min(1).max(64).optional(),
});

/**
 * Legacy-role gate per agent. When the scoped RBAC taxonomy is wired
 * into the JWT (Phase 1B), this becomes a permission check
 * (`agent.invoke.<agentId>` permission).
 */
const AGENT_ALLOWED_ROLES: Record<AgentId, Role[]> = {
  "sow-intake": ["enterprise", "admin", "super_admin"],
  decomposition: ["enterprise", "admin", "super_admin"],
  "contributor-support": [
    "contributor",
    "mentor",
    "admin",
    "super_admin",
    "enterprise",
  ],
  "review-assistant": ["mentor", "reviewer", "admin", "super_admin"],
};

export async function POST(req: NextRequest) {
  // 1. Auth (tenant optional — contributor-support is invoked by
  //    cross-tenant users without a primary tenant).
  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  // 2. Body validation
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { agentId, promptName, variables, requestId } = parsed.data;

  // 3. Per-agent role gate
  const allowed = AGENT_ALLOWED_ROLES[agentId];
  if (!allowed.includes(ctx.role)) {
    return NextResponse.json(
      { error: "forbidden", reason: "agent_role_not_allowed" },
      { status: 403 },
    );
  }

  // 4. Call orchestrator
  const result: AgentResult = await invokeAgent({
    agentId,
    promptName,
    variables,
    context: {
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      tenantId: ctx.tenant?.id ?? null,
      requestId,
    },
  });

  return NextResponse.json(result, { status: 200 });
}
