/**
 * invokeAgent() — the single entry point for every agent call.
 *
 *   1. Load Agent row + active PromptVersion
 *   2. Check enabled
 *   3. Validate required variables
 *   4. Run idempotency dedup (24h window per locked decision #18)
 *   5. Call the agent handler
 *   6. Persist AgentInvocation
 *   7. Audit emit `agent.invoke` + `agent.respond`
 *   8. Return AgentResult (typed; ok|failure discriminated)
 *
 * Graceful degrade: any failure path returns `{ ok: false, failure }`.
 * Callers MUST work without AI per locked decision #7. Don't throw.
 */

import crypto from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { auditEmit } from "@/lib/audit";
import type {
  AgentFailure,
  AgentRequest,
  AgentResponse,
  AgentResult,
  AgentSource,
} from "./types";
import { AGENT_HANDLERS } from "./registry";

const IDEMPOTENCY_WINDOW_HOURS = 24;

export async function invokeAgent<TInput, TOutput>(
  request: AgentRequest<TInput>,
): Promise<AgentResult<TOutput>> {
  const startedAt = Date.now();
  const requestId = request.context.requestId ?? crypto.randomUUID();

  // ─── 1. Idempotency check ────────────────────────────────
  if (request.context.requestId) {
    const existing = await prisma.agentInvocation.findUnique({
      where: { requestId: request.context.requestId },
    });
    if (existing) {
      const ageMs = Date.now() - existing.createdAt.getTime();
      if (ageMs < IDEMPOTENCY_WINDOW_HOURS * 3600 * 1000) {
        return hydrateExisting<TOutput>(existing);
      }
      // Expired — fall through to fresh invocation
    }
  }

  // ─── 2. Load agent + active prompt ───────────────────────
  const agent = await prisma.agent.findUnique({
    where: { id: request.agentId },
    include: {
      activePrompt: {
        include: { promptTemplate: true },
      },
    },
  });

  if (!agent) {
    return persistFailure({
      startedAt,
      requestId,
      request,
      modelId: "unknown",
      status: "error",
      reason: "agent_not_found",
    });
  }
  if (!agent.isEnabled) {
    return persistFailure({
      startedAt,
      requestId,
      request,
      modelId: agent.modelId,
      status: "rejected",
      reason: "agent_disabled",
    });
  }
  if (!agent.activePromptId || !agent.activePrompt) {
    return persistFailure({
      startedAt,
      requestId,
      request,
      modelId: agent.modelId,
      status: "error",
      reason: "no_active_prompt",
    });
  }

  // Verify prompt template name matches caller's intent.
  if (agent.activePrompt.promptTemplate.name !== request.promptName) {
    return persistFailure({
      startedAt,
      requestId,
      request,
      modelId: agent.modelId,
      status: "error",
      reason: `prompt_mismatch: caller asked for "${request.promptName}", active is "${agent.activePrompt.promptTemplate.name}"`,
      promptVersionId: agent.activePromptId,
    });
  }

  // ─── 3. Variable validation ──────────────────────────────
  const provided = new Set(Object.keys(request.variables as object));
  const missing = agent.activePrompt.variables.filter(
    (v) => !provided.has(v),
  );
  if (missing.length > 0) {
    return persistFailure({
      startedAt,
      requestId,
      request,
      modelId: agent.modelId,
      status: "error",
      reason: `missing_variables: ${missing.join(", ")}`,
      promptVersionId: agent.activePromptId,
    });
  }

  // ─── 4. Emit agent.invoke audit ──────────────────────────
  await auditEmit({
    tenantId: request.context.tenantId ?? null,
    actor: {
      userId: request.context.actorUserId,
      portalRole: request.context.actorRole,
    },
    action: "agent.invoke",
    resource: { type: "agent_invocation", id: requestId },
    payload: {
      agentId: request.agentId,
      promptName: request.promptName,
      promptVersion: agent.activePrompt.version,
      modelId: agent.modelId,
    },
    severity: "info",
  });

  // ─── 5. Run handler ──────────────────────────────────────
  const handler = AGENT_HANDLERS[request.agentId];
  let handlerResult;
  try {
    handlerResult = await handler({
      variables: request.variables as Record<string, unknown>,
      promptVersion: agent.activePrompt.version,
      modelId: agent.modelId,
      context: request.context,
    });
  } catch (err) {
    return persistFailure({
      startedAt,
      requestId,
      request,
      modelId: agent.modelId,
      status: "error",
      reason: err instanceof Error ? err.message : "handler_threw",
      promptVersionId: agent.activePromptId,
    });
  }

  const latencyMs = Date.now() - startedAt;

  // ─── 6. Persist invocation ───────────────────────────────
  await prisma.agentInvocation.create({
    data: {
      agentId: request.agentId,
      promptVersionId: agent.activePromptId,
      modelId: agent.modelId,
      tenantId: request.context.tenantId ?? null,
      actorUserId: request.context.actorUserId,
      requestId,
      input: request.variables as Prisma.InputJsonValue,
      output: handlerResult.output as Prisma.InputJsonValue,
      confidence: handlerResult.confidence,
      latencyMs,
      status: "success",
      costCents: handlerResult.costCents ?? null,
    },
  });

  // ─── 7. Emit agent.respond audit ─────────────────────────
  await auditEmit({
    tenantId: request.context.tenantId ?? null,
    actor: {
      userId: request.context.actorUserId,
      portalRole: request.context.actorRole,
    },
    action: "agent.respond",
    resource: { type: "agent_invocation", id: requestId },
    payload: {
      agentId: request.agentId,
      promptVersion: agent.activePrompt.version,
      confidence: handlerResult.confidence,
      latencyMs,
      coverageGaps: handlerResult.coverageGaps ?? [],
      riskFlags: handlerResult.riskFlags ?? [],
    },
    severity: "info",
  });

  // ─── 8. Build response ───────────────────────────────────
  const response: AgentResponse<TOutput> = {
    requestId,
    agentId: request.agentId,
    promptVersion: agent.activePrompt.version,
    modelId: agent.modelId,
    output: handlerResult.output as TOutput,
    confidence: handlerResult.confidence,
    sources: handlerResult.sources ?? [],
    coverageGaps: handlerResult.coverageGaps ?? [],
    riskFlags: handlerResult.riskFlags ?? [],
    latencyMs,
    costCents: handlerResult.costCents,
    generatedAt: new Date().toISOString(),
  };

  return { ok: true, response };
}

/* ──────────────────── internal helpers ──────────────────── */

async function persistFailure<TOutput>(args: {
  startedAt: number;
  requestId: string;
  request: AgentRequest<unknown>;
  modelId: string;
  status: AgentFailure["status"];
  reason: string;
  promptVersionId?: string;
}): Promise<AgentResult<TOutput>> {
  const latencyMs = Date.now() - args.startedAt;

  // Best-effort invocation record — swallow DB errors here so we always
  // return an AgentResult to the caller.
  try {
    await prisma.agentInvocation.create({
      data: {
        agentId: args.request.agentId,
        promptVersionId: args.promptVersionId ?? null,
        modelId: args.modelId,
        tenantId: args.request.context.tenantId ?? null,
        actorUserId: args.request.context.actorUserId,
        requestId: args.requestId,
        input: args.request.variables as Prisma.InputJsonValue,
        output: Prisma.JsonNull,
        confidence: null,
        latencyMs,
        status: args.status,
        errorMessage: args.reason,
      },
    });
  } catch {
    // Continue — we still want to return a typed failure to the caller.
  }

  try {
    await auditEmit({
      tenantId: args.request.context.tenantId ?? null,
      actor: {
        userId: args.request.context.actorUserId,
        portalRole: args.request.context.actorRole,
      },
      action: "agent.respond",
      resource: { type: "agent_invocation", id: args.requestId },
      payload: {
        agentId: args.request.agentId,
        status: args.status,
        reason: args.reason,
        latencyMs,
      },
      severity: args.status === "rejected" ? "info" : "warning",
    });
  } catch {
    // Same — never throw from failure path.
  }

  return {
    ok: false,
    failure: {
      requestId: args.requestId,
      agentId: args.request.agentId,
      status: args.status,
      reason: args.reason,
      latencyMs,
    },
  };
}

function hydrateExisting<TOutput>(existing: {
  agentId: string;
  promptVersionId: string | null;
  modelId: string;
  requestId: string;
  output: unknown;
  confidence: number | null;
  latencyMs: number;
  createdAt: Date;
  status: string;
}): AgentResult<TOutput> {
  if (existing.status === "success" && existing.output !== null) {
    return {
      ok: true,
      response: {
        requestId: existing.requestId,
        agentId: existing.agentId as AgentResponse["agentId"],
        promptVersion: 0, // would need a fresh fetch to populate; cached path
        modelId: existing.modelId,
        output: existing.output as TOutput,
        confidence: existing.confidence ?? 0,
        sources: [] as AgentSource[],
        coverageGaps: [],
        riskFlags: [],
        latencyMs: existing.latencyMs,
        generatedAt: existing.createdAt.toISOString(),
      },
    };
  }
  return {
    ok: false,
    failure: {
      requestId: existing.requestId,
      agentId: existing.agentId as AgentResponse["agentId"],
      status: existing.status as AgentFailure["status"],
      reason: "cached_failure",
      latencyMs: existing.latencyMs,
    },
  };
}
