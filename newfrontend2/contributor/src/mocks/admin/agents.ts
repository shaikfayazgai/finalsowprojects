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

export const MOCK_AI_AGENTS: MockAIAgent[] = [
  {
    id: "ag-sow",
    name: "SOW Intake Assistant",
    shortName: "SOW Intake",
    description: "Normalizes uploaded SOW documents and surfaces risk + compliance flags.",
    portal: "enterprise",
    status: "enabled",
    modelId: "claude-haiku-4-5",
    activePromptId: "pr-sow-intake",
    activePromptVersion: 3,
    recentInvocations24h: 24,
    avgLatencyMs: 1900,
    errors24h: 0,
  },
  {
    id: "ag-decomp",
    name: "Decomposition Assistant",
    shortName: "Decomposition",
    description: "Suggests milestone + task breakdown from approved SOWs.",
    portal: "enterprise",
    status: "enabled",
    modelId: "claude-sonnet-4-6",
    activePromptId: "pr-decomp",
    activePromptVersion: 2,
    recentInvocations24h: 18,
    avgLatencyMs: 3200,
    errors24h: 0,
  },
  {
    id: "ag-support",
    name: "Contributor Support Assistant",
    shortName: "Contributor Support",
    description: "Helps contributors triage their own questions before opening a ticket.",
    portal: "contributor",
    status: "enabled",
    modelId: "claude-haiku-4-5",
    activePromptId: "pr-supp",
    activePromptVersion: 5,
    recentInvocations24h: 142,
    avgLatencyMs: 1100,
    errors24h: 2,
  },
  {
    id: "ag-review",
    name: "Review Assistant",
    shortName: "Review",
    description: "Drafts rubric-aligned score suggestions for mentor review.",
    portal: "mentor",
    status: "enabled",
    modelId: "claude-sonnet-4-6",
    activePromptId: "pr-rev-rubric",
    activePromptVersion: 4,
    recentInvocations24h: 142,
    avgLatencyMs: 2100,
    errors24h: 0,
    overrideStats: { acceptedAsIs: 61, modified: 28, overridden: 11 },
  },
];

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

export const MOCK_PROMPT_TEMPLATES: MockPromptTemplate[] = [
  {
    id: "pr-sow-intake",
    agentId: "ag-sow",
    name: "sow-intake.normalize",
    variables: ["{{rawDocText}}", "{{tenantContext}}"],
    expectedSchema: '{ summary, sections[], risks[], complianceFlags[] }',
    versions: [
      { version: 3, status: "active",   activatedAt: "2026-04-22T09:00:00Z", author: "Priyanka Bansal", changelog: "improved section detection on appendices", body: "You are a SOW intake assistant. Read the document and produce a normalized summary, sections list, risks, and compliance flags. ..." },
      { version: 2, status: "inactive", activatedAt: "2026-03-04T09:00:00Z", author: "Priyanka Bansal", changelog: "switched to structured output schema",      body: "..." },
      { version: 1, status: "inactive", activatedAt: "2026-01-30T09:00:00Z", author: "Priyanka Bansal", changelog: "pilot",                                     body: "..." },
    ],
  },
  {
    id: "pr-decomp",
    agentId: "ag-decomp",
    name: "decomposition.propose",
    variables: ["{{sowSummary}}", "{{sowSections}}", "{{historicalSimilarSows}}"],
    expectedSchema: '{ milestones[], tasks[{ skill, estimateHrs }] }',
    versions: [
      { version: 2, status: "active",   activatedAt: "2026-05-04T08:00:00Z", author: "Priyanka Bansal", changelog: "task-estimate calibration",                body: "..." },
      { version: 1, status: "inactive", activatedAt: "2026-03-10T08:00:00Z", author: "Priyanka Bansal", changelog: "pilot",                                     body: "..." },
    ],
  },
  {
    id: "pr-supp",
    agentId: "ag-support",
    name: "contributor-support.triage",
    variables: ["{{question}}", "{{contributorDigitalTwin}}", "{{recentTickets}}"],
    expectedSchema: '{ classification, suggestedAnswers[], suggestedTicketCategory? }',
    versions: [
      { version: 5, status: "active",   activatedAt: "2026-05-10T11:00:00Z", author: "Priyanka Bansal", changelog: "broader FAQ coverage",                     body: "..." },
      { version: 4, status: "inactive", activatedAt: "2026-04-19T11:00:00Z", author: "Priyanka Bansal", changelog: "added safety-report routing",              body: "..." },
      { version: 3, status: "inactive", activatedAt: "2026-03-22T11:00:00Z", author: "Priyanka Bansal", changelog: "guard against PII echo",                   body: "..." },
      { version: 2, status: "inactive", activatedAt: "2026-02-12T11:00:00Z", author: "Priyanka Bansal", changelog: "tone polish",                              body: "..." },
      { version: 1, status: "inactive", activatedAt: "2026-01-22T11:00:00Z", author: "Priyanka Bansal", changelog: "pilot",                                     body: "..." },
    ],
  },
  {
    id: "pr-rev-rubric",
    agentId: "ag-review",
    name: "review-assistant.score-rubric",
    variables: ["{{taskBrief}}", "{{criteria[]}}", "{{evidence[]}}", "{{contributorDigitalTwin}}"],
    expectedSchema: '{ suggestions: [{ criterionId, score, confidence, sources[] }] }',
    versions: [
      { version: 4, status: "active",   activatedAt: "2026-05-24T10:00:00Z", author: "Priyanka Bansal", changelog: "tuned confidence calibration",
        body: "You are a reviewer assistant helping a human mentor grade a task submission.\n\nFor each criterion in {{criteria}}:\n- Score on the criterion's scale\n- Provide a confidence value (0-1)\n- Cite sources from {{evidence}} that justify the score\n\nNever assert as if you are the final judge. The mentor will accept, modify, or override your suggestion. ..." },
      { version: 3, status: "inactive", activatedAt: "2026-05-18T10:00:00Z", author: "Priyanka Bansal", changelog: "broader source attribution", body: "..." },
      { version: 2, status: "inactive", activatedAt: "2026-05-08T10:00:00Z", author: "Priyanka Bansal", changelog: "initial production",         body: "..." },
      { version: 1, status: "inactive", activatedAt: "2026-04-22T10:00:00Z", author: "Priyanka Bansal", changelog: "pilot",                       body: "..." },
    ],
  },
];

export function findAgentById(id: string) { return MOCK_AI_AGENTS.find((a) => a.id === id); }
export function findPromptById(id: string) { return MOCK_PROMPT_TEMPLATES.find((p) => p.id === id); }
