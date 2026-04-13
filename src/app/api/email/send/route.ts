import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { sendEmail, buildEmailHtml } from "@/lib/email";
import { DEFAULT_TEMPLATES, type EmailTemplateId } from "@/lib/stores/email-template-store";

const bodySchema = z.object({
  event: z.enum([
    "sow_stage_activated",
    "sow_stage_approved",
    "sow_changes_requested",
    "sow_fully_approved",
    "welcome_contributor",
    "welcome_enterprise",
    "otp_email",
  ]),
  payload: z.record(z.string(), z.string()),
  /** Override recipient; falls back to session user email */
  to: z.string().email().optional(),
  /** Optional overrides from the template store (passed from client) */
  subject: z.string().optional(),
  headerColor: z.string().optional(),
  logoUrl: z.string().optional(),
  footerText: z.string().optional(),
  /** Custom HTML body from the template editor */
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

  const defaults = DEFAULT_TEMPLATES[event as EmailTemplateId];

  // Resolve all values — client overrides take priority, defaults fill the rest
  const resolvedSubject = subject
    ?? defaults.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => payload[k] ?? `{{${k}}}`);
  const resolvedColor = headerColor ?? defaults.headerColor;
  const resolvedFooter = footerText ?? defaults.footerText;
  const resolvedBodyHtml = bodyHtml ?? defaults.bodyHtml;
  const resolvedLogoUrl = logoUrl || defaults.logoUrl || undefined;

  const html = buildEmailHtml({
    bodyHtml: resolvedBodyHtml,
    headerColor: resolvedColor,
    logoUrl: resolvedLogoUrl,
    footerText: resolvedFooter,
    payload,
  });

  const result = await sendEmail({ to: recipient, subject: resolvedSubject, html });
  return NextResponse.json(result);
}
