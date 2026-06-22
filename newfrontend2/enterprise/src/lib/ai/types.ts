/**
 * Shared AI orchestrator contracts. Every agent invocation goes
 * through this envelope so audit + override capture + calibration
 * have a uniform shape.
 *
 * Spec: docs/portal-specs/05-cross-functional.md §5
 */

export type AgentId =
  | "sow-intake"
  | "decomposition"
  | "contributor-support"
  | "review-assistant";

export interface AgentRequest<TInput = Record<string, unknown>> {
  agentId: AgentId;
  /** Template name within the agent (e.g., 'score-rubric'). */
  promptName: string;
  /** Caller-supplied variables — must match the active prompt's `variables` list. */
  variables: TInput;
  context: AgentRequestContext;
}

export interface AgentRequestContext {
  tenantId?: string | null;
  actorUserId: string;
  actorRole: string;
  /** Idempotency key. Reused requests within 24h return the cached result. */
  requestId?: string;
}

export interface AgentResponse<TOutput = unknown> {
  requestId: string;
  agentId: AgentId;
  promptVersion: number;
  modelId: string;
  output: TOutput;
  /** 0..1 — see doc 05 §5.3 for UX treatment thresholds. */
  confidence: number;
  sources: AgentSource[];
  /** What the agent did NOT check (and a human must). */
  coverageGaps: string[];
  /** Hallucination, low-quality input, plagiarism hits, etc. */
  riskFlags: string[];
  latencyMs: number;
  /** LLM cost in cents (null for Phase 1 mocks). */
  costCents?: number;
  generatedAt: string;
}

export interface AgentSource {
  kind:
    | "task_field"
    | "evidence_file"
    | "criterion"
    | "audit_event"
    | "external_link";
  reference: string;
  excerpt?: string;
}

export interface AgentFailure {
  requestId: string;
  agentId: AgentId;
  status: "error" | "timeout" | "rejected" | "fallback";
  reason: string;
  latencyMs: number;
}

export type AgentResult<TOutput = unknown> =
  | { ok: true; response: AgentResponse<TOutput> }
  | { ok: false; failure: AgentFailure };

/**
 * Handler signature each agent implements. Returns the output + signal
 * fields; orchestrator wraps in AgentResponse + writes Invocation row.
 *
 * Mock handlers return deterministic outputs; Phase 2 swaps to LLM
 * calls. Either way the contract is the same.
 */
export interface AgentHandlerInput<TInput = Record<string, unknown>> {
  variables: TInput;
  promptVersion: number;
  modelId: string;
  context: AgentRequestContext;
}

export interface AgentHandlerResult<TOutput = unknown> {
  output: TOutput;
  confidence: number;
  sources?: AgentSource[];
  coverageGaps?: string[];
  riskFlags?: string[];
  costCents?: number;
}

export type AgentHandler<TInput = Record<string, unknown>, TOutput = unknown> = (
  input: AgentHandlerInput<TInput>,
) => Promise<AgentHandlerResult<TOutput>>;
