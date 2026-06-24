import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ message: "Razorpay credentials not configured" }, { status: 500 });
  }

  try {
    const body = await req.json() as { amountMinor?: number; currency?: string; notes?: Record<string, string> };
    const { amountMinor, currency = "INR", notes } = body;

    if (!amountMinor || amountMinor <= 0) {
      return NextResponse.json({ message: "amountMinor must be a positive integer (paise)" }, { status: 400 });
    }

    // Razorpay per-order cap — default 5,00,000 INR; can be raised via your Razorpay dashboard.
    const maxMinor = Number(process.env.RAZORPAY_MAX_AMOUNT_MINOR ?? 50_000_000);
    if (amountMinor > maxMinor) {
      const cap = "₹" + (maxMinor / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
      return NextResponse.json(
        { message: `Amount exceeds the per-transaction limit (${cap}). Use a partial payment or ask your Razorpay account manager to raise the limit.` },
        { status: 422 },
      );
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify({ amount: amountMinor, currency, notes: notes ?? {} }),
    });

    const data = await rzpRes.json() as { id?: string; amount?: number; currency?: string; error?: { description?: string } };

    if (!rzpRes.ok) {
      return NextResponse.json({ message: data?.error?.description ?? "Razorpay order creation failed" }, { status: 502 });
    }

    return NextResponse.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ message }, { status: 500 });
  }
}
