import nodemailer from "nodemailer";
import type { ReactElement } from "react";
import type { Transporter } from "nodemailer";
import dns from "node:dns";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* ignore on older runtimes */
}

function createTransporter(): { transporter: Transporter | null; configError: string | null } {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    return {
      transporter: null,
      configError: "Gmail is not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local.",
    };
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
    tls: { minVersion: "TLSv1.2" },
    // Prefer IPv4 when IPv6/DNS paths are flaky (helps some "ENOTFOUND" / routing cases).
    family: 4,
  });

  return { transporter, configError: null };
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  /** Present when success is false — safe to log, do not expose to end users in production. */
  error?: string;
}

/** Build a professional branded HTML email from a body snippet and template settings. */
export function buildEmailHtml({
  bodyHtml,
  headerColor,
  logoUrl,
  footerText,
  payload = {},
}: {
  bodyHtml: string;
  headerColor: string;
  logoUrl?: string;
  footerText: string;
  payload?: Record<string, string>;
}): string {
  const interpolated = bodyHtml.replace(/\{\{(\w+)\}\}/g, (_, k) => payload[k] ?? `{{${k}}}`);

  const logoTag = logoUrl
    ? `<img src="${logoUrl}" alt="GlimmoraTeam" style="height:36px;display:block;" />`
    : `<span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.3px;font-family:'Poppins',sans-serif;">GlimmoraTeam</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style type="text/css">
    body,table,td,p,h1,h2,h3,span { font-family:'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif !important; }
    a { color:${headerColor};font-weight:600;text-decoration:none; }
    a:hover { text-decoration:underline; }
    p { margin:0 0 16px;padding:0; }
    strong { color:#0D1B2A; }
  </style>
</head>
<body style="background:#F0EDE9;font-family:'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

      <!-- Header -->
      <div style="background:${headerColor};padding:28px 40px 0;">
        ${logoTag}
        <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;margin:10px 0 0;padding:0;">AI-Governed Global Workforce Platform</p>
        <!-- Arc transition -->
        <div style="height:26px;background:#fff;border-radius:50% 50% 0 0/100% 100% 0 0;margin-top:20px;"></div>
      </div>

      <!-- Body -->
      <div style="padding:8px 40px 36px;font-size:15px;line-height:1.8;color:#374151;">
        ${interpolated}
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #EDE8E3;background:#F9F7F5;padding:20px 40px;">
        <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 4px;padding:0;">GlimmoraTeam</p>
        <p style="font-size:11px;color:#9ca3af;margin:0;padding:0;line-height:1.6;">${footerText}</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { transporter, configError } = createTransporter();
  if (!transporter) {
    console.error("[sendEmail]", configError);
    return { success: false, error: configError ?? "SMTP not configured" };
  }

  const from =
    process.env.EMAIL_FROM?.trim() ||
    `GlimmoraTeam <${process.env.GMAIL_USER!.trim()}>`;

  try {
    const html = options.html ?? (options.react
      ? (await import("react-dom/server")).renderToStaticMarkup(options.react)
      : "");

    const info = await transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendEmail] error:", message);
    return { success: false, error: message };
  }
}
