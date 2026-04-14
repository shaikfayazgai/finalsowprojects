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
  | "welcome_reviewer"
  | "otp_email"
  | "reviewer_invitation";

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
  welcome_reviewer: {
    id: "welcome_reviewer",
    name: "Welcome — Reviewer",
    description: "Sent to a newly onboarded reviewer with login credentials and a prompt to reset their password.",
    subject: "Welcome to GlimmoraTeam, {{firstName}} — Your reviewer account is ready",
    headerColor: "#4D5741",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi <strong>{{firstName}}</strong>,</p>
<p>Welcome to <strong>GlimmoraTeam</strong>! Your reviewer account has been created and you're ready to start making an impact.</p>
<p>Use the credentials below to log in for the first time:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F7F5;border-radius:12px;margin:20px 0 8px;overflow:hidden;">
  <tr style="border-bottom:1px solid #EDE8E3;">
    <td style="padding:13px 20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;width:130px;">Login Email</td>
    <td style="padding:13px 20px;font-size:14px;font-weight:500;color:#0D1B2A;">{{loginEmail}}</td>
  </tr>
  <tr>
    <td style="padding:13px 20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Temp Password</td>
    <td style="padding:13px 20px;font-size:15px;font-weight:700;color:#4D5741;font-family:'Courier New',Courier,monospace;letter-spacing:2px;">{{tempPassword}}</td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F3;border:1px solid #F0DDD0;border-radius:10px;margin:0 0 24px;">
  <tr>
    <td style="padding:14px 20px;">
      <p style="font-size:13px;font-weight:700;color:#92400E;margin:0 0 4px;padding:0;">⚠ Reset your password on first login</p>
      <p style="font-size:13px;color:#374151;line-height:1.6;margin:0;padding:0;">For your security, you will be prompted to set a new password the first time you sign in. Do not share these credentials with anyone.</p>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F3;border-radius:12px;margin:0 0 24px;overflow:hidden;">
  <tr>
    <td style="padding:18px 24px;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#707867;margin:0 0 12px;">As a Reviewer, you will</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;font-size:13px;color:#313829;line-height:1.6;"><span style="color:#4D5741;font-weight:700;margin-right:8px;">✓</span>Review deliverables and evidence packs submitted by contributors</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#313829;line-height:1.6;"><span style="color:#4D5741;font-weight:700;margin-right:8px;">✓</span>Provide quality assessments and approval decisions</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#313829;line-height:1.6;"><span style="color:#4D5741;font-weight:700;margin-right:8px;">✓</span>Flag rework requests when standards are not met</td></tr>
        <tr><td style="padding:5px 0;font-size:13px;color:#313829;line-height:1.6;"><span style="color:#4D5741;font-weight:700;margin-right:8px;">✓</span>Participate in milestone sign-off workflows</td></tr>
      </table>
    </td>
  </tr>
</table>

<p style="text-align:center;margin:28px 0;">
  <a href="{{dashboardUrl}}" style="display:inline-block;background:#4D5741;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;padding:14px 32px;">Log In & Reset Password →</a>
</p>

<p style="font-size:13px;color:#6b7280;">Need help? Visit our <a href="{{supportUrl}}" style="color:#4D5741;">support centre</a> or reply to this email.</p>`,
    footerText: "© Glimmora Technologies Pvt. Ltd. · You received this because you were onboarded as a reviewer on GlimmoraTeam.",
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["firstName", "loginEmail", "tempPassword", "orgName", "dashboardUrl", "supportUrl"],
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
  reviewer_invitation: {
    id: "reviewer_invitation",
    name: "Reviewer Invitation",
    description: "Sent when a reviewer account is created — includes temporary login credentials.",
    subject: "You've been added as a Reviewer on GlimmoraTeam",
    headerColor: "#5B3A29",
    logoUrl: DEFAULT_LOGO,
    bodyHtml: `<p>Hi <strong>{{reviewerName}}</strong>,</p>
<p><strong>{{inviterName}}</strong> from <strong>{{inviterOrg}}</strong> has added you as a <strong>Reviewer</strong> on the GlimmoraTeam platform.</p>
<p>Your account has been created. Use the credentials below to log in for the first time:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F7F5;border-radius:12px;margin:16px 0 24px;">
  <tr style="border-bottom:1px solid #EDE8E3;">
    <td style="padding:12px 20px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;width:140px;">Designation</td>
    <td style="padding:12px 20px;font-size:14px;font-weight:500;color:#0D1B2A;">{{designation}}</td>
  </tr>
  <tr style="border-bottom:1px solid #EDE8E3;">
    <td style="padding:12px 20px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Login Email</td>
    <td style="padding:12px 20px;font-size:14px;font-weight:500;color:#0D1B2A;">{{loginEmail}}</td>
  </tr>
  <tr>
    <td style="padding:12px 20px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Temp Password</td>
    <td style="padding:12px 20px;font-size:14px;font-weight:700;color:#92400E;font-family:'Courier New',monospace;">{{tempPassword}}</td>
  </tr>
</table>

<p style="background:#FFF8F3;border:1px solid #F0DDD0;border-radius:10px;padding:14px 20px;font-size:13px;color:#374151;">
  <strong style="color:#92400E;">⚠ Security:</strong> You will be asked to change your password on first login. Do not share these credentials with anyone.
</p>

<p><strong>As a reviewer you will:</strong></p>
<ul style="padding-left:20px;margin:8px 0 24px;color:#374151;font-size:14px;line-height:1.8;">
  <li>Review deliverables and evidence packs submitted by contributors</li>
  <li>Provide quality assessments and approval decisions</li>
  <li>Flag rework requests when standards are not met</li>
  <li>Participate in milestone sign-off workflows</li>
</ul>

<p style="text-align:center;"><a href="{{loginUrl}}" style="display:inline-block;background:#5B3A29;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;padding:14px 32px;">Log In to GlimmoraTeam →</a></p>`,
    footerText: "© Glimmora Technologies Pvt. Ltd. · You received this because you were added as a reviewer on GlimmoraTeam.",
    isActive: true,
    lastEditedAt: new Date().toISOString(),
    variables: ["reviewerName", "designation", "inviterName", "inviterOrg", "loginEmail", "tempPassword", "loginUrl"],
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
    {
      name: "gt-email-templates",
      version: 1,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<EmailTemplateState>),
        // Always include all DEFAULT_TEMPLATES so newly added templates
        // are never missing from an older persisted localStorage state.
        templates: {
          ...DEFAULT_TEMPLATES,
          ...((persisted as Partial<EmailTemplateState>)?.templates ?? {}),
        },
      }),
    }
  )
);
