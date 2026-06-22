import type { EnterpriseReviewQueueItem } from "@/lib/enterprise-review/types";

export interface AcceptanceArtifact {
  id: string;
  name: string;
  kind: "doc" | "image" | "test" | "video";
  sizeLabel: string;
}

export interface AcceptanceCriterion {
  id: string;
  label: string;
  met: boolean;
  mentorScore: number;
}

export interface LineageStep {
  stage: string;
  label: string;
  href?: string;
  actor?: string;
  at?: string;
}

export interface AuditEvent {
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface AcceptanceDetailContext {
  mentorName: string;
  mentorNote: string;
  mentorStars: number;
  projectName: string;
  sowTitle: string;
  criteria: AcceptanceCriterion[];
  artifacts: AcceptanceArtifact[];
  lineage: LineageStep[];
  auditEvents: AuditEvent[];
}

const MENTOR_NAMES: Record<string, string> = {
  "mentor-rajesh": "Rajesh M.",
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildAcceptanceDetailContext(
  item: EnterpriseReviewQueueItem,
): AcceptanceDetailContext {
  const h = hash(item.submissionId);
  const mentorName = MENTOR_NAMES[item.mentorReviewerId ?? ""] ?? "Riya M.";
  const mentorStars = 4 + (h % 2);
  const projectSlug = item.taskDefinitionId.split("-").slice(0, 2).join("-");

  const criteria: AcceptanceCriterion[] = [
    { id: "c1", label: "Deliverable matches task brief and scope", met: true, mentorScore: mentorStars },
    { id: "c2", label: "Evidence package is complete and verifiable", met: true, mentorScore: Math.min(5, mentorStars + 1) },
    { id: "c3", label: "No open mentor flags or escalations", met: h % 5 !== 0, mentorScore: mentorStars },
    { id: "c4", label: "Ready for enterprise business sign-off", met: true, mentorScore: mentorStars },
  ];

  const artifactKinds: AcceptanceArtifact["kind"][] = ["doc", "image", "test", "video"];
  const artifacts: AcceptanceArtifact[] = Array.from(
    { length: Math.max(1, item.artifactCount) },
    (_, i) => ({
      id: `art-${i + 1}`,
      name: i === 0 ? `${item.taskTitle} — deliverable.pdf` : `evidence-${i + 1}.${i === 1 ? "png" : i === 2 ? "log" : "md"}`,
      kind: artifactKinds[i % artifactKinds.length],
      sizeLabel: `${120 + (h % 400) + i * 40} KB`,
    }),
  );

  const lineage: LineageStep[] = [
    { stage: "SOW", label: "Helios API Modernisation", href: "/enterprise/sow/sow-acme-2", actor: "Sandeep A.", at: "Apr 12" },
    { stage: "Plan", label: "Phase 1 — API layer", href: "/enterprise/decomposition", actor: "PMO", at: "Apr 18" },
    { stage: "Project", label: projectSlug === "task-1" ? "Helios DS" : "Platform delivery", href: "/enterprise/projects", actor: "Delivery", at: "May 2" },
    { stage: "Task", label: item.taskTitle, href: `/enterprise/projects`, actor: item.contributorName, at: "May 20" },
    { stage: "Mentor", label: "Quality sign-off", actor: mentorName, at: new Date(item.acceptedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" }) },
    { stage: "Acceptance", label: "Enterprise final decision", actor: "Pending", at: "—" },
  ];

  const auditEvents: AuditEvent[] = [
    { at: item.acceptedAt, actor: mentorName, action: "mentor.accept", detail: "Recommended for enterprise acceptance" },
    { at: item.enterpriseReviewerAssignedAt ?? item.acceptedAt, actor: item.enterpriseReviewerId ? "You" : "System", action: item.enterpriseReviewerId ? "enterprise.claim" : "enterprise.notify", detail: item.enterpriseReviewerId ? "Claimed for review" : "Reviewers notified" },
    { at: item.acceptedAt, actor: item.contributorName, action: "contributor.submit", detail: `Version ${item.version} submitted` },
  ];

  return {
    mentorName,
    mentorNote: "Strong submission. All criteria met. Recommend acceptance — billing can proceed after enterprise sign-off.",
    mentorStars,
    projectName: projectSlug === "task-1" ? "Helios DS" : "Acme delivery program",
    sowTitle: "Helios API Modernisation",
    criteria,
    artifacts,
    lineage,
    auditEvents,
  };
}
