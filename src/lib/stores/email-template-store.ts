import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ── Types ── */

export type EmailTemplateId =
  | "sow_stage_activated"
  | "sow_stage_approved"
  | "sow_changes_requested"
  | "sow_fully_approved"
  | "welcome_contributor"
  | "welcome_enterprise"
  | "otp_email";

export interface EmailTemplate {
  id: EmailTemplateId;
  name: string;
  description: string;
  subject: string;
  headerColor: string;
  logoUrl: string;
  bodyHtml: string;
  footerText: string;
  isActive: boolean;
  lastEditedAt: string;
  /** Available {{variable}} placeholders for this template */
  variables: string[];
}

/* ── Defaults ── */

const DEFAULT_LOGO = "https://glimmora.com/logo.png";
const DEFAULT_FOOTER = "© Glimmora Technologies Pvt. Ltd. · You received this because you are part of an active SOW workflow.";
const DEFAULT_HEADER_COLOR = "#A67763";

export const DEFAULT_TEMPLATES: Record<EmailTemplateId, EmailTemplate> = {
  sow_stage_activated: {
    id: "sow_stage_activated",
    name: "SOW Stage Activated",
    description: "Sent to the assigned approver when their review stage begins.",
    subject: "Action Required: {{stageName}} review for \"{{sowTitle}}\"",
    headerColor: DEFAULT_HEADER_COLOR,
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi {{approverName}},</p>
<p>The <strong>{{stageName}}</strong> approval stage for the SOW <strong>"{{sowTitle}}"</strong> has been activated and is now awaiting your review.</p>
<p>Please complete your review by <strong>{{slaDeadline}}</strong> to keep the approval pipeline on track.</p>
<p><a href="{{sowUrl}}">Review SOW →</a></p>
<p>If you have questions, reply to this email or reach out to your designated contact.</p>`,
    footerText: DEFAULT_FOOTER,
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["approverName", "stageName", "sowTitle", "slaDeadline", "sowUrl"],
  },
  sow_stage_approved: {
    id: "sow_stage_approved",
    name: "SOW Stage Approved",
    description: "Sent to the submitter (and optionally the next approver) when a stage is approved.",
    subject: "{{stageName}} approved for \"{{sowTitle}}\"",
    headerColor: "#2D6A4F",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi {{recipientName}},</p>
<p>Great news! The <strong>{{stageName}}</strong> stage for <strong>"{{sowTitle}}"</strong> has been approved by <strong>{{approverName}}</strong>.</p>
{{#nextStageName}}<p>The SOW has automatically advanced to the <strong>{{nextStageName}}</strong> stage.</p>{{/nextStageName}}
<p><a href="{{sowUrl}}">View SOW status →</a></p>`,
    footerText: DEFAULT_FOOTER,
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["recipientName", "stageName", "approverName", "nextStageName", "sowTitle", "sowUrl"],
  },
  sow_changes_requested: {
    id: "sow_changes_requested",
    name: "Changes Requested",
    description: "Sent to the submitter when a reviewer requests changes.",
    subject: "Changes requested on \"{{sowTitle}}\" — {{stageName}}",
    headerColor: "#92400E",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi {{recipientName}},</p>
<p>The reviewer for the <strong>{{stageName}}</strong> stage has requested changes to the SOW <strong>"{{sowTitle}}"</strong>.</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p>Please address the feedback and resubmit for review.</p>
<p><a href="{{sowUrl}}">View & Update SOW →</a></p>`,
    footerText: DEFAULT_FOOTER,
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["recipientName", "stageName", "reason", "sowTitle", "sowUrl"],
  },
  sow_fully_approved: {
    id: "sow_fully_approved",
    name: "SOW Fully Approved",
    description: "Sent to the enterprise admin when all 5 approval stages are complete.",
    subject: "SOW Approved ✓ — \"{{sowTitle}}\"",
    headerColor: "#1E40AF",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi {{adminName}},</p>
<p>All five approval stages for <strong>"{{sowTitle}}"</strong> have been successfully completed.</p>
<p>The SOW was fully approved on <strong>{{approvedAt}}</strong> and is now ready for project decomposition and team formation.</p>
<p><a href="{{sowUrl}}">View Approved SOW →</a></p>`,
    footerText: DEFAULT_FOOTER,
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["adminName", "sowTitle", "approvedAt", "sowUrl"],
  },
  welcome_contributor: {
    id: "welcome_contributor",
    name: "Welcome — Contributor",
    description: "Sent to a new contributor after successful registration.",
    subject: "Welcome to Glimmora, {{firstName}}!",
    headerColor: "#0F766E",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi {{firstName}},</p>
<p>Welcome to <strong>Glimmora</strong> — the AI-Governed Global Workforce Platform. Your contributor account has been created successfully.</p>
<p>To get started, complete your profile and explore available tasks:</p>
<p><a href="{{onboardingUrl}}">Complete Onboarding →</a></p>
<p>Already done? <a href="{{loginUrl}}">Log in to your dashboard</a>.</p>
<p>We're excited to have you on board!</p>`,
    footerText: "© Glimmora Technologies Pvt. Ltd. · You received this because you registered as a contributor.",
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["firstName", "loginUrl", "onboardingUrl"],
  },
  welcome_enterprise: {
    id: "welcome_enterprise",
    name: "Welcome — Enterprise Admin",
    description: "Sent to a new enterprise admin after successful organization registration.",
    subject: "Welcome to Glimmora — {{orgName}} is ready",
    headerColor: "#A67763",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi {{firstName}},</p>
<p>Your enterprise organization <strong>{{orgName}}</strong> has been successfully registered on <strong>Glimmora</strong>.</p>
<p>You can now upload SOWs, form teams, and manage your entire project delivery lifecycle from your admin console:</p>
<p><a href="{{dashboardUrl}}">Go to Enterprise Dashboard →</a></p>
<p>Need help? Reply to this email or visit our support centre.</p>`,
    footerText: "© Glimmora Technologies Pvt. Ltd. · You received this because you registered an enterprise organization.",
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["firstName", "orgName", "dashboardUrl"],
  },
  otp_email: {
    id: "otp_email",
    name: "Email Verification OTP",
    description: "Sent when a user requests an email verification code.",
    subject: "Your GlimmoraTeam verification code",
    headerColor: "#007A8A",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi there,</p>
<p>Your one-time verification code is valid for <strong>{{expiryMinutes}} minutes</strong>. Do not share this code with anyone.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
  <tr>
    <td align="center" style="background:#F0FAFA;border:2px solid #007A8A;border-radius:14px;padding:28px 20px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#007A8A;margin:0 0 12px;padding:0;">Your Verification Code</p>
      <p style="font-size:44px;font-weight:800;letter-spacing:16px;color:#0D1B2A;font-family:'Courier New',Courier,monospace;margin:0;padding:0;">{{code}}</p>
      <p style="font-size:12px;color:#6b7280;margin:12px 0 0;padding:0;">Expires in {{expiryMinutes}} minutes</p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F3;border:1px solid #F0DDD0;border-radius:10px;">
  <tr>
    <td style="padding:14px 20px;">
      <p style="font-size:13px;font-weight:700;color:#92400E;margin:0 0 4px;padding:0;">⚠ Security Notice</p>
      <p style="font-size:13px;color:#374151;line-height:1.5;margin:0;padding:0;">If you did not request this code, please ignore this email. Never share your verification code with anyone, including GlimmoraTeam support.</p>
    </td>
  </tr>
</table>`,
    footerText: "You received this because you requested email verification on GlimmoraTeam. © Glimmora Technologies Pvt. Ltd.",
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["code", "expiryMinutes"],
  },
};

/* ── Store ── */

interface EmailTemplateState {
  templates: Record<EmailTemplateId, EmailTemplate>;
  updateTemplate: (id: EmailTemplateId, patch: Partial<EmailTemplate>) => void;
  resetToDefault: (id: EmailTemplateId) => void;
  toggleActive: (id: EmailTemplateId) => void;
  getTemplate: (id: EmailTemplateId) => EmailTemplate;
}

export const useEmailTemplateStore = create<EmailTemplateState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,

      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: {
            ...s.templates,
            [id]: { ...s.templates[id], ...patch, lastEditedAt: new Date().toISOString() },
          },
        })),

      resetToDefault: (id) =>
        set((s) => ({
          templates: { ...s.templates, [id]: { ...DEFAULT_TEMPLATES[id] } },
        })),

      toggleActive: (id) =>
        set((s) => ({
          templates: {
            ...s.templates,
            [id]: { ...s.templates[id], isActive: !s.templates[id].isActive, lastEditedAt: new Date().toISOString() },
          },
        })),

      getTemplate: (id) => get().templates[id],
    }),
    { name: "gt-email-templates", version: 1 }
  )
);
