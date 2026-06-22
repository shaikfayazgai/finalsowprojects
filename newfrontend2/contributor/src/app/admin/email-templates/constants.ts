import type { RefObject } from "react";
import type { EmailTemplateId } from "@/lib/stores/email-template-store";

export const TEMPLATE_ORDER: EmailTemplateId[] = [
  "otp_email",
  "forgot_password",
  "sow_stage_activated",
  "sow_stage_approved",
  "sow_changes_requested",
  "sow_fully_approved",
  "welcome_contributor",
  "welcome_enterprise",
  "welcome_reviewer",
  "reviewer_invitation",
];

export const CATEGORY_LABELS: Record<EmailTemplateId, string> = {
  otp_email: "Authentication",
  forgot_password: "Authentication",
  sow_stage_activated: "SOW Pipeline",
  sow_stage_approved: "SOW Pipeline",
  sow_changes_requested: "SOW Pipeline",
  sow_fully_approved: "SOW Pipeline",
  welcome_contributor: "Onboarding",
  welcome_enterprise: "Onboarding",
  welcome_reviewer: "Onboarding",
  reviewer_invitation: "Review",
};

export const VAR_FRIENDLY: Record<string, string> = {
  approverName: "Approver's Name",
  recipientName: "Recipient's Name",
  adminName: "Admin's Name",
  firstName: "First Name",
  stageName: "Stage Name",
  sowTitle: "Document Title",
  sowUrl: "Document Link",
  slaDeadline: "Review Deadline",
  nextStageName: "Next Stage",
  reason: "Change Reason",
  approvedAt: "Approval Date",
  orgName: "Organization Name",
  dashboardUrl: "Dashboard Link",
  loginUrl: "Login Link",
  onboardingUrl: "Onboarding Link",
  supportUrl: "Support Link",
  loginEmail: "Login Email",
  tempPassword: "Temporary Password",
  code: "Verification Code",
  expiryMinutes: "Code Expiry (minutes)",
  reviewerName: "Reviewer Name",
  designation: "Designation",
  inviterName: "Inviter Name",
  inviterOrg: "Inviter Organization",
  resetLink: "Password Reset Link",
  userName: "User Name",
};

export function getTestPayload(id: EmailTemplateId): Record<string, string> {
  const payloads: Record<EmailTemplateId, Record<string, string>> = {
    otp_email: { code: "483921", expiryMinutes: "5" },
    sow_stage_activated: {
      approverName: "Sarah Chen",
      stageName: "Legal / Compliance Review",
      sowTitle: "Cloud-Native EHR Migration",
      slaDeadline: "5 business days",
      sowUrl: "#",
    },
    sow_stage_approved: {
      recipientName: "Enterprise Admin",
      stageName: "Business Owner Review",
      approverName: "Sarah Chen",
      sowTitle: "Cloud-Native EHR Migration",
      nextStageName: "GlimmoraTeam Commercial Review",
      sowUrl: "#",
    },
    sow_changes_requested: {
      recipientName: "Enterprise Admin",
      stageName: "Legal / Compliance Review",
      reason: "Please clarify the IP ownership clause in Section 4.",
      sowTitle: "Cloud-Native EHR Migration",
      sowUrl: "#",
    },
    sow_fully_approved: {
      adminName: "Enterprise Admin",
      sowTitle: "AI-Driven Supply Chain Optimizer",
      approvedAt: "April 8, 2026",
      sowUrl: "#",
    },
    welcome_contributor: { firstName: "Alex", loginUrl: "#", onboardingUrl: "#" },
    welcome_enterprise: { firstName: "Priya", orgName: "Luminary Logistics", dashboardUrl: "#" },
    welcome_reviewer: {
      firstName: "Jordan",
      loginEmail: "jordan@glimmora.io",
      tempPassword: "Tmp@9xKq2!",
      orgName: "GlimmoraTeam",
      dashboardUrl: "#",
      supportUrl: "#",
    },
    reviewer_invitation: {
      reviewerName: "Jordan",
      inviterName: "Priya Sharma",
      inviterOrg: "Luminary Logistics",
      loginEmail: "jordan.lee@luminarylogistics.com",
      registerUrl: "https://app.glimmorateam.com/auth/register/reviewer?code=abc123",
      expiryDays: "7",
      personalNote: "",
    },
    forgot_password: { userName: "Sarah Chen", resetLink: "#", expiryMinutes: "30" },
  };
  return payloads[id];
}

export function insertAtCursor(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChangeDraft: (v: string) => void,
) {
  const ta = ref.current;
  if (!ta) return;
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? ta.value.length;
  const newVal = ta.value.substring(0, start) + value + ta.value.substring(end);
  onChangeDraft(newVal);
  setTimeout(() => {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = start + value.length;
  }, 0);
}
