/**
 * Agent registry — maps AgentId → handler.
 *
 * Adding a new agent in Phase 2:
 *   1. Add to AgentId union (types.ts)
 *   2. Insert row into Agent table (migration) + initial prompt
 *   3. Write handler in agents/<id>.ts
 *   4. Register here
 */

import type { AgentHandler, AgentId } from "./types";
import { sowIntakeHandler } from "./agents/sow-intake";
import { decompositionHandler } from "./agents/decomposition";
import { contributorSupportHandler } from "./agents/contributor-support";
import { reviewAssistantHandler } from "./agents/review-assistant";

export const AGENT_HANDLERS: Record<
  AgentId,
  AgentHandler<Record<string, unknown>, unknown>
> = {
  "sow-intake": sowIntakeHandler as unknown as AgentHandler<
    Record<string, unknown>,
    unknown
  >,
  decomposition: decompositionHandler as unknown as AgentHandler<
    Record<string, unknown>,
    unknown
  >,
  "contributor-support": contributorSupportHandler as unknown as AgentHandler<
    Record<string, unknown>,
    unknown
  >,
  "review-assistant": reviewAssistantHandler as unknown as AgentHandler<
    Record<string, unknown>,
    unknown
  >,
};
