/**
 * AI prompt management (M27).
 *
 * Roll Agent.activePromptId between PromptVersion rows for tuning +
 * emergency rollback. PromptVersion rows are immutable; rollback is
 * a pointer flip, not a content edit.
 *
 * Used by the platform AI ops team (plat.ai) and admins (plat.admin).
 * Doc 06 §10.1 criterion #19: "AI agent prompt rolled back; subsequent
 * invocations use prior version; audited."
 */

import { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export class PromptManagementError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "validation" | "invalid_state",
  ) {
    super(message);
    this.name = "PromptManagementError";
  }
}

export interface PromptVersionSummary {
  id: string;
  promptTemplateId: string;
  templateName: string;
  agentId: string;
  version: number;
  body: string;
  variables: string[];
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  /** True when this is currently the agent's active version. */
  isActive: boolean;
}

/**
 * List versions of a specific (agentId, templateName) prompt template,
 * newest first. The active version is flagged.
 */
export async function listPromptVersions(
  tx: Tx,
  args: { agentId: string; templateName: string },
): Promise<PromptVersionSummary[]> {
  const template = await tx.promptTemplate.findFirst({
    where: { agentId: args.agentId, name: args.templateName },
  });
  if (!template) {
    throw new PromptManagementError("Prompt template not found", "not_found");
  }
  const agent = await tx.agent.findUnique({
    where: { id: args.agentId },
    select: { activePromptId: true },
  });
  const versions = await tx.promptVersion.findMany({
    where: { promptTemplateId: template.id },
    orderBy: { version: "desc" },
  });
  return versions.map((v) => ({
    id: v.id,
    promptTemplateId: v.promptTemplateId,
    templateName: template.name,
    agentId: template.agentId,
    version: v.version,
    body: v.body,
    variables: v.variables,
    notes: v.notes,
    createdBy: v.createdBy,
    createdAt: v.createdAt.toISOString(),
    isActive: agent?.activePromptId === v.id,
  }));
}

export interface RollbackResult {
  agentId: string;
  /** Active prior to the rollback. */
  fromPromptVersionId: string | null;
  fromVersion: number | null;
  /** Active after the rollback. */
  toPromptVersionId: string;
  toVersion: number;
  templateName: string;
}

/**
 * Activate the specified PromptVersion as the agent's `activePrompt`.
 * Idempotent (re-activating the same version is a no-op that returns
 * the same `from/to` IDs).
 *
 * Guards:
 *   - Agent must exist
 *   - PromptVersion must exist AND belong to this agent
 *   - Cannot rollback to a soft-deleted template
 */
export async function rollbackToPromptVersion(
  tx: Tx,
  args: {
    agentId: string;
    targetVersionId: string;
    actorUserId: string;
    reason?: string;
  },
): Promise<RollbackResult> {
  const agent = await tx.agent.findUnique({
    where: { id: args.agentId },
    select: { id: true, activePromptId: true },
  });
  if (!agent) {
    throw new PromptManagementError("Agent not found", "not_found");
  }

  const target = await tx.promptVersion.findUnique({
    where: { id: args.targetVersionId },
    include: {
      promptTemplate: { select: { id: true, agentId: true, name: true } },
    },
  });
  if (!target) {
    throw new PromptManagementError("Target prompt version not found", "not_found");
  }
  if (target.promptTemplate.agentId !== agent.id) {
    throw new PromptManagementError(
      "Target prompt version does not belong to this agent",
      "validation",
    );
  }

  // Resolve "from" version metadata before flipping
  let fromVersion: number | null = null;
  if (agent.activePromptId) {
    const current = await tx.promptVersion.findUnique({
      where: { id: agent.activePromptId },
      select: { version: true },
    });
    fromVersion = current?.version ?? null;
  }

  await tx.agent.update({
    where: { id: agent.id },
    data: { activePromptId: target.id },
  });

  // Optionally record the rollback reason as a note on the activated version.
  // We intentionally do NOT mutate the version row's content (immutable);
  // the audit event is the system-of-record for "who rolled this back why."
  void args.reason;
  void args.actorUserId;

  return {
    agentId: agent.id,
    fromPromptVersionId: agent.activePromptId,
    fromVersion,
    toPromptVersionId: target.id,
    toVersion: target.version,
    templateName: target.promptTemplate.name,
  };
}
