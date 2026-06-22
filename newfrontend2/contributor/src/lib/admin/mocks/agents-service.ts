/**
 * Admin AI agents + prompts mock service — localStorage overlay.
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import {
  MOCK_AI_AGENTS,
  MOCK_PROMPT_TEMPLATES,
  type AgentStatus,
  type MockAIAgent,
  type MockPromptTemplate,
  type MockPromptVersion,
} from "@/mocks/admin/agents";

const agentOverlay = createOverlayStore<MockAIAgent>("glimmora.mock.adminAgents.v1");
const promptOverlay = createOverlayStore<MockPromptTemplate>("glimmora.mock.adminPrompts.v1");

export const adminAgentsOverlays = { agents: agentOverlay, prompts: promptOverlay };

export const AGENT_MODEL_OPTIONS = [
  "claude-haiku-4-5",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
] as const;

function listAgentsMerged(): MockAIAgent[] {
  return applyOverlay(MOCK_AI_AGENTS, agentOverlay.read());
}

function listPromptsMerged(): MockPromptTemplate[] {
  return applyOverlay(MOCK_PROMPT_TEMPLATES, promptOverlay.read());
}

export function listAdminAgents(): MockAIAgent[] {
  return listAgentsMerged();
}

export function getAdminAgent(id: string): MockAIAgent | undefined {
  return listAgentsMerged().find((a) => a.id === id);
}

export function listAdminPrompts(): MockPromptTemplate[] {
  return listPromptsMerged();
}

export function getAdminPrompt(id: string): MockPromptTemplate | undefined {
  return listPromptsMerged().find((p) => p.id === id);
}

export function setAgentStatus(id: string, status: AgentStatus): MockAIAgent | undefined {
  if (!getAdminAgent(id)) return undefined;
  agentOverlay.patch(id, { status });
  return getAdminAgent(id);
}

export function setAgentModel(id: string, modelId: string): MockAIAgent | undefined {
  if (!getAdminAgent(id)) return undefined;
  agentOverlay.patch(id, { modelId });
  return getAdminAgent(id);
}

function syncAgentPromptVersion(agentId: string, promptId: string, version: number): void {
  const agent = getAdminAgent(agentId);
  if (!agent || agent.activePromptId !== promptId) return;
  agentOverlay.patch(agentId, { activePromptVersion: version, activePromptId: promptId });
}

function activatePromptVersion(
  prompt: MockPromptTemplate,
  targetVersion: number,
  author: string,
): MockPromptTemplate {
  const versions: MockPromptVersion[] = prompt.versions.map((v) => ({
    ...v,
    status: v.version === targetVersion ? "active" as const : "inactive" as const,
    ...(v.version === targetVersion ? { activatedAt: new Date().toISOString() } : {}),
  }));
  promptOverlay.patch(prompt.id, { versions });
  syncAgentPromptVersion(prompt.agentId, prompt.id, targetVersion);
  return getAdminPrompt(prompt.id)!;
}

export function rollbackPromptVersion(
  promptId: string,
  targetVersion: number,
  author: string,
): MockPromptTemplate | undefined {
  const prompt = getAdminPrompt(promptId);
  if (!prompt) return undefined;
  const target = prompt.versions.find((v) => v.version === targetVersion);
  if (!target || target.status === "active") return undefined;
  return activatePromptVersion(prompt, targetVersion, author);
}

export function savePromptNewVersion(
  promptId: string,
  body: string,
  author: string,
  changelog: string,
): MockPromptTemplate | undefined {
  const prompt = getAdminPrompt(promptId);
  if (!prompt || body.trim().length < 10) return undefined;

  const nextVersion = Math.max(...prompt.versions.map((v) => v.version), 0) + 1;
  const newVer: MockPromptVersion = {
    version: nextVersion,
    status: "active",
    activatedAt: new Date().toISOString(),
    author,
    changelog: changelog.trim() || "Manual edit",
    body: body.trim(),
  };
  const versions: MockPromptVersion[] = [
    newVer,
    ...prompt.versions.map((v) => ({ ...v, status: "inactive" as const })),
  ];
  promptOverlay.patch(promptId, { versions });
  syncAgentPromptVersion(prompt.agentId, promptId, nextVersion);
  return getAdminPrompt(promptId);
}
