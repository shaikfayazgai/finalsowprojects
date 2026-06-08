/**
 * Client for POST /api/ai/invoke.
 *
 * Mirrors the AgentRequest/AgentResult shape from `@/lib/ai`.
 * Re-exporting the typed result lets callers and hooks share types
 * without crossing client/server boundaries directly.
 */

import type {
  AgentId,
  AgentResult,
  AgentResponse,
  AgentFailure,
} from "@/lib/ai/types";

export type { AgentId, AgentResult, AgentResponse, AgentFailure };

export interface InvokeAgentClientRequest<
  TInput extends object = Record<string, unknown>,
> {
  agentId: AgentId;
  promptName: string;
  variables: TInput;
  /** Idempotency key — caller chooses (e.g., a deterministic key per task+state). */
  requestId?: string;
}

export class AiApiError extends Error {
  constructor(
    public status: number,
    public reason?: string,
  ) {
    super(`AI API error: ${status}${reason ? ` (${reason})` : ""}`);
    this.name = "AiApiError";
  }
}

export async function invokeAgentApi<
  TInput extends object,
  TOutput,
>(
  request: InvokeAgentClientRequest<TInput>,
): Promise<AgentResult<TOutput>> {
  const res = await fetch("/api/ai/invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason : undefined;
    throw new AiApiError(res.status, reason);
  }

  return (await res.json()) as AgentResult<TOutput>;
}
