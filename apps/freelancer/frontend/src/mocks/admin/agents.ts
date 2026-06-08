/**
 * Admin · AI agents + prompts — spec doc 04 §5.K.
 * Phase 1: 4 MVP agents, enable/disable + model id + active prompt version + rollback.
 */

export type AgentStatus = "enabled" | "paused";

export interface MockAIAgent {
  id: string;
  name: string;
  shortName: string;
  description: string;
  portal: "enterprise" | "contributor" | "mentor" | "all";
  status: AgentStatus;
  modelId: string;
  activePromptId: string;
  activePromptVersion: number;
  recentInvocations24h: number;
  avgLatencyMs: number;
  errors24h: number;
  // override stats — only meaningful for review-assistant
  overrideStats?: {
    acceptedAsIs: number;    // pct
    modified: number;
    overridden: number;
  };
}

export const MOCK_AI_AGENTS: MockAIAgent[] = [];

export interface MockPromptVersion {
  version: number;
  status: "active" | "inactive" | "draft";
  activatedAt: string;
  author: string;
  changelog: string;
  body: string;
}

export interface MockPromptTemplate {
  id: string;
  agentId: string;
  name: string;
  variables: string[];
  expectedSchema: string;
  versions: MockPromptVersion[];   // versions[0] = newest
}

export const MOCK_PROMPT_TEMPLATES: MockPromptTemplate[] = [];

export function findAgentById(id: string) { return MOCK_AI_AGENTS.find((a) => a.id === id); }
export function findPromptById(id: string) { return MOCK_PROMPT_TEMPLATES.find((p) => p.id === id); }
