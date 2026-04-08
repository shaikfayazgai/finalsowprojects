import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { createElement } from "react";

import SowStageActivated from "@/emails/sow-stage-activated";
import SowStageApproved from "@/emails/sow-stage-approved";
import SowChangesRequested from "@/emails/sow-changes-requested";
import SowFullyApproved from "@/emails/sow-fully-approved";
import WelcomeContributor from "@/emails/welcome-contributor";
import WelcomeEnterprise from "@/emails/welcome-enterprise";

const bodySchema = z.object({
  event: z.enum([
    "sow_stage_activated",
    "sow_stage_approved",
    "sow_changes_requested",
    "sow_fully_approved",
    "welcome_contributor",
    "welcome_enterprise",
  ]),
  payload: z.record(z.string(), z.string()),
  /** Override recipient; falls back to session user email */
  to: z.string().email().optional(),
  /** Optional custom subject/colors from the template store (passed from client) */
  subject: z.string().optional(),
  headerColor: z.string().optional(),
  logoUrl: z.string().optional(),
  footerText: z.string().optional(),
  /** Custom HTML body — when present, bypasses the React component and renders directly */
  bodyHtml: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const { event, payload, to, subject, headerColor, logoUrl, footerText, bodyHtml } = body;
  const recipient = to ?? session.user.email;

  // If a custom bodyHtml was provided from the template editor, interpolate variables
  // and send it as a styled HTML email instead of the React component.
  if (bodyHtml) {
    const interpolated = bodyHtml.replace(/\{\{(\w+)\}\}/g, (_, k) => payload[k] ?? `{{${k}}}`);
    const color = headerColor ?? "#A67763";
    const footer = footerText ?? "© Glimmora Technologies Pvt. Ltd.";
    const logoTag = logoUrl
      ? `<img src="${logoUrl}" alt="Glimmora" style="height:32px;" />`
      : `<span style="font-size:20px;font-weight:700;color:#fff;">Glimmora</span>`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="background:#f4f0ed;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <div style="background:${color};padding:24px 40px;">${logoTag}</div>
    <div style="padding:32px 40px;font-size:15px;line-height:1.65;color:#374151;">${interpolated}</div>
    <div style="border-top:1px solid #f0ece8;padding:16px 40px;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">${footer}</p>
    </div>
  </div>
</body>
</html>`;

    const emailSubjectResolved = subject ?? event.replace(/_/g, " ");
    const result = await sendEmail({ to: recipient, subject: emailSubjectResolved, html });
    return NextResponse.json(result);
  }

  const sharedStyle = { headerColor, logoUrl, footerText };

  let emailSubject: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reactElement: any;

  switch (event) {
    case "sow_stage_activated":
      emailSubject = subject ?? `Action Required: ${payload.stageName} review for "${payload.sowTitle}"`;
      reactElement = createElement(SowStageActivated, {
        approverName: payload.approverName ?? "Approver",
        stageName: payload.stageName ?? "Review Stage",
        sowTitle: payload.sowTitle ?? "SOW",
        slaDeadline: payload.slaDeadline ?? "N/A",
        sowUrl: payload.sowUrl ?? "#",
        ...sharedStyle,
      });
      break;

    case "sow_stage_approved":
      emailSubject = subject ?? `${payload.stageName} approved for "${payload.sowTitle}"`;
      reactElement = createElement(SowStageApproved, {
        recipientName: payload.recipientName ?? "User",
        stageName: payload.stageName ?? "Review Stage",
        approverName: payload.approverName ?? "Approver",
        sowTitle: payload.sowTitle ?? "SOW",
        sowUrl: payload.sowUrl ?? "#",
        nextStageName: payload.nextStageName,
        ...sharedStyle,
      });
      break;

    case "sow_changes_requested":
      emailSubject = subject ?? `Changes requested on "${payload.sowTitle}" — ${payload.stageName}`;
      reactElement = createElement(SowChangesRequested, {
        recipientName: payload.recipientName ?? "User",
        stageName: payload.stageName ?? "Review Stage",
        reason: payload.reason ?? "Please review and address the feedback.",
        sowTitle: payload.sowTitle ?? "SOW",
        sowUrl: payload.sowUrl ?? "#",
        ...sharedStyle,
      });
      break;

    case "sow_fully_approved":
      emailSubject = subject ?? `SOW Approved ✓ — "${payload.sowTitle}"`;
      reactElement = createElement(SowFullyApproved, {
        adminName: payload.adminName ?? "Admin",
        sowTitle: payload.sowTitle ?? "SOW",
        approvedAt: payload.approvedAt ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        sowUrl: payload.sowUrl ?? "#",
        ...sharedStyle,
      });
      break;

    case "welcome_contributor":
      emailSubject = subject ?? `Welcome to Glimmora, ${payload.firstName}!`;
      reactElement = createElement(WelcomeContributor, {
        firstName: payload.firstName ?? "Contributor",
        loginUrl: payload.loginUrl ?? "/auth/login",
        onboardingUrl: payload.onboardingUrl ?? "/contributor/onboarding",
        ...sharedStyle,
      });
      break;

    case "welcome_enterprise":
      emailSubject = subject ?? `Welcome to Glimmora — ${payload.orgName} is ready`;
      reactElement = createElement(WelcomeEnterprise, {
        firstName: payload.firstName ?? "Admin",
        orgName: payload.orgName ?? "Your Organization",
        dashboardUrl: payload.dashboardUrl ?? "/enterprise/dashboard",
        ...sharedStyle,
      });
      break;
  }

  const result = await sendEmail({ to: recipient, subject: emailSubject, react: reactElement });
  return NextResponse.json(result);
}
