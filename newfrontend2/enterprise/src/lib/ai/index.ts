/**
 * AI orchestrator — public surface.
 *
 * Usage:
 *   import { invokeAgent } from "@/lib/ai";
 *
 *   const result = await invokeAgent<ReviewAssistantInput, ReviewAssistantOutput>({
 *     agentId: "review-assistant",
 *     promptName: "score-rubric",
 *     variables: { taskBrief, criteria, evidence },
 *     context: { actorUserId, actorRole, tenantId, requestId },
 *   });
 *
 *   if (!result.ok) {
 *     // graceful degrade — render without AI
 *     console.warn("AI unavailable:", result.failure.reason);
 *     return renderWithoutSuggestions();
 *   }
 *
 *   const { suggestions } = result.response.output;
 *   const { confidence, sources, coverageGaps } = result.response;
 *
 * Per locked decision #7: callers MUST work without AI. invokeAgent
 * NEVER throws — it returns AgentResult with discriminated ok/failure.
 */

export { invokeAgent } from "./orchestrator";
export type {
  AgentId,
  AgentRequest,
  AgentRequestContext,
  AgentResponse,
  AgentResult,
  AgentFailure,
  AgentSource,
  AgentHandler,
  AgentHandlerInput,
  AgentHandlerResult,
} from "./types";
export type { SowIntakeInput, SowIntakeOutput } from "./agents/sow-intake";
export type {
  DecompositionInput,
  DecompositionOutput,
} from "./agents/decomposition";
export type {
  ContributorSupportInput,
  ContributorSupportOutput,
} from "./agents/contributor-support";
export type {
  ReviewAssistantInput,
  ReviewAssistantOutput,
} from "./agents/review-assistant";

export {
  listPromptVersions,
  rollbackToPromptVersion,
  PromptManagementError,
} from "./prompt-management";
export type {
  PromptVersionSummary,
  RollbackResult,
} from "./prompt-management";
