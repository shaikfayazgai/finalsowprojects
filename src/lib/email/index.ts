import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "noreply@glimmora.com";

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
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: FROM,
      to: options.to,
      subject: options.subject,
      ...(options.html ? { html: options.html } : { react: options.react! }),
    };

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error("[sendEmail] Resend error:", error);
      return { success: false };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[sendEmail] unexpected error:", err);
    return { success: false };
  }
}
