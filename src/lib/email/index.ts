import nodemailer from "nodemailer";
import type { ReactElement } from "react";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM ?? `GlimmoraTeam <${process.env.GMAIL_USER}>`;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const html = options.html ?? (options.react
      ? (await import("react-dom/server")).renderToStaticMarkup(options.react)
      : "");

    const info = await transporter.sendMail({
      from: FROM,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[sendEmail] error:", err);
    return { success: false };
  }
}
