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
    otp_email: { code: "000000", expiryMinutes: "5" },
    sow_stage_activated: {
      approverName: "",
      stageName: "Legal / Compliance Review",
      sowTitle: "",
      slaDeadline: "5 business days",
      sowUrl: "#",
    },
    sow_stage_approved: {
      recipientName: "",
      stageName: "Business Owner Review",
      approverName: "",
      sowTitle: "",
      nextStageName: "GlimmoraTeam Commercial Review",
      sowUrl: "#",
    },
    sow_changes_requested: {
      recipientName: "",
      stageName: "Legal / Compliance Review",
      reason: "",
      sowTitle: "",
      sowUrl: "#",
    },
    sow_fully_approved: {
      adminName: "",
      sowTitle: "",
      approvedAt: "",
      sowUrl: "#",
    },
    welcome_contributor: { firstName: "", loginUrl: "#", onboardingUrl: "#" },
    welcome_enterprise: { firstName: "", orgName: "", dashboardUrl: "#" },
    welcome_reviewer: {
      firstName: "",
      loginEmail: "",
      tempPassword: "",
      orgName: "GlimmoraTeam",
      dashboardUrl: "#",
      supportUrl: "#",
    },
    reviewer_invitation: {
      reviewerName: "",
      inviterName: "",
      inviterOrg: "",
      loginEmail: "",
      registerUrl: "#",
      expiryDays: "7",
      personalNote: "",
    },
    forgot_password: { userName: "", resetLink: "#", expiryMinutes: "30" },
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
