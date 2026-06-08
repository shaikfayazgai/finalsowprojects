import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emailTo, format, window, tenant } = body;
    if (!emailTo || typeof emailTo !== "string") {
      return NextResponse.json({ success: false, message: "Delivery email required." }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      requestId: `exp-${Date.now()}`,
      message: `Export (${format ?? "csv"}, ${window ?? "last_7d"}, tenant: ${tenant ?? "All"}) queued. Link will be sent to ${emailTo}.`,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }
}
