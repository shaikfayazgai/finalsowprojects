/**
 * POST /api/decomposition/plans/:planId/payout-contributors
 *
 * Glimmora disburses to contributors via Razorpay X Payouts.
 * Test mode: skips Razorpay X, reads TaskDefinition directly, sends email.
 * Live mode: PayoutRecord flow → Razorpay X → mark sent → email.
 *
 * Body: { taskId?: string }  — omit to pay all eligible tasks in the plan.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, buildEmailHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RZP_AUTH = Buffer.from(
  `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
).toString("base64");
const RZP_ACCOUNT_NUMBER = process.env.RAZORPAY_X_ACCOUNT_NUMBER ?? "";
// Razorpay X Payouts is live-only — key IDs starting with "rzp_test_" skip the real API.
const IS_TEST_MODE = (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_");

async function rzpPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.razorpay.com${path}`, {
    method: "POST",
    headers: { Authorization: `Basic ${RZP_AUTH}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { description?: string } };
    throw new Error(err?.error?.description ?? `Razorpay error ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function createContact(userId: string, name: string, email: string): Promise<string> {
  const contact = await rzpPost("/v1/contacts", {
    name,
    email,
    type: "vendor",
    reference_id: userId,
  });
  return contact.id as string;
}

async function createFundAccount(
  contactId: string,
  kind: string,
  payload: Record<string, unknown>
): Promise<string> {
  if (kind === "razorpay_x") {
    return payload.fundAccountId as string;
  }
  if (kind === "bank_in") {
    const fa = await rzpPost("/v1/fund_accounts", {
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: payload.accountHolder,
        ifsc: payload.ifsc,
        account_number: payload.accountNumber,
      },
    });
    return fa.id as string;
  }
  if (kind === "upi") {
    const fa = await rzpPost("/v1/fund_accounts", {
      contact_id: contactId,
      account_type: "vpa",
      vpa: { address: payload.vpa },
    });
    return fa.id as string;
  }
  throw new Error(`Unsupported payout method kind: ${kind}`);
}

const inr = (m: number) => "₹" + (m / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });

async function sendPaymentEmail({
  contributorEmail,
  contributorName,
  taskTitle,
  amountMinor,
  externalRef,
}: {
  contributorEmail: string;
  contributorName: string;
  taskTitle: string;
  amountMinor: number;
  externalRef: string;
}) {
  const sentAt = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const html = buildEmailHtml({
    headerColor: "#007A8A",
    footerText: "© Glimmora Technologies Pvt. Ltd. · You received this because you are a registered contributor.",
    bodyHtml: `
      <h2 style="font-size:22px;font-weight:700;color:#0D1B2A;margin:24px 0 8px;">Payment sent</h2>
      <p>Hi <strong>{{name}}</strong>,</p>
      <p>Your payment for the completed task has been processed. Here are the details:</p>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px 24px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#6B7280;font-size:13px;width:40%;">Task</td>
            <td style="padding:6px 0;font-weight:600;color:#0D1B2A;font-size:13px;">{{taskTitle}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6B7280;font-size:13px;">Amount</td>
            <td style="padding:6px 0;font-weight:700;color:#059669;font-size:16px;">{{amount}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6B7280;font-size:13px;">Date &amp; time</td>
            <td style="padding:6px 0;font-weight:600;color:#0D1B2A;font-size:13px;">{{sentAt}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6B7280;font-size:13px;">Reference</td>
            <td style="padding:6px 0;font-family:monospace;color:#374151;font-size:12px;">{{ref}}</td>
          </tr>
        </table>
      </div>
      <p style="color:#6B7280;font-size:13px;">
        The amount will reflect in your registered payout account within 1–2 business days (NEFT/UPI processing time).
        ${IS_TEST_MODE ? "<br/><em style='color:#D97706;'>&#9888; Test mode — this is a simulated payment for demo purposes.</em>" : ""}
      </p>
    `,
    payload: {
      name: contributorName,
      taskTitle,
      amount: inr(amountMinor),
      sentAt,
      ref: externalRef,
    },
  });

  await sendEmail({
    to: process.env.TEST_PAYOUT_EMAIL ?? contributorEmail,
    subject: `Payment of ${inr(amountMinor)} sent — ${taskTitle}`,
    html,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const body = await req.json().catch(() => ({})) as { taskId?: string };
  const taskId = body.taskId;

  if (!IS_TEST_MODE && !RZP_ACCOUNT_NUMBER) {
    return NextResponse.json(
      { error: "RAZORPAY_X_ACCOUNT_NUMBER is not configured" },
      { status: 500 }
    );
  }

  // ── TEST MODE: read TaskDefinition directly — no PayoutRecord needed ──────
  if (IS_TEST_MODE) {
    const taskDefs = await prisma.taskDefinition.findMany({
      where: taskId ? { id: taskId, planId } : { planId },
      include: {
        assignedContributor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    let paid = 0;
    for (const td of taskDefs) {
      const contributor = td.assignedContributor;
      if (!contributor?.email) continue;
      const name = `${contributor.firstName ?? ""} ${contributor.lastName ?? ""}`.trim() || contributor.email;
      await sendPaymentEmail({
        contributorEmail: contributor.email,
        contributorName: name,
        taskTitle: td.title ?? td.id,
        amountMinor: (td as unknown as { contributorAmountMinor?: number }).contributorAmountMinor ?? 0,
        externalRef: `test_payout_${td.id}`,
      }).catch(() => {});
      paid++;
    }
    return NextResponse.json({ paid });
  }

  // ── LIVE MODE: PayoutRecord flow ──────────────────────────────────────────
  const payouts = await prisma.payoutRecord.findMany({
    where: {
      status: { in: ["eligible", "released"] },
      deletedAt: null,
      taskDefinition: { planId },
      ...(taskId ? { taskDefinitionId: taskId } : {}),
    },
    include: {
      contributor: { select: { id: true, firstName: true, lastName: true, email: true } },
      taskDefinition: { select: { id: true, title: true } },
    },
  });

  if (payouts.length === 0) {
    return NextResponse.json({ paid: 0 });
  }

  let paid = 0;
  const errors: string[] = [];

  for (const payout of payouts) {
    const { contributor } = payout;
    const name = `${contributor.firstName} ${contributor.lastName}`.trim() || contributor.email;

    const method = await prisma.payoutMethod.findFirst({
      where: { userId: contributor.id, isDefault: true, deletedAt: null },
    });

    if (!method) {
      await prisma.payoutRecord.update({
        where: { id: payout.id },
        data: { status: "failed", failureReason: "No payout method registered", failedAt: new Date() },
      });
      errors.push(`${payout.taskDefinitionId}: no payout method`);
      continue;
    }

    await prisma.payoutRecord.update({
      where: { id: payout.id },
      data: { status: "processing", processingAt: new Date(), payoutMethodId: method.id },
    });

    try {
      const contactId = await createContact(contributor.id, name, contributor.email);
      const fundAccountId = await createFundAccount(
        contactId,
        method.kind,
        method.payload as Record<string, unknown>
      );
      const mode = method.kind === "upi" ? "UPI" : "NEFT";
      const rzpPayout = await rzpPost("/v1/payouts", {
        account_number: RZP_ACCOUNT_NUMBER,
        fund_account_id: fundAccountId,
        amount: payout.amountMinor,
        currency: payout.currency,
        mode,
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: payout.id,
        narration: `Task: ${payout.taskDefinition.title ?? payout.taskDefinitionId}`,
      });

      const externalRef = rzpPayout.id as string;

      await prisma.payoutRecord.update({
        where: { id: payout.id },
        data: { status: "sent", sentAt: new Date(), externalRef },
      });

      paid++;

      await sendPaymentEmail({
        contributorEmail: contributor.email,
        contributorName: name,
        taskTitle: payout.taskDefinition.title ?? payout.taskDefinitionId,
        amountMinor: payout.amountMinor,
        externalRef,
      }).catch(() => {});
    } catch (e) {
      await prisma.payoutRecord.update({
        where: { id: payout.id },
        data: {
          status: "eligible",
          failureReason: e instanceof Error ? e.message : "Payout failed",
          failedAt: new Date(),
        },
      });
      errors.push(`${payout.taskDefinitionId}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return NextResponse.json({
    paid,
    ...(errors.length ? { errors } : {}),
  });
}
