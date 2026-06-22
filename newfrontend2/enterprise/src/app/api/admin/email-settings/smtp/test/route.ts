import { NextResponse } from "next/server";
import { testAdminSmtpConnection } from "@/lib/admin/mocks/smtp-config-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = testAdminSmtpConnection(body);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "Connection test passed (mock)." });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }
}
