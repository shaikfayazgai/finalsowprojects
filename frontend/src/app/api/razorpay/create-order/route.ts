export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    const { amount, currency = "INR", receipt, notes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency,
      receipt,
      notes,
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: err?.message ?? "Order creation failed" }, { status: 500 });
  }
}
