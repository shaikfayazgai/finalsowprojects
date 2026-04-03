import type { ApprovalMessage } from "@/types/enterprise";

const STAGE_META = [
  { key: "business",            name: "Business Owner Review",          approverRole: "Enterprise Admin",     approverName: "Enterprise Admin" },
  { key: "glimmora_commercial", name: "GlimmoraTeam Commercial Review", approverRole: "GlimmoraTeam Admin",   approverName: "GlimmoraTeam Admin" },
  { key: "legal",               name: "Legal / Compliance Review",      approverRole: "Enterprise Admin",     approverName: "Enterprise Admin" },
  { key: "security",            name: "Security Review",                approverRole: "Enterprise Admin",     approverName: "Enterprise Admin" },
  { key: "final",               name: "Final Sign-off",                 approverRole: "Enterprise Admin",     approverName: "Enterprise Admin" },
];

type MsgBase = Omit<ApprovalMessage, "id" | "sentAt" | "read">;

export function buildActivatedMessage(sowId: string, stageIndex: number, sowTitle: string): MsgBase {
  const stage = STAGE_META[stageIndex];
  return {
    sowId,
    stageIndex,
    stageKey: stage.key,
    type: "stage_activated",
    senderName: "System",
    senderRole: "Automated",
    recipientName: stage.approverName,
    recipientRole: stage.approverRole,
    subject: `Action Required: Stage ${stageIndex + 1} — ${stage.name}`,
    body: `You have been assigned as the Stage ${stageIndex + 1} reviewer for SOW "${sowTitle}". Please review the document, complete the checklist, and provide your digital signature to approve or request changes.`,
  };
}

export function buildApprovedMessage(sowId: string, stageIndex: number, sowTitle: string, submitterName: string): MsgBase {
  const stage = STAGE_META[stageIndex];
  const nextStage = STAGE_META[stageIndex + 1];
  return {
    sowId,
    stageIndex,
    stageKey: stage.key,
    type: "stage_approved",
    senderName: stage.approverName,
    senderRole: stage.approverRole,
    recipientName: submitterName,
    recipientRole: "SOW Submitter",
    subject: `Stage ${stageIndex + 1} Approved — ${stage.name}`,
    body: nextStage
      ? `Stage ${stageIndex + 1} (${stage.name}) has been approved. The SOW "${sowTitle}" has now moved to Stage ${stageIndex + 2}: ${nextStage.name}. The next approver has been notified.`
      : `All 5 approval stages have been completed. The SOW "${sowTitle}" is fully signed off and ready for decomposition and project creation.`,
  };
}

export function buildNextApproverMessage(sowId: string, stageIndex: number, sowTitle: string): MsgBase | null {
  const stage = STAGE_META[stageIndex];
  if (!stage) return null;
  return {
    sowId,
    stageIndex,
    stageKey: stage.key,
    type: "stage_activated",
    senderName: "System",
    senderRole: "Automated",
    recipientName: stage.approverName,
    recipientRole: stage.approverRole,
    subject: `Action Required: Stage ${stageIndex + 1} — ${stage.name}`,
    body: `The previous stage has been approved. You are now the designated reviewer for Stage ${stageIndex + 1} (${stage.name}) of SOW "${sowTitle}". Please log in to complete your review.`,
  };
}

export function buildChangesRequestedMessage(
  sowId: string,
  stageIndex: number,
  sowTitle: string,
  submitterName: string,
  feedbackNote: string,
  sectionRef?: string
): MsgBase {
  const stage = STAGE_META[stageIndex];
  return {
    sowId,
    stageIndex,
    stageKey: stage.key,
    type: "changes_requested",
    senderName: stage.approverName,
    senderRole: stage.approverRole,
    recipientName: submitterName,
    recipientRole: "SOW Submitter",
    subject: `Changes Requested — Stage ${stageIndex + 1}: ${stage.name}`,
    body: feedbackNote,
    sectionRef,
  };
}
